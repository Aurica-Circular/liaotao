// errors.rs — Central error types
// All modules return these; callers never handle raw std::io::Error.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Config error: {0}")]
    Config(String),

    #[error("Path error: {0}")]
    Path(String),

    #[error("Logger error: {0}")]
    Logger(String),

    #[error("Tauri error: {0}")]
    Tauri(String),

    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Network error: {0}")]
    Network(String),

    #[error("API error: {0}")]
    API(String),

    #[error("Parse error: {0}")]
    Parse(String),

    #[error("Stream ended")]
    StreamEnded,

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

// Conversion for Tauri commands
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}

#[allow(dead_code)]
pub type AppResult<T> = Result<T, AppError>;