// main.rs — Application entry point for Liaotao AI Chat

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if let Err(e) = liaotao_lib::run() {
        eprintln!("liaotao: {e}");
        std::process::exit(1);
    }
}
