use tauri::{Emitter, Manager, WebviewWindow};

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

// ── Comando: capture_screenshot ───────────────────────────────
// Captura el monitor principal y devuelve un PNG en base64.
#[tauri::command]
fn capture_screenshot() -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    use image::ImageEncoder;
    use screenshots::Screen;

    let screens = Screen::all().map_err(|e| format!("Error al listar pantallas: {e}"))?;
    let screen = screens
        .into_iter()
        .next()
        .ok_or_else(|| "No se encontró ningún monitor".to_string())?;

    let captured = screen
        .capture()
        .map_err(|e| format!("Error al capturar pantalla: {e}"))?;

    // `captured` es xcap::image::RgbaImage (re-exportado por screenshots)
    let width = captured.width();
    let height = captured.height();
    let raw_pixels = captured.into_raw(); // Vec<u8> RGBA

    let mut png_bytes: Vec<u8> = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
    encoder
        .write_image(
            &raw_pixels,
            width,
            height,
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| format!("Error al codificar PNG: {e}"))?;

    Ok(STANDARD.encode(png_bytes))
}

// ── Comando: open_url ─────────────────────────────────────────
// Abre una URL en el navegador por defecto del sistema (Windows).
#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    std::process::Command::new("cmd")
        .args(["/C", "start", "", &url])
        .spawn()
        .map_err(|e| format!("Error al abrir URL: {e}"))?;
    Ok(())
}

// ── Comando: start_dragging ───────────────────────────────────
// Permite mover la ventana arrastrándola desde el frontend.
#[tauri::command]
fn start_dragging(window: WebviewWindow) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

// ── Comando: close_window ─────────────────────────────────────
#[tauri::command]
fn close_window(window: WebviewWindow) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

// ── Helpers para deep link ────────────────────────────────────
/// Extrae el valor de un query param de una URL raw (sin dependencias extra).
fn query_param<'a>(query: &'a str, key: &str) -> Option<String> {
    for pair in query.split('&') {
        let mut parts = pair.splitn(2, '=');
        if let (Some(k), Some(v)) = (parts.next(), parts.next()) {
            if k == key {
                // Decodificación mínima de %XX y +
                return Some(url_decode(v));
            }
        }
    }
    None
}

fn url_decode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.bytes().peekable();
    while let Some(b) = chars.next() {
        if b == b'%' {
            let h1 = chars.next().unwrap_or(b'0');
            let h2 = chars.next().unwrap_or(b'0');
            let hex = [h1, h2];
            if let Ok(hex_str) = std::str::from_utf8(&hex) {
                if let Ok(byte) = u8::from_str_radix(hex_str, 16) {
                    out.push(byte as char);
                    continue;
                }
            }
        } else if b == b'+' {
            out.push(' ');
            continue;
        }
        out.push(b as char);
    }
    out
}

// ── App runner ────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri_plugin_deep_link::DeepLinkExt;

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_deep_link::init())
        .invoke_handler(tauri::generate_handler![
            set_ignore_mouse,
            set_overlay_visible,
            get_app_version,
            capture_screenshot,
            open_url,
            start_dragging,
            close_window,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Feature 1: Invisible en screen share
            apply_screen_capture_exclusion(&window);

            // Feature 4: Mouse transparente — solo activo durante sesión activa, no al inicio
            let _ = window.set_ignore_cursor_events(false);

            // ── Deep link handler: listnr://auth?token=...&refresh=... ──
            let app_handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    let url_str = url.as_str();

                    // Solo procesar esquemas listnr:// y telepromt://
                    let is_listnr = url_str.starts_with("listnr://");
                    let is_telepromt = url_str.starts_with("telepromt://");
                    if !is_listnr && !is_telepromt {
                        continue;
                    }

                    // Extraer query string (todo lo que está después de '?')
                    let query = match url_str.find('?') {
                        Some(pos) => &url_str[pos + 1..],
                        None => continue,
                    };

                    let access_token = query_param(query, "token")
                        .or_else(|| query_param(query, "access_token"));
                    let refresh_token = query_param(query, "refresh")
                        .or_else(|| query_param(query, "refresh_token"));

                    if let Some(access) = access_token {
                        let payload = serde_json::json!({
                            "access_token": access,
                            "refresh_token": refresh_token.unwrap_or_default(),
                        });
                        let _ = app_handle.emit("auth-callback", payload);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error al iniciar ListnrIO");
}
