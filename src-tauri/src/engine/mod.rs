// engine/mod.rs — Talks to any OpenAI-compatible engine (Ollama, AiTao, ...)

mod client;
mod sse;

pub use client::{list_models, stream_chat};

use serde::{Deserialize, Serialize};

/// Where to reach an engine. The API key is never logged.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Engine {
    pub name:     String,
    pub base_url: String,
    #[serde(default)]
    pub api_key:  Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ChatMessage {
    pub role:    String, // "system" | "user" | "assistant"
    pub content: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ChatRequest {
    pub engine:      Engine,
    pub model:       String,
    pub messages:    Vec<ChatMessage>,
    #[serde(default)]
    pub temperature: Option<f32>,
}

/// What the interface receives while an answer is generated.
/// Exactly one `Finished` or `Failed` ends every generation.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "event", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum StreamEvent {
    /// The engine accepted the request; text follows.
    Started,
    /// A piece of the answer, to append.
    Delta { text: String },
    /// The answer is complete, or was stopped by the user.
    /// `last_chunk` is the engine's final raw chunk (AiTao puts sources there).
    Finished { duration_ms: u64, stopped: bool, last_chunk: Option<serde_json::Value> },
    /// The engine failed; `message` is the raw cause, never rephrased.
    Failed { message: String },
}
