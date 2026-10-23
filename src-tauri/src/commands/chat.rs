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
    tracing::info!(id = %id, engine = %engine_name, model = %model, "generation started");

    engine::stream_chat(&request, &stop, |event| {
        match &event {
            StreamEvent::Finished { duration_ms, stopped, .. } => tracing::info!(
                id = %id, engine = %engine_name, model = %model, duration_ms, stopped, "generation finished"
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
