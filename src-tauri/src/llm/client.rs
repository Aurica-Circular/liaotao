// llm/client.rs — LLM client trait and implementations

use async_trait::async_trait;
use reqwest::{Client, header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE}};
use futures::Stream;
use std::pin::Pin;
use crate::llm::types::*;
use crate::errors::AppError;

/// Trait for LLM provider clients
#[async_trait]
pub trait LLMClient: Send + Sync {
    /// Send a chat completion request (non-streaming)
    async fn chat_completion(&self, request: ChatCompletionRequest) -> Result<ChatCompletionResponse, AppError>;

    /// Send a streaming chat completion request
    async fn stream_chat_completion(&self, request: ChatCompletionRequest) -> Result<Pin<Box<dyn Stream<Item = Result<ChatCompletionChunk, AppError>> + Send>>, AppError>;

    /// List available models
    async fn list_models(&self) -> Result<Vec<String>, AppError>;

    /// Test connection
    async fn test_connection(&self) -> Result<bool, AppError>;

    /// Get provider type
    fn provider_type(&self) -> ProviderType;
}

/// Base client with common functionality
pub struct BaseClient {
    client: Client,
    config: ProviderConfig,
}

impl BaseClient {
    pub fn new(config: ProviderConfig) -> Result<Self, AppError> {
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        if let Some(api_key) = &config.api_key {
            let auth_value = HeaderValue::from_str(&format!("Bearer {}", api_key))
                .map_err(|e| AppError::Config(format!("Invalid API key: {}", e)))?;
            headers.insert(AUTHORIZATION, auth_value);
        }

        if let Some(custom_headers) = &config.headers {
            for (key, value) in custom_headers {
                if let (Ok(k), Ok(v)) = (key.parse(), value.parse()) {
                    headers.insert(k, v);
                }
            }
        }

        let client = Client::builder()
            .default_headers(headers)
            .timeout(std::time::Duration::from_millis(config.timeout))
            .build()
            .map_err(|e| AppError::Network(e.to_string()))?;

        Ok(Self { client, config })
    }

    fn chat_completions_url(&self) -> String {
        format!("{}/chat/completions", self.config.endpoint.trim_end_matches('/'))
    }

    fn models_url(&self) -> String {
        match self.config.r#type {
            ProviderType::Ollama => format!("{}/api/tags", self.config.endpoint.trim_end_matches('/')),
            _ => format!("{}/models", self.config.endpoint.trim_end_matches('/')),
        }
    }
}

#[async_trait]
impl LLMClient for BaseClient {
    async fn chat_completion(&self, request: ChatCompletionRequest) -> Result<ChatCompletionResponse, AppError> {
        let response = self.client
            .post(self.chat_completions_url())
            .json(&request)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::API(format!("HTTP {}: {}", status, error_text)));
        }

        let result = response.json::<ChatCompletionResponse>().await
            .map_err(|e| AppError::Parse(e.to_string()))?;

        Ok(result)
    }

    async fn stream_chat_completion(&self, request: ChatCompletionRequest) -> Result<Pin<Box<dyn Stream<Item = Result<ChatCompletionChunk, AppError>> + Send>>, AppError> {
        let mut req = ChatCompletionRequest { stream: Some(true), ..request };
        let response = self.client
            .post(self.chat_completions_url())
            .json(&req)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::API(format!("HTTP {}: {}", status, error_text)));
        }

        let stream = response.bytes_stream().map(|chunk_result| {
            chunk_result
                .map_err(|e| AppError::Network(e.to_string()))
                .and_then(|chunk| parse_sse_chunk(&chunk))
        });

        Ok(Box::pin(stream))
    }

    async fn list_models(&self) -> Result<Vec<String>, AppError> {
        let response = self.client
            .get(self.models_url())
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::API(format!("HTTP {}: {}", status, error_text)));
        }

        match self.config.r#type {
            ProviderType::Ollama => {
                let result = response.json::<OllamaModelsResponse>().await
                    .map_err(|e| AppError::Parse(e.to_string()))?;
                Ok(result.models.into_iter().map(|m| m.name).collect())
            }
            _ => {
                let result = response.json::<ModelsResponse>().await
                    .map_err(|e| AppError::Parse(e.to_string()))?;
                Ok(result.data.into_iter().map(|m| m.id).collect())
            }
        }
    }

    async fn test_connection(&self) -> Result<bool, AppError> {
        match self.list_models().await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    fn provider_type(&self) -> ProviderType {
        self.config.r#type.clone()
    }
}

