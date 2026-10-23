// engine/client.rs — HTTP calls to an OpenAI-compatible engine, with streaming

use std::time::{Duration, Instant};

use serde_json::{json, Value};
use tokio::sync::Notify;

use super::sse::{SseBuffer, SseItem};
use super::{ChatRequest, Engine, StreamEvent};

const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);
const LIST_TIMEOUT:    Duration = Duration::from_secs(10);

fn http() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .connect_timeout(CONNECT_TIMEOUT)
        .build()
        .map_err(raw_error)
}

fn url(engine: &Engine, path: &str) -> String {
    format!("{}/{}", engine.base_url.trim_end_matches('/'), path)
}

fn authorize(rb: reqwest::RequestBuilder, engine: &Engine) -> reqwest::RequestBuilder {
    match engine.api_key.as_deref().filter(|k| !k.is_empty()) {
        Some(key) => rb.bearer_auth(key),
        None => rb,
    }
}

/// The full error chain, unrephrased: the user must see the real cause.
fn raw_error(e: reqwest::Error) -> String {
    use std::error::Error;
    let mut msg = e.to_string();
    let mut source = e.source();
    while let Some(s) = source {
        msg.push_str(": ");
        msg.push_str(&s.to_string());
        source = s.source();
    }
    msg
}

async fn http_failure(resp: reqwest::Response) -> String {
    let status = resp.status();
    let body = resp.text().await.unwrap_or_default();
    format!("HTTP {status}: {}", body.trim())
}

/// Model ids the engine offers, sorted.
pub async fn list_models(engine: &Engine) -> Result<Vec<String>, String> {
    let rb = http()?.get(url(engine, "models")).timeout(LIST_TIMEOUT);
    let resp = authorize(rb, engine).send().await.map_err(raw_error)?;
    if !resp.status().is_success() {
        return Err(http_failure(resp).await);
    }
    let body: Value = resp.json().await.map_err(raw_error)?;
    let mut models: Vec<String> = body["data"]
        .as_array()
        .map(|list| list.iter().filter_map(|m| m["id"].as_str().map(String::from)).collect())
        .unwrap_or_default();
    models.sort();
    Ok(models)
}

/// Stream one answer. `emit` receives every event; the last one is always
/// `Finished` or `Failed`. A notification on `stop` ends the generation at once,
/// even while the engine is silent.
pub async fn stream_chat(req: &ChatRequest, stop: &Notify, mut emit: impl FnMut(StreamEvent)) {
    let started = Instant::now();
    let finished = |stopped: bool, last_chunk: Option<Value>| StreamEvent::Finished {
        duration_ms: started.elapsed().as_millis() as u64,
        stopped,
        last_chunk,
    };
    let failed = |message: String| StreamEvent::Failed { message };

    let mut body = json!({ "model": req.model, "messages": req.messages, "stream": true });
    if let Some(t) = req.temperature {
        body["temperature"] = json!(t);
    }
    let client = match http() {
        Ok(c) => c,
        Err(e) => return emit(failed(e)),
    };
    let send = authorize(client.post(url(&req.engine, "chat/completions")).json(&body), &req.engine).send();

    let mut resp = tokio::select! {
        r = send => match r {
            Ok(r) if r.status().is_success() => r,
            Ok(r) => return emit(failed(http_failure(r).await)),
            Err(e) => return emit(failed(raw_error(e))),
        },
        _ = stop.notified() => return emit(finished(true, None)),
    };
    emit(StreamEvent::Started);

    let mut sse = SseBuffer::default();
    let mut last_chunk = None;
    loop {
        let chunk = tokio::select! {
            c = resp.chunk() => c,
            _ = stop.notified() => return emit(finished(true, last_chunk)),
        };
        let bytes = match chunk {
            Ok(Some(bytes)) => bytes,
            Ok(None) => return emit(finished(false, last_chunk)), // closed without [DONE]
            Err(e) => return emit(failed(raw_error(e))),
        };
        for item in sse.push(&bytes) {
            let data = match item {
                SseItem::Done => return emit(finished(false, last_chunk)),
                SseItem::Data(data) => data,
            };
            let value: Value = match serde_json::from_str(&data) {
                Ok(v) => v,
                Err(_) => return emit(failed(format!("Unreadable stream data: {data}"))),
            };
            if let Some(err) = value.get("error") {
                return emit(failed(err.to_string()));
            }
            if let Some(text) = value["choices"][0]["delta"]["content"].as_str() {
                if !text.is_empty() {
                    emit(StreamEvent::Delta { text: text.to_string() });
                }
            }
            last_chunk = Some(value);
        }
    }
}

// ---------------------------------------------------------------------------
// Live tests: need a local Ollama with the model below. Run: ./verify.sh --live
#[cfg(test)]
mod live_tests {
    use super::*;
    use crate::engine::ChatMessage;
    use std::sync::Arc;

    const OLLAMA: &str = "http://localhost:11434/v1";
    const MODEL:  &str = "granite4.2:3b";

    fn request(prompt: &str) -> ChatRequest {
        ChatRequest {
            engine: Engine { name: "Ollama".into(), base_url: OLLAMA.into(), api_key: None },
            model: MODEL.into(),
            messages: vec![ChatMessage { role: "user".into(), content: prompt.into() }],
            temperature: Some(0.0),
        }
    }

    #[tokio::test]
    #[ignore]
    async fn streams_several_pieces_then_finishes() {
        let stop = Notify::new();
        let mut events = Vec::new();
        stream_chat(&request("Count from 1 to 20, comma separated."), &stop, |e| events.push(e)).await;

        let deltas = events.iter().filter(|e| matches!(e, StreamEvent::Delta { .. })).count();
        assert!(matches!(events.first(), Some(StreamEvent::Started)), "{events:?}");
        assert!(deltas > 3, "expected a stream, got {deltas} pieces");
        assert!(matches!(events.last(), Some(StreamEvent::Finished { stopped: false, .. })), "{events:?}");
    }

    #[tokio::test]
    #[ignore]
    async fn stop_ends_a_long_generation_at_once() {
        let stop = Arc::new(Notify::new());
        let trigger = stop.clone();
        let mut events = Vec::new();
        let mut deltas = 0;
        stream_chat(&request("Write a 2000-word essay about rivers."), &stop, |e| {
            if matches!(e, StreamEvent::Delta { .. }) {
                deltas += 1;
                if deltas == 3 {
                    trigger.notify_one();
                }
            }
            events.push(e);
        })
        .await;

        assert!(matches!(events.last(), Some(StreamEvent::Finished { stopped: true, .. })), "{events:?}");
        assert!(deltas < 50, "kept streaming after stop: {deltas} pieces");
    }

    #[tokio::test]
    #[ignore]
    async fn unreachable_engine_reports_the_raw_cause() {
        let mut req = request("hi");
        req.engine.base_url = "http://localhost:9/v1".into();
        let mut events = Vec::new();
        stream_chat(&req, &Notify::new(), |e| events.push(e)).await;

        match events.as_slice() {
            [StreamEvent::Failed { message }] => assert!(message.contains("Connection refused"), "{message}"),
            other => panic!("expected one Failed event, got {other:?}"),
        }
    }
}
