// engine/metrics.rs — Measures one generation: timings, sizes, tokens, speed
//
// The same numbers go to the interface and to the log, so what the user sees
// is what a diagnosis can rely on.

use std::time::Instant;

use serde::Serialize;
use serde_json::Value;

#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationMetrics {
    /// Request sent → end.
    pub duration_ms: u64,
    /// Request sent → first piece of thought or answer. Model loading shows here.
    pub first_token_ms: Option<u64>,
    /// First piece of thought → first piece of answer (thinking models only).
    pub thinking_ms: Option<u64>,
    /// First piece of answer → end.
    pub writing_ms: Option<u64>,
    pub answer_chars: usize,
    pub thinking_chars: usize,
    /// Reported by the engine when it supports `stream_options.include_usage`.
    pub prompt_tokens: Option<u64>,
    pub completion_tokens: Option<u64>,
    /// Generation speed from the first piece to the end, in `speed_unit`.
    pub speed: Option<f64>,
    /// "tokens/s" when the engine reports tokens, otherwise "chars/s".
    pub speed_unit: &'static str,
}

pub struct Meter {
    started:       Instant,
    first_any:     Option<Instant>,
    first_thought: Option<Instant>,
    first_answer:  Option<Instant>,
    answer_chars:  usize,
    thinking_chars: usize,
    prompt_tokens: Option<u64>,
    completion_tokens: Option<u64>,
}

impl Meter {
    pub fn start() -> Self {
        Self {
            started: Instant::now(),
            first_any: None,
            first_thought: None,
            first_answer: None,
            answer_chars: 0,
            thinking_chars: 0,
            prompt_tokens: None,
            completion_tokens: None,
        }
    }

    pub fn thinking(&mut self, text: &str) {
        let now = Instant::now();
        self.first_any.get_or_insert(now);
        self.first_thought.get_or_insert(now);
        self.thinking_chars += text.chars().count();
    }

    pub fn answer(&mut self, text: &str) {
        let now = Instant::now();
        self.first_any.get_or_insert(now);
        self.first_answer.get_or_insert(now);
        self.answer_chars += text.chars().count();
    }

    /// Reads `usage` from a raw chunk, when the engine sends it (usually the last).
    pub fn usage(&mut self, chunk: &Value) {
        let usage = &chunk["usage"];
        if let Some(n) = usage["prompt_tokens"].as_u64() {
            self.prompt_tokens = Some(n);
        }
        if let Some(n) = usage["completion_tokens"].as_u64() {
            self.completion_tokens = Some(n);
        }
    }

    pub fn finish(&self) -> GenerationMetrics {
        let end = Instant::now();
        let ms = |from: Instant, to: Instant| to.duration_since(from).as_millis() as u64;
        let generating_ms = self.first_any.map(|t| ms(t, end));
        let (units, speed_unit) = match self.completion_tokens {
            Some(tokens) => (tokens as f64, "tokens/s"),
            None => ((self.answer_chars + self.thinking_chars) as f64, "chars/s"),
        };
        GenerationMetrics {
            duration_ms: ms(self.started, end),
            first_token_ms: self.first_any.map(|t| ms(self.started, t)),
            thinking_ms: match (self.first_thought, self.first_answer) {
                (Some(t), Some(a)) => Some(ms(t, a)),
                (Some(t), None) => Some(ms(t, end)),
                _ => None,
            },
            writing_ms: self.first_answer.map(|a| ms(a, end)),
            answer_chars: self.answer_chars,
            thinking_chars: self.thinking_chars,
            prompt_tokens: self.prompt_tokens,
            completion_tokens: self.completion_tokens,
            speed: generating_ms.and_then(|g| speed(units, g)),
            speed_unit,
        }
    }
}

/// Units per second, or None when the window is too short to mean anything.
fn speed(units: f64, window_ms: u64) -> Option<f64> {
    (window_ms >= 50 && units > 0.0).then(|| (units * 1000.0 / window_ms as f64 * 10.0).round() / 10.0)
}

// ---------------------------------------------------------------------------
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn counts_characters_not_bytes() {
        let mut m = Meter::start();
        m.answer("聊道");
        m.thinking("ok");
        let r = m.finish();
        assert_eq!((r.answer_chars, r.thinking_chars), (2, 2));
        assert!(r.first_token_ms.is_some());
    }

    #[test]
    fn prefers_engine_tokens_over_characters() {
        let mut m = Meter::start();
        m.answer("hello");
        m.usage(&json!({ "usage": { "prompt_tokens": 12, "completion_tokens": 40 } }));
        let r = m.finish();
        assert_eq!((r.prompt_tokens, r.completion_tokens), (Some(12), Some(40)));
        assert_eq!(r.speed_unit, "tokens/s");
    }

    #[test]
    fn nothing_received_means_no_speed_and_no_first_token() {
        let r = Meter::start().finish();
        assert_eq!((r.first_token_ms, r.speed, r.speed_unit), (None, None, "chars/s"));
    }

    #[test]
    fn speed_is_rounded_and_needs_a_real_window() {
        assert_eq!(speed(100.0, 2000), Some(50.0));
        assert_eq!(speed(10.0, 3000), Some(3.3));
        assert_eq!(speed(100.0, 10), None);
        assert_eq!(speed(0.0, 2000), None);
    }
}
