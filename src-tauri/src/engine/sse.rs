// engine/sse.rs — Incremental parser for Server-Sent Events "data:" lines

/// One meaningful line of the stream.
#[derive(Debug, PartialEq)]
pub enum SseItem {
    Data(String),
    Done,
}

/// Accumulates network chunks, which may cut a line (or a UTF-8 character)
/// anywhere, and yields only complete lines.
#[derive(Default)]
pub struct SseBuffer {
    pending: Vec<u8>,
}

impl SseBuffer {
    pub fn push(&mut self, bytes: &[u8]) -> Vec<SseItem> {
        self.pending.extend_from_slice(bytes);
        let mut items = Vec::new();
        while let Some(pos) = self.pending.iter().position(|&b| b == b'\n') {
            let raw: Vec<u8> = self.pending.drain(..=pos).collect();
            let line = String::from_utf8_lossy(&raw);
            // Comments (": keep-alive"), "event:" and "id:" lines are ignored.
            if let Some(data) = line.trim().strip_prefix("data:") {
                let data = data.trim();
                if data == "[DONE]" {
                    items.push(SseItem::Done);
                } else if !data.is_empty() {
                    items.push(SseItem::Data(data.to_string()));
                }
            }
        }
        items
    }
}

// ---------------------------------------------------------------------------
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn yields_complete_lines_only() {
        let mut buf = SseBuffer::default();
        assert!(buf.push(b"data: {\"a\"").is_empty());
        assert_eq!(buf.push(b":1}\n\n"), vec![SseItem::Data("{\"a\":1}".into())]);
    }

    #[test]
    fn recognises_done_and_skips_comments() {
        let mut buf = SseBuffer::default();
        let items = buf.push(b": keep-alive\ndata: x\r\n\ndata: [DONE]\n\n");
        assert_eq!(items, vec![SseItem::Data("x".into()), SseItem::Done]);
    }

    #[test]
    fn keeps_utf8_split_across_chunks() {
        let mut buf = SseBuffer::default();
        let text = "data: 聊天\n".as_bytes();
        assert!(buf.push(&text[..8]).is_empty()); // cuts inside a character
        assert_eq!(buf.push(&text[8..]), vec![SseItem::Data("聊天".into())]);
    }
}
