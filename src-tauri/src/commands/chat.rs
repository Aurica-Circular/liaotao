// commands/chat.rs — Streaming chat and stop

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use serde::Deserialize;
use tauri::{ipc::Channel, State};
use tokio::sync::Notify;

use crate::engine::{self, ChatMessage, ChatRequest, StreamEvent};
use crate::settings::SettingsStore;

/// Stop signals of the generations in progress, by generation id.
#[derive(Default)]
pub struct Generations(Mutex<HashMap<String, Arc<Notify>>>);

/// What the interface sends: the engine by id; its key never leaves the backend.
#[derive(Debug, Deserialize)]
pub struct ChatInput {
    pub engine_id:   String,
    pub model:       String,
    pub messages:    Vec<ChatMessage>,
    #[serde(default)]
    pub temperature: Option<f32>,
}

/// Stream one answer to `on_event`. Returns when the generation has ended.
#[tauri::command]
pub async fn chat_stream(
    id: String,
    input: ChatInput,
    on_event: Channel<StreamEvent>,
    generations: State<'_, Generations>,
    store: State<'_, SettingsStore>,
) -> Result<(), String> {
    let request = ChatRequest {
        engine: store.engine(&input.engine_id)?,
        model: input.model,
        messages: input.messages,
        temperature: input.temperature,
    };
    let stop = Arc::new(Notify::new());
    generations.0.lock().map_err(|e| e.to_string())?.insert(id.clone(), stop.clone());

    let (engine_name, model) = (request.engine.name.clone(), request.model.clone());
    // Settings are logged by size only: prompts may be private.
    let system_chars: usize = request.messages.iter()
        .filter(|m| m.role == "system")
        .map(|m| m.content.chars().count())
        .sum();
    tracing::info!(
        id = %id, engine = %engine_name, model = %model,
        temperature = ?request.temperature, messages = request.messages.len(), system_chars,
        "generation started"
    );

    engine::stream_chat(&request, &stop, |event| {
        match &event {
            StreamEvent::Finished { stopped, metrics: m, .. } => tracing::info!(
                id = %id, engine = %engine_name, model = %model, stopped,
                duration_ms = m.duration_ms,
                first_token_ms = ?m.first_token_ms,
                thinking_ms = ?m.thinking_ms,
                writing_ms = ?m.writing_ms,
                answer_chars = m.answer_chars,
                thinking_chars = m.thinking_chars,
                prompt_tokens = ?m.prompt_tokens,
                completion_tokens = ?m.completion_tokens,
                speed = ?m.speed,
                speed_unit = m.speed_unit,
                "generation finished"
            ),
            StreamEvent::Failed { message } => tracing::warn!(
                id = %id, engine = %engine_name, model = %model, error = %message, "generation failed"
            ),
            _ => {}
        }
        // The window may have been closed meanwhile; nothing left to inform.
        let _ = on_event.send(event);
    })
    .await;

    generations.0.lock().map_err(|e| e.to_string())?.remove(&id);
    Ok(())
}

/// Stop a generation. Unknown or already finished ids are ignored.
#[tauri::command]
pub fn chat_stop(id: String, generations: State<'_, Generations>) -> Result<(), String> {
    if let Some(stop) = generations.0.lock().map_err(|e| e.to_string())?.get(&id) {
        stop.notify_one();
    }
    Ok(())
}
