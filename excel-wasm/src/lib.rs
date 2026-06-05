use wasm_bindgen::prelude::*;

mod excel_v1;
mod excel_v3;
mod models;
mod modelsv3;
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn gerar_excel(json: &str) -> Vec<u8> {
    // excel_v1::gerar(json)
    excel_v3::gerar(json)
}