/// Parse Server-Sent Events chunk
fn parse_sse_chunk(chunk: &[u8]) -> Result<ChatCompletionChunk, AppError> {
    let text = std::str::from_utf8(chunk).map_err(|e| AppError::Parse(e.to_string()))?;

    for line in text.lines() {
        let line = line.trim();
        if line.starts_with("data: ") {
            let data = &line[6..];
            if data == "[DONE]" {
                return Err(AppError::StreamEnded);
            }
            let chunk: ChatCompletionChunk = serde_json::from_str(data)
                .map_err(|e| AppError::Parse(e.to_string()))?;
            return Ok(chunk);
        }
    }

    Err(AppError::Parse("No valid SSE data in chunk".to_string()))
}

/// Factory to create provider clients
pub fn create_client(config: ProviderConfig) -> Result<Box<dyn LLMClient>, AppError> {
    match config.r#type {
        ProviderType::OpenAI | ProviderType::LlamaCpp => {
            Ok(Box::new(BaseClient::new(config)?))
        }
        ProviderType::Ollama => {
            Ok(Box::new(OllamaClient::new(config)?))
        }
    }
}

/// Ollama-specific client (uses /api/chat endpoint)
pub struct OllamaClient {
    client: Client,
    config: ProviderConfig,
}

impl OllamaClient {
    pub fn new(config: ProviderConfig) -> Result<Self, AppError> {
        let client = Client::builder()
            .timeout(std::time::Duration::from_millis(config.timeout))
            .build()
            .map_err(|e| AppError::Network(e.to_string()))?;

        Ok(Self { client, config })
    }

    fn chat_url(&self) -> String {
        format!("{}/api/chat", self.config.endpoint.trim_end_matches('/'))
    }

    fn tags_url(&self) -> String {
        format!("{}/api/tags", self.config.endpoint.trim_end_matches('/'))
    }
}

#[async_trait]
impl LLMClient for OllamaClient {
    async fn chat_completion(&self, request: ChatCompletionRequest) -> Result<ChatCompletionResponse, AppError> {
        let ollama_request = OllamaChatRequest {
            model: request.model,
            messages: request.messages.into_iter().map(Into::into).collect(),
            stream: false,
            options: None,
        };

        let response = self.client
            .post(self.chat_url())
            .json(&ollama_request)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::API(format!("HTTP {}: {}", status, error_text)));
        }

        let result = response.json::<OllamaChatResponse>().await
            .map_err(|e| AppError::Parse(e.to_string()))?;

        Ok(result.into())
    }

    async fn stream_chat_completion(&self, request: ChatCompletionRequest) -> Result<Pin<Box<dyn Stream<Item = Result<ChatCompletionChunk, AppError>> + Send>>, AppError> {
        let ollama_request = OllamaChatRequest {
            model: request.model,
            messages: request.messages.into_iter().map(Into::into).collect(),
            stream: true,
            options: None,
        };

        let response = self.client
            .post(self.chat_url())
            .json(&ollama_request)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::API(format!("HTTP {}: {}", status, error_text)));
        }

        let stream = response.bytes_stream().map(|chunk_result| {
            chunk_result
                .map_err(|e| AppError::Network(e.to_string()))
                .and_then(|chunk| parse_ollama_sse_chunk(&chunk))
        });

        Ok(Box::pin(stream))
    }

    async fn list_models(&self) -> Result<Vec<String>, AppError> {
        let response = self.client
            .get(self.tags_url())
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::API(format!("HTTP {}: {}", status, error_text)));
        }

        let result = response.json::<OllamaModelsResponse>().await
            .map_err(|e| AppError::Parse(e.to_string()))?;

        Ok(result.models.into_iter().map(|m| m.name).collect())
    }

    async fn test_connection(&self) -> Result<bool, AppError> {
        match self.list_models().await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    fn provider_type(&self) -> ProviderType {
        ProviderType::Ollama
    }
}

