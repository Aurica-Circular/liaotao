// liaotao-diag.rs — Ask an engine whether it answers, without opening the app.
//
// Usage: npm run diag -- [base_url] [api_key]
// Default base_url: http://localhost:11434/v1 (Ollama). Prints one line:
//   UP    <url>  <n> models  <ms> ms
//   DOWN  <url>  <raw error>          (exit code 1)

use std::time::Instant;

use liaotao_lib::engine::{list_models, Engine};

fn main() {
    let mut args = std::env::args().skip(1);
    let base_url = args.next().unwrap_or_else(|| "http://localhost:11434/v1".into());
    let engine = Engine { name: "diag".into(), base_url: base_url.clone(), api_key: args.next() };

    let started = Instant::now();
    let result = tauri::async_runtime::block_on(list_models(&engine));
    let ms = started.elapsed().as_millis();

    match result {
        Ok(models) => println!("UP    {base_url}  {} models  {ms} ms", models.len()),
        Err(e) => {
            println!("DOWN  {base_url}  {e}");
            std::process::exit(1);
        }
    }
}
