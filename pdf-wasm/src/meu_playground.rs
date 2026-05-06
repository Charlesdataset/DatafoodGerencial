// src/meu_playground.rs
use pdf_writer::{Content, Finish, Name, Pdf, Rect, Ref, Str};
use serde::Deserialize;
use wasm_bindgen::prelude::*;

use crate::rounded_rect_path;

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const PAGE_W: f32 = 595.28;
const PAGE_H: f32 = 841.89;
const MARGIN: f32 = 50.0;

// ─── SUA CONFIGURAÇÃO ────────────────────────────────────────────────────────
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeuConfig {
    pub titulo: String,
    pub mensagem: String,
    pub cor_principal: Option<[f32; 3]>,
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────
#[wasm_bindgen]
pub fn gerar_pdf_brincadeira(config_json: &str) -> Result<Vec<u8>, JsError> {
    let cfg: MeuConfig =
        serde_json::from_str(config_json).map_err(|e| JsError::new(&e.to_string()))?;

    criar_pdf_simples(&cfg).map_err(|e| JsError::new(&e))
}

// ─── CRIA O PDF ────────────────────────────────────────────────────────────────
fn criar_pdf_simples(cfg: &MeuConfig) -> Result<Vec<u8>, String> {
    let mut pdf = Pdf::new();

    let catalog_id = Ref::new(1);
    let pages_id = Ref::new(2);
    let page_id = Ref::new(3);
    let content_id = Ref::new(4);
    let font_id = Ref::new(5);

    pdf.catalog(catalog_id).pages(pages_id);

    let mut pages = pdf.pages(pages_id);
    pages.media_box(Rect::new(0.0, 0.0, PAGE_W, PAGE_H));
    pages.kids([page_id]);
    pages.finish();

    // Fonte
    {
        let mut f = pdf.type1_font(font_id);
        f.base_font(Name(b"Helvetica"));
        f.encoding_predefined(Name(b"WinAnsiEncoding"));
    }

    let cor = cfg.cor_principal.unwrap_or([0.9, 0.3, 0.2]);

    let mut content = Content::new();

    // Fundo branco
    content.set_fill_rgb(1.0, 1.0, 1.0);
    content.rect(0.0, 0.0, PAGE_W, PAGE_H);
    content.fill_nonzero();

    // Título
    let titulo_bytes = to_win_ansi(&cfg.titulo);
    content.begin_text();
    content.set_fill_rgb(cor[0], cor[1], cor[2]);
    content.set_font(Name(b"F1"), 24.0);
    content.set_text_matrix([1.0, 0.0, 0.0, 1.0, MARGIN, PAGE_H - 100.0]);
    content.show(Str(&titulo_bytes));
    content.end_text();

    // Mensagem
    let msg_bytes = to_win_ansi(&cfg.mensagem);
    content.begin_text();
    content.set_fill_rgb(0.2, 0.2, 0.2);
    content.set_font(Name(b"F1"), 14.0);
    content.set_text_matrix([1.0, 0.0, 0.0, 1.0, MARGIN, PAGE_H - 150.0]);
    content.show(Str(&msg_bytes));
    content.end_text();

    // Retângulo decorativo
    let rect_w = 100.0;
    let rect_h = 50.0;
    let rect_x = MARGIN;
    let rect_y = PAGE_H - 200.0;
    let radius = 10.0; // <- raio da borda (quanto maior, mais redondo)

    content.set_fill_rgb(cor[0] * 0.8, cor[1] * 0.8, cor[2] * 0.8);
    rounded_rect_path(&mut content, rect_x, rect_y, rect_w, rect_h, radius);
    content.fill_nonzero();
    // Finaliza
    let content_bytes = content.finish();

    let mut page = pdf.page(page_id);
    page.parent(pages_id);
    page.media_box(Rect::new(0.0, 0.0, PAGE_W, PAGE_H));
    {
        let mut res = page.resources();
        let mut fonts = res.fonts();
        fonts.pair(Name(b"F1"), font_id);
        fonts.finish();
    }
    page.contents(content_id);
    page.finish();

    pdf.stream(content_id, &content_bytes);

    Ok(pdf.finish())
}

// ─── HELPER SIMPLES ─────────────────────────────────────────────────────────
fn to_win_ansi(s: &str) -> Vec<u8> {
    s.chars()
        .map(|c| match c {
            '\x20'..='\x7E' => c as u8,
            'á' => 0xE1,
            'ã' => 0xE3,
            'ç' => 0xE7,
            'é' => 0xE9,
            'í' => 0xED,
            'ó' => 0xF3,
            'ú' => 0xFA,
            'â' => 0xE2,
            'ê' => 0xEA,
            'ô' => 0xF4,
            'õ' => 0xF5,
            _ => b'?',
        })
        .collect()
}