// Ollama-specific request/response types
#[derive(Debug, Serialize)]
struct OllamaChatRequest {
    model: String,
    messages: Vec<OllamaMessage>,
    stream: bool,
    options: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaMessage {
    role: String,
    content: String,
}

impl From<ChatMessage> for OllamaMessage {
    fn from(msg: ChatMessage) -> Self {
        Self {
            role: match msg.role {
                MessageRole::System => "system",
                MessageRole::User => "user",
                MessageRole::Assistant => "assistant",
                MessageRole::Tool => "tool",
            }.to_string(),
            content: msg.content,
        }
    }
}

#[derive(Debug, Deserialize)]
struct OllamaChatResponse {
    model: String,
    created_at: String,
    message: OllamaMessage,
    done: bool,
    total_duration: Option<u64>,
    load_duration: Option<u64>,
    prompt_eval_count: Option<u32>,
    prompt_eval_duration: Option<u64>,
    eval_count: Option<u32>,
    eval_duration: Option<u64>,
}

impl From<OllamaChatResponse> for ChatCompletionResponse {
    fn from(resp: OllamaChatResponse) -> Self {
        Self {
            id: format!("ollama-{}", chrono::Utc::now().timestamp_millis()),
            object: "chat.completion".to_string(),
            created: chrono::DateTime::parse_from_rfc3339(&resp.created_at)
                .map(|dt| dt.timestamp())
                .unwrap_or_else(|_| chrono::Utc::now().timestamp()),
            model: resp.model,
            choices: vec![ChatCompletionChoice {
                index: 0,
                message: ChatMessage {
                    role: match resp.message.role.as_str() {
                        "system" => MessageRole::System,
                        "user" => MessageRole::User,
                        "assistant" => MessageRole::Assistant,
                        "tool" => MessageRole::Tool,
                        _ => MessageRole::Assistant,
                    },
                    content: resp.message.content,
                    name: None,
                },
                finish_reason: if resp.done { Some("stop".to_string()) } else { None },
            }],
            usage: resp.eval_count.zip(resp.prompt_eval_count).map(|(completion, prompt)| Usage {
                prompt_tokens: prompt,
                completion_tokens: completion,
                total_tokens: prompt + completion,
            }),
        }
    }
}

fn parse_ollama_sse_chunk(chunk: &[u8]) -> Result<ChatCompletionChunk, AppError> {
    let text = std::str::from_utf8(chunk).map_err(|e| AppError::Parse(e.to_string()))?;

    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() { continue; }

        let resp: OllamaChatResponse = serde_json::from_str(line)
            .map_err(|e| AppError::Parse(e.to_string()))?;

        let chunk = ChatCompletionChunk {
            id: format!("ollama-{}", chrono::Utc::now().timestamp_millis()),
            object: "chat.completion.chunk".to_string(),
            created: chrono::Utc::now().timestamp(),
            model: resp.model.clone(),
            choices: vec![ChatCompletionChunkChoice {
                index: 0,
                delta: ChatMessageDelta {
                    role: if resp.message.role == "assistant" { Some(MessageRole::Assistant) } else { None },
                    content: if resp.message.content.is_empty() { None } else { Some(resp.message.content) },
                },
                finish_reason: if resp.done { Some("stop".to_string()) } else { None },
            }],
        };

        return Ok(chunk);
    }

    Err(AppError::Parse("No valid Ollama SSE data in chunk".to_string()))
}