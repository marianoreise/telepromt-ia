// Ocultar consola en Windows en release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    pmodule_lib::run()
}
