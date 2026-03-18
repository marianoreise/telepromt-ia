use tauri::{Manager, WebviewWindow};

// ── Invisibilidad Feature 1: WDA_EXCLUDEFROMCAPTURE ──────────
#[cfg(target_os = "windows")]
fn apply_screen_capture_exclusion(window: &WebviewWindow) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{
        SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE,
    };

    let hwnd = window.hwnd().expect("HWND no disponible");
    unsafe {
        let _ = SetWindowDisplayAffinity(HWND(hwnd.0 as *mut _), WDA_EXCLUDEFROMCAPTURE);
    }
}

#[cfg(not(target_os = "windows"))]
fn apply_screen_capture_exclusion(_window: &WebviewWindow) {}

// ── Comandos Tauri ────────────────────────────────────────────

#[tauri::command]
fn set_ignore_mouse(window: WebviewWindow, ignore: bool) {
    let _ = window.set_ignore_cursor_events(ignore);
}

#[tauri::command]
fn set_overlay_visible(window: WebviewWindow, visible: bool) {
    if visible {
        let _ = window.show();
    } else {
        let _ = window.hide();
    }
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// ── App runner ────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_deep_link::init())
        .invoke_handler(tauri::generate_handler![
            set_ignore_mouse,
            set_overlay_visible,
            get_app_version,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Feature 1: Invisible en screen share
            apply_screen_capture_exclusion(&window);

            // Feature 4: Mouse transparente al inicio (se activa al recibir foco)
            let _ = window.set_ignore_cursor_events(true);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error al iniciar Telepromt IA");
}
