// ═══════════════════════════════════════════════════════════════════════════════
// flex_report.rs  —  Motor de relatório flexível / template engine
//
// Permite montar qualquer layout via JSON declarativo:
//   - Seções (header, body, footer) com children aninhados
//   - Texto, retângulo, container, colunas, tabela, totalizador, spacer
//   - Data binding via {{key}} com prefixo
//   - Estilo completo: cor, gradiente, border-radius, fonte, alinhamento
// ═══════════════════════════════════════════════════════════════════════════════

use std::collections::HashMap;

use pdf_writer::{Content, Finish, Name, Pdf, Rect, Ref, Str};
use serde::Deserialize;
use wasm_bindgen::prelude::*;

use crate::charts::{draw_bar_chart, draw_line_chart, draw_pie_chart, ChartData};
use crate::{hex_to_rgb, show_text, to_win_ansi, KAPPA, PAGE_H, PAGE_W};

// ─── Public API ───────────────────────────────────────────────────────────────

#[wasm_bindgen]
pub fn generate_flex_report(json: &str) -> Result<Vec<u8>, JsError> {
    let report: FlexReport =
        serde_json::from_str(json).map_err(|e| JsError::new(&e.to_string()))?;
    render_flex_report(&report).map_err(|e| JsError::new(&e))
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FlexReport {
    pub page: Option<PageConfig>,
    /// Fonte de dados externa (v2) — mapa de chave → array de objetos.
    /// Ex: { "dadosProduto": [...], "dadosServico": [...] }
    pub data_source: Option<HashMap<String, serde_json::Value>>,
    /// Array de dados — pode ser:
    /// - v1 (legado): array de objetos planos `[{...}, {...}]`
    /// - v2: array de DataBlock (`{ preHeader, dataHeader, dataBodyValue, body }`)
    ///      ou DataGroup (`{ groupKey, groupData }`)
    pub data: Option<Vec<serde_json::Value>>,
    /// Seções do relatório: header, body, footer...
    pub sections: Option<Vec<Section>>,
    /// Atalho: se vier "elements" diretamente (sem sections)
    pub elements: Option<Vec<Element>>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PageConfig {
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub margin: Option<f32>,
    pub background_color: Option<String>,
    /// Se true (default), o header repete em todas as páginas.
    /// Se false, header aparece apenas na primeira página.
    pub repeat_header: Option<bool>,
    /// Se true (default), o footer repete em todas as páginas.
    /// Se false, footer aparece apenas na última página.
    pub repeat_footer: Option<bool>,
}

/// Uma seção agrupa children com um estilo opcional.
/// O `type` pode ser "header" | "body" | "footer" (afeta padding/defaults).
#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Section {
    pub r#type: Option<String>,
    pub style: Option<SectionStyle>,
    pub children: Option<Vec<Element>>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SectionStyle {
    pub background_color: Option<String>,
    pub height: Option<f32>,
    pub padding: Option<f32>,
    pub border_radius: Option<Corners>,
    pub margin_bottom: Option<f32>,
}

/// Um elemento pode ser qualquer componente visual.
#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Element {
    pub r#type: String,
    // ── Texto ──
    pub value: Option<String>,
    pub key: Option<String>,
    pub prefix: Option<String>,
    pub suffix: Option<String>,
    // ── Posição (opcional — quando não vem, flui verticalmente) ──
    pub x: Option<f32>,
    pub y: Option<f32>,
    pub w: Option<f32>,
    pub h: Option<f32>,
    // ── Estilo ──
    pub style: Option<ElementStyle>,
    // ── Aninhamento ──
    pub children: Option<Vec<Element>>,
    // ── Colunas (para type="columns") ──
    pub columns: Option<Vec<ColumnDef>>,
    // ── Tabela (para type="table") ──
    pub table_columns: Option<Vec<TableColumnDef>>,
    // ── Totalizador (para type="totalizer") ──
    pub column: Option<String>,
    pub label: Option<String>,
    // ── Formatação ──
    pub format: Option<String>, // "number" | "currency" | "date"
    // ── Gráficos ──
    pub chart_type: Option<String>, // "bar" | "line" | "pie" | "donut"
    pub chart_labels: Option<Vec<String>>,
    pub chart_values: Option<Vec<f64>>,
    pub chart_colors: Option<Vec<String>>, // paleta customizada opcional
    pub chart_title: Option<String>,
    pub chart_data_source: Option<String>, // v2: nome da key no dataSource
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ElementStyle {
    pub background_color: Option<String>,
    pub color: Option<String>,
    pub font_size: Option<f32>,
    pub bold: Option<bool>,
    pub italic: Option<bool>,
    pub align: Option<String>, // "left" | "center" | "right" | "justify"
    pub vertical_align: Option<String>, // "top" | "middle" | "bottom"
    pub border_radius: Option<Corners>,
    pub padding: Option<f32>,
    pub padding_left: Option<f32>,
    pub padding_right: Option<f32>,
    pub padding_top: Option<f32>,
    pub padding_bottom: Option<f32>,
    pub margin: Option<f32>,
    pub margin_top: Option<f32>,
    pub margin_bottom: Option<f32>,
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub min_height: Option<f32>,
    pub border_color: Option<String>,
    pub border_width: Option<f32>,
    pub gradient: Option<GradientDef>,
    pub opacity: Option<f32>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GradientDef {
    pub direction: Option<String>, // "top-bottom" | "left-right" | "diagonal"
    pub colors: Vec<String>,       // cores hex: ["#1a3a6b", "#ff6600"]
}

/// Cantos com raios iguais ou individuais
#[derive(Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum Corners {
    All(f32),
    Four([f32; 4]), // [top-left, top-right, bottom-right, bottom-left]
}

impl Corners {
    fn top_left(&self) -> f32 {
        match self {
            Corners::All(r) => *r,
            Corners::Four(arr) => arr[0],
        }
    }
    fn top_right(&self) -> f32 {
        match self {
            Corners::All(r) => *r,
            Corners::Four(arr) => arr[1],
        }
    }
    fn bottom_right(&self) -> f32 {
        match self {
            Corners::All(r) => *r,
            Corners::Four(arr) => arr[2],
        }
    }
    fn bottom_left(&self) -> f32 {
        match self {
            Corners::All(r) => *r,
            Corners::Four(arr) => arr[3],
        }
    }
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ColumnDef {
    pub width: Option<String>, // "50%", "200" (absolute), "auto"
    pub style: Option<ElementStyle>,
    pub children: Option<Vec<Element>>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableColumnDef {
    pub key: Option<String>,
    pub prefix: Option<String>,
    pub width: Option<f32>,
    pub align: Option<String>,
    pub format: Option<String>,
    pub style: Option<ElementStyle>,
    pub children: Option<Vec<Element>>, // para custom render por célula
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

struct RenderContext<'a> {
    data: &'a [serde_json::Value],
    current_data_idx: usize,
    data_source: Option<&'a HashMap<String, serde_json::Value>>,
}

fn render_flex_report(report: &FlexReport) -> Result<Vec<u8>, String> {
    let pw = report.page.as_ref().and_then(|p| p.width).unwrap_or(PAGE_W);
    let ph = report
        .page
        .as_ref()
        .and_then(|p| p.height)
        .unwrap_or(PAGE_H);
    let margin = report.page.as_ref().and_then(|p| p.margin).unwrap_or(40.0);

    let data = report.data.as_deref().unwrap_or_default();
    let data_source = report.data_source.as_ref();
    let ctx = RenderContext {
        data,
        current_data_idx: 0,
        data_source,
    };

    // ── Setup PDF ──
    let mut pdf = Pdf::new();
    let mut next_id: i32 = 1;
    let mut alloc = || {
        let r = Ref::new(next_id);
        next_id += 1;
        r
    };

    let catalog_id = alloc();
    let pages_id = alloc();
    let font_regular_id = alloc();
    let font_bold_id = alloc();

    pdf.catalog(catalog_id).pages(pages_id);
    {
        let mut f = pdf.type1_font(font_regular_id);
        f.base_font(Name(b"Helvetica"));
        f.encoding_predefined(Name(b"WinAnsiEncoding"));
    }
    {
        let mut f = pdf.type1_font(font_bold_id);
        f.base_font(Name(b"Helvetica-Bold"));
        f.encoding_predefined(Name(b"WinAnsiEncoding"));
    }

    let bg_hex = report
        .page
        .as_ref()
        .and_then(|p| p.background_color.as_deref())
        .unwrap_or("#ffffff");
    let bg_rgb = hex_to_rgb(bg_hex);
    let fonts = ContentFonts {
        regular: Name(b"F1"),
        bold: Name(b"F2"),
    };

    // ── Separa sections por tipo ──
    let mut header_sections: Vec<Section> = Vec::new();
    let mut body_sections: Vec<Section> = Vec::new();
    let mut footer_sections: Vec<Section> = Vec::new();

    if let Some(ref sections) = report.sections {
        for section in sections {
            match section.r#type.as_deref() {
                Some("header") => header_sections.push(section.clone()),
                Some("footer") => footer_sections.push(section.clone()),
                _ => body_sections.push(section.clone()),
            }
        }
    }

    let repeat_header = report
        .page
        .as_ref()
        .and_then(|p| p.repeat_header)
        .unwrap_or(true);
    let repeat_footer = report
        .page
        .as_ref()
        .and_then(|p| p.repeat_footer)
        .unwrap_or(true);

    // ── Estima alturas de header e footer ──
    let header_h = estimate_section_height(&header_sections);
    let footer_h = estimate_section_height(&footer_sections);

    // ── Page break threshold: quando o cursor chega nesse ponto, a página atual
    //     é finalizada e uma nova começa com header + footer.
    let page_break_threshold = margin + footer_h + 60.0;

    // ── Estados globais ──
    let mut page_entries: Vec<(Ref, Ref, Vec<u8>)> = Vec::new();
    let mut page_number: usize = 0; // 0-based
    let mut c: Content;

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIMEIRA PÁGINA
    // ═══════════════════════════════════════════════════════════════════════════
    c = Content::new();
    {
        let pid = alloc();
        let cid = alloc();
        page_entries.push((pid, cid, Vec::new()));
    }
    new_page_background(&mut c, bg_rgb, pw, ph);
    let mut cursor = Cursor::new(ph - margin);

    // Header na primeira página (sempre)
    render_sections_at(
        &mut c,
        &header_sections,
        &ctx,
        margin,
        &mut cursor,
        pw,
        ph,
        &fonts,
        data,
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // BODY SECTIONS — com page break automático
    // ═══════════════════════════════════════════════════════════════════════════
    for section in &body_sections {
        // Renderiza a section (com page breaks internos se necessário)
        render_section_with_page_break(
            &mut c,
            section,
            &ctx,
            margin,
            &mut cursor,
            pw,
            ph,
            &fonts,
            data,
            bg_rgb,
            page_break_threshold,
            &mut page_entries,
            &mut page_number,
            &header_sections,
            repeat_header,
            ph,
            margin,
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // V2 DATA BLOCKS
    // ═══════════════════════════════════════════════════════════════════════════
    if let Some(ref data_items) = report.data {
        let has_v2 = data_items
            .iter()
            .any(|it| it.get("dataHeader").is_some() || it.get("groupKey").is_some());
        if has_v2 {
            for item in data_items {
                if cursor.y - margin < page_break_threshold {
                    let bytes = std::mem::replace(&mut c, Content::new())
                        .finish()
                        .into_vec();
                    if let Some(last) = page_entries.last_mut() {
                        last.2 = bytes;
                    }
                    page_number += 1;
                    let pid = alloc();
                    let cid = alloc();
                    page_entries.push((pid, cid, Vec::new()));
                    new_page_background(&mut c, bg_rgb, pw, ph);
                    cursor.y = ph - margin;
                    if repeat_header {
                        render_sections_at(
                            &mut c,
                            &header_sections,
                            &ctx,
                            margin,
                            &mut cursor,
                            pw,
                            ph,
                            &fonts,
                            data,
                        );
                    }
                }

                if item.get("groupKey").is_some() {
                    render_data_group(
                        &mut c,
                        item,
                        data_source,
                        margin,
                        &mut cursor,
                        pw - 2.0 * margin,
                        &fonts,
                    );
                } else if item.get("dataHeader").is_some() {
                    render_data_block(
                        &mut c,
                        item,
                        data_source,
                        margin,
                        &mut cursor,
                        pw - 2.0 * margin,
                        &fonts,
                    );
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FOOTER na última página
    // ═══════════════════════════════════════════════════════════════════════════
    render_sections_at(
        &mut c,
        &footer_sections,
        &ctx,
        margin,
        &mut cursor,
        pw,
        ph,
        &fonts,
        data,
    );
    page_number += 1; // marca que a primeira rodada terminou

    // Finaliza última página
    let fbytes = std::mem::replace(&mut c, Content::new())
        .finish()
        .into_vec();
    if let Some(last) = page_entries.last_mut() {
        last.2 = fbytes;
    }
    let total_pages = page_entries.len();

    // ═══════════════════════════════════════════════════════════════════════════
    // PÁGINAS INTERMEDIÁRIAS — re-renderiza com header + footer
    // ═══════════════════════════════════════════════════════════════════════════
    // As páginas 1..N-1 (0-indexed) têm header+body mas sem footer.
    // Precisamos adicionar footer no stream de cada página.
    if total_pages > 1 && repeat_footer {
        for page_idx in 0..(total_pages - 1) {
            let (_, _, ref mut content_bytes) = page_entries[page_idx];
            // Cria um novo Content stream: footer no final
            let mut footer_c = Content::new();
            let mut footer_cursor = Cursor::new(margin + footer_h + 10.0); // bottom of page area

            for section in &footer_sections {
                render_section_to_stream(
                    &mut footer_c,
                    section,
                    &ctx,
                    margin,
                    &mut footer_cursor,
                    pw,
                    ph,
                    &fonts,
                    data,
                );
            }

            let footer_stream = footer_c.finish().into_vec();
            // Append footer to existing content stream
            content_bytes.extend_from_slice(&footer_stream);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MONTA PDF FINAL
    // ═══════════════════════════════════════════════════════════════════════════
    {
        let mut pages = pdf.pages(pages_id);
        pages.media_box(Rect::new(0.0, 0.0, pw, ph));
        let kid_refs: Vec<Ref> = page_entries.iter().map(|(pid, _, _)| *pid).collect();
        pages.kids(kid_refs.iter().map(|r| *r));
        pages.finish();
    }
    for (page_id, content_id, content_bytes) in &page_entries {
        let mut page = pdf.page(*page_id);
        page.parent(pages_id);
        page.media_box(Rect::new(0.0, 0.0, pw, ph));
        {
            let mut res = page.resources();
            let mut fonts = res.fonts();
            fonts.pair(Name(b"F1"), font_regular_id);
            fonts.pair(Name(b"F2"), font_bold_id);
            fonts.finish();
        }
        page.contents(*content_id);
        page.finish();
        pdf.stream(*content_id, content_bytes);
    }

    Ok(pdf.finish())
}

// ─── Renders sections at given cursor position (for header/footer) ──────────

fn render_sections_at(
    c: &mut Content,
    sections: &[Section],
    ctx: &RenderContext,
    origin_x: f32,
    cursor: &mut Cursor,
    pw: f32,
    ph: f32,
    fonts: &ContentFonts<'_>,
    data: &[serde_json::Value],
) {
    for section in sections {
        let padding = section
            .style
            .as_ref()
            .and_then(|s| s.padding)
            .unwrap_or(12.0);
        let sec_style = &section.style;
        let sec_bg = sec_style
            .as_ref()
            .and_then(|s| s.background_color.as_deref());

        // Altura da seção é definida pelo style.height ou pelo conteúdo
        let sec_h = sec_style.as_ref().and_then(|s| s.height).unwrap_or(0.0);

        if let Some(bg_color) = sec_bg {
            let corners = sec_style
                .as_ref()
                .and_then(|s| s.border_radius.clone())
                .unwrap_or(Corners::All(0.0));
            fill_rounded_rect(
                c,
                origin_x,
                cursor.y - sec_h,
                pw - 2.0 * origin_x,
                sec_h,
                &corners,
                &hex_to_rgb(bg_color),
            );
        }

        if let Some(ref children) = section.children {
            let mut sec_cursor = Cursor::new(cursor.y - padding);
            let inner_x = origin_x + padding;
            let inner_w = pw - 2.0 * origin_x - 2.0 * padding;
            render_elements(
                c,
                children,
                ctx,
                inner_x,
                &mut sec_cursor,
                inner_w,
                fonts,
                data,
            );
            cursor.y = sec_cursor.y;
        }

        let mb = sec_style
            .as_ref()
            .and_then(|s| s.margin_bottom)
            .unwrap_or(8.0);
        cursor.advance(mb);
    }
}

// ─── Render a single section with internal page breaks ─────────────────────

fn render_section_with_page_break(
    c: &mut Content,
    section: &Section,
    ctx: &RenderContext,
    origin_x: f32,
    cursor: &mut Cursor,
    pw: f32,
    ph: f32,
    fonts: &ContentFonts<'_>,
    data: &[serde_json::Value],
    bg_rgb: [f32; 3],
    page_break_threshold: f32,
    page_entries: &mut Vec<(Ref, Ref, Vec<u8>)>,
    page_number: &mut usize,
    header_sections: &[Section],
    repeat_header: bool,
    _ph: f32,
    margin: f32,
) {
    let margin = origin_x;
    let padding = section
        .style
        .as_ref()
        .and_then(|s| s.padding)
        .unwrap_or(12.0);
    let sec_style = &section.style;
    let sec_bg = sec_style
        .as_ref()
        .and_then(|s| s.background_color.as_deref());

    // Altura fixa da section (se definida)
    let sec_h_fixed = sec_style.as_ref().and_then(|s| s.height);

    // Verifica page break ANTES de renderizar a section
    if cursor.y - margin < page_break_threshold {
        // Finaliza página atual
        let bytes = std::mem::replace(c, Content::new()).finish().into_vec();
        if let Some(last) = page_entries.last_mut() {
            last.2 = bytes;
        }
        // Nova página — usa page_entries.len() para gerar refs únicas
        *page_number += 1;
        let base = (page_entries.len() * 10 + 10) as i32;
        let pid = Ref::new(base);
        let cid = Ref::new(base + 1);
        page_entries.push((pid, cid, Vec::new()));
        new_page_background(c, bg_rgb, pw, ph);
        cursor.y = ph - margin;
        // Header na nova página
        if *page_number > 0 && repeat_header {
            render_sections_at(
                c,
                header_sections,
                ctx,
                origin_x,
                cursor,
                pw,
                ph,
                fonts,
                data,
            );
        }
    }

    let section_top = cursor.y;
    let remaining = cursor.y - margin;
    let est_h = sec_h_fixed.unwrap_or(remaining.max(200.0));
    let section_bottom = section_top - est_h;

    // Background da section
    if let Some(bg_color) = sec_bg {
        let corners = sec_style
            .as_ref()
            .and_then(|s| s.border_radius.clone())
            .unwrap_or(Corners::All(0.0));
        fill_rounded_rect(
            c,
            origin_x,
            section_bottom,
            pw - 2.0 * origin_x,
            est_h,
            &corners,
            &hex_to_rgb(bg_color),
        );
    }

    // Renderiza children
    if let Some(ref children) = section.children {
        let inner_x = origin_x + padding;
        let inner_w = pw - 2.0 * origin_x - 2.0 * padding;
        let mut sec_cursor = Cursor::new(section_top - padding);
        render_elements(
            c,
            children,
            ctx,
            inner_x,
            &mut sec_cursor,
            inner_w,
            fonts,
            data,
        );
        cursor.y = sec_cursor.y;
    } else {
        cursor.y = section_bottom;
    }

    let mb = sec_style
        .as_ref()
        .and_then(|s| s.margin_bottom)
        .unwrap_or(8.0);
    cursor.advance(mb);
}

// ─── Render a section into a separate Content stream (for footer append) ───

fn render_section_to_stream(
    c: &mut Content,
    section: &Section,
    ctx: &RenderContext,
    origin_x: f32,
    cursor: &mut Cursor,
    pw: f32,
    _ph: f32,
    fonts: &ContentFonts<'_>,
    data: &[serde_json::Value],
) {
    let padding = section
        .style
        .as_ref()
        .and_then(|s| s.padding)
        .unwrap_or(12.0);
    let sec_style = &section.style;
    let sec_bg = sec_style
        .as_ref()
        .and_then(|s| s.background_color.as_deref());
    let sec_h = sec_style.as_ref().and_then(|s| s.height).unwrap_or(0.0);

    if let Some(bg_color) = sec_bg {
        let corners = sec_style
            .as_ref()
            .and_then(|s| s.border_radius.clone())
            .unwrap_or(Corners::All(0.0));
        fill_rounded_rect(
            c,
            origin_x,
            cursor.y - sec_h,
            pw - 2.0 * origin_x,
            sec_h,
            &corners,
            &hex_to_rgb(bg_color),
        );
    }

    if let Some(ref children) = section.children {
        let mut sec_cursor = Cursor::new(cursor.y - padding);
        let inner_x = origin_x + padding;
        let inner_w = pw - 2.0 * origin_x - 2.0 * padding;
        render_elements(
            c,
            children,
            ctx,
            inner_x,
            &mut sec_cursor,
            inner_w,
            fonts,
            data,
        );
        cursor.y = sec_cursor.y;
    }

    let mb = sec_style
        .as_ref()
        .and_then(|s| s.margin_bottom)
        .unwrap_or(8.0);
    cursor.advance(mb);
}

// ─── Fill page background (white/colored) ──────────────────────────────────

fn new_page_background(c: &mut Content, bg_rgb: [f32; 3], pw: f32, ph: f32) {
    c.set_fill_rgb(bg_rgb[0], bg_rgb[1], bg_rgb[2]);
    c.rect(0.0, 0.0, pw, ph);
    c.fill_nonzero();
}

// ─── Estimate section height ───────────────────────────────────────────────

fn estimate_section_height(sections: &[Section]) -> f32 {
    let mut h = 0.0;
    for section in sections {
        let sec_h = section
            .style
            .as_ref()
            .and_then(|s| s.height)
            .unwrap_or(40.0);
        let mb = section
            .style
            .as_ref()
            .and_then(|s| s.margin_bottom)
            .unwrap_or(8.0);
        h += sec_h + mb;
    }
    h
}

// ─── Helpers de layout ────────────────────────────────────────────────────────

struct LayoutArea {
    x: f32,
    y: f32,
    w: f32,
    h: f32,
}

struct Cursor {
    y: f32,
}

impl Cursor {
    fn new(top: f32) -> Self {
        Self { y: top }
    }

    fn advance(&mut self, amount: f32) {
        self.y -= amount;
    }
}

// ─── Helpers de padding ───────────────────────────────────────────────────────

struct Padding {
    top: f32,
    bottom: f32,
    left: f32,
    right: f32,
}

fn extract_padding(style: &Option<ElementStyle>) -> Padding {
    match style {
        Some(s) => {
            let uniform = s.padding.unwrap_or(0.0);
            Padding {
                top: s.padding_top.unwrap_or(uniform),
                bottom: s.padding_bottom.unwrap_or(uniform),
                left: s.padding_left.unwrap_or(uniform),
                right: s.padding_right.unwrap_or(uniform),
            }
        }
        None => Padding {
            top: 0.0,
            bottom: 0.0,
            left: 0.0,
            right: 0.0,
        },
    }
}

struct ContentFonts<'a> {
    regular: Name<'a>,
    bold: Name<'a>,
}

// ─── Renderiza uma lista de elementos ────────────────────────────────────────

fn render_elements(
    c: &mut Content,
    elements: &[Element],
    ctx: &RenderContext,
    origin_x: f32,
    cursor: &mut Cursor,
    max_width: f32,
    fonts: &ContentFonts<'_>,
    data: &[serde_json::Value],
) {
    for el in elements {
        let elem_w =
            el.w.unwrap_or_else(|| el.style.as_ref().and_then(|s| s.width).unwrap_or(max_width));
        let elem_w = elem_w.min(max_width);

        let elem_h =
            el.h.unwrap_or_else(|| el.style.as_ref().and_then(|s| s.height).unwrap_or(0.0));

        let elem_x = el.x.unwrap_or(origin_x);
        // Se y é explícito, usa ele; senão usa o cursor
        let elem_y = el.y.unwrap_or(cursor.y);

        match el.r#type.as_str() {
            "text" => {
                let rendered = render_text_element(c, el, ctx, elem_x, elem_y, elem_w, fonts, data);
                if el.y.is_none() {
                    let text_h = rendered.unwrap_or(16.0);
                    cursor.advance(
                        text_h
                            + el.style
                                .as_ref()
                                .and_then(|s| s.margin_bottom)
                                .unwrap_or(4.0),
                    );
                }
            }
            "rect" => {
                let h = elem_h.max(1.0);
                let corners = el
                    .style
                    .as_ref()
                    .and_then(|s| s.border_radius.clone())
                    .unwrap_or(Corners::All(0.0));
                let bg = el
                    .style
                    .as_ref()
                    .and_then(|s| s.background_color.as_deref())
                    .unwrap_or("#cccccc");
                let rgb = hex_to_rgb(bg);

                // Gradiente?
                if let Some(grad) = el.style.as_ref().and_then(|s| s.gradient.as_ref()) {
                    fill_gradient_rect(c, elem_x, cursor.y - h, elem_w, h, grad);
                } else {
                    fill_rounded_rect(c, elem_x, cursor.y - h, elem_w, h, &corners, &rgb);
                }

                // Borda
                if let Some(border_color) =
                    el.style.as_ref().and_then(|s| s.border_color.as_deref())
                {
                    let bw = el
                        .style
                        .as_ref()
                        .and_then(|s| s.border_width)
                        .unwrap_or(1.0);
                    let brgb = hex_to_rgb(border_color);
                    stroke_rounded_rect(c, elem_x, cursor.y - h, elem_w, h, &corners, &brgb, bw);
                }

                if el.y.is_none() {
                    cursor.advance(
                        h + el
                            .style
                            .as_ref()
                            .and_then(|s| s.margin_bottom)
                            .unwrap_or(4.0),
                    );
                }
            }
            "container" | "div" => {
                let pad = extract_padding(&el.style);
                let bg = el
                    .style
                    .as_ref()
                    .and_then(|s| s.background_color.as_deref());

                // Altura estimada pelos filhos
                let mut inner_cursor = Cursor::new(cursor.y - pad.top);
                let inner_x = elem_x + pad.left;
                let inner_w = elem_w - pad.left - pad.right;

                if let Some(ref children) = el.children {
                    render_elements(
                        c,
                        children,
                        ctx,
                        inner_x,
                        &mut inner_cursor,
                        inner_w,
                        fonts,
                        data,
                    );
                }

                let container_h = (cursor.y - inner_cursor.y) + pad.top + pad.bottom;

                // Desenha fundo do container
                if let Some(bg_color) = bg {
                    let corners = el
                        .style
                        .as_ref()
                        .and_then(|s| s.border_radius.clone())
                        .unwrap_or(Corners::All(8.0));
                    let rgb = hex_to_rgb(bg_color);

                    if let Some(grad) = el.style.as_ref().and_then(|s| s.gradient.as_ref()) {
                        fill_gradient_rect(
                            c,
                            elem_x,
                            cursor.y - container_h,
                            elem_w,
                            container_h,
                            grad,
                        );
                    } else {
                        fill_rounded_rect(
                            c,
                            elem_x,
                            cursor.y - container_h,
                            elem_w,
                            container_h,
                            &corners,
                            &rgb,
                        );
                    }
                }

                // Aplica padding bottom: inner_cursor já está no final dos filhos,
                // precisamos avançar o cursor mais o padding bottom
                let mb = el
                    .style
                    .as_ref()
                    .and_then(|s| s.margin_bottom)
                    .unwrap_or(4.0);
                cursor.y = inner_cursor.y;
                cursor.advance(pad.bottom + mb);
            }
            "columns" => {
                if let Some(ref cols) = el.columns {
                    let gap = 8.0;
                    let total_gap = gap * (cols.len().saturating_sub(1) as f32);
                    let mut col_widths: Vec<f32> = Vec::new();

                    // Calcula larguras
                    let mut remaining = max_width - total_gap;
                    let mut auto_count = 0;
                    for col in cols {
                        match col.width.as_deref() {
                            Some(pct) if pct.ends_with('%') => {
                                let p: f32 = pct[..pct.len() - 1].parse().unwrap_or(50.0);
                                col_widths.push(max_width * p / 100.0);
                            }
                            Some(abs) => {
                                let w: f32 = abs.parse().unwrap_or(100.0);
                                col_widths.push(w);
                                remaining -= w;
                            }
                            None | Some("auto") => {
                                col_widths.push(0.0); // placeholder
                                auto_count += 1;
                            }
                        }
                    }

                    // Distribui restante para auto
                    if auto_count > 0 {
                        let auto_w = remaining / auto_count as f32;
                        for w in col_widths.iter_mut() {
                            if *w == 0.0 {
                                *w = auto_w.max(50.0);
                            }
                        }
                    }

                    let max_col_h = cursor.y - 50.0; // minio
                    let mut min_y = cursor.y;

                    for (i, col) in cols.iter().enumerate() {
                        let cx = if i == 0 {
                            elem_x
                        } else {
                            elem_x + col_widths[..i].iter().sum::<f32>() + gap * i as f32
                        };
                        let cw = col_widths[i];

                        let mut col_cursor = Cursor::new(cursor.y);
                        if let Some(ref children) = col.children {
                            render_elements(c, children, ctx, cx, &mut col_cursor, cw, fonts, data);
                        }
                        if col_cursor.y < min_y {
                            min_y = col_cursor.y;
                        }
                    }

                    cursor.y = min_y;
                    let mb = el
                        .style
                        .as_ref()
                        .and_then(|s| s.margin_bottom)
                        .unwrap_or(4.0);
                    cursor.advance(mb);
                }
            }
            "table" => {
                if let Some(ref cols) = el.table_columns {
                    let header_h = 22.0;
                    let row_h = 18.0;
                    let cell_pad = 4.0;

                    // Calcula largura total
                    let total_specified: f32 = cols.iter().filter_map(|c| c.width).sum();
                    let remaining = max_width - total_specified;
                    let auto_count = cols.iter().filter(|c| c.width.is_none()).count() as f32;
                    let auto_w = if auto_count > 0.0 {
                        (remaining / auto_count).max(40.0)
                    } else {
                        0.0
                    };

                    let mut x_offsets: Vec<f32> = Vec::new();
                    let mut x_acc = elem_x;
                    for col in cols {
                        x_offsets.push(x_acc);
                        let w = col.width.unwrap_or(auto_w);
                        x_acc += w;
                    }

                    // ── Header row ──
                    let header_y = cursor.y;
                    // Fundo do header
                    let hdr_bg = hex_to_rgb("#1a3a6b");
                    c.set_fill_rgb(hdr_bg[0], hdr_bg[1], hdr_bg[2]);
                    c.rect(elem_x, header_y - header_h, max_width, header_h);
                    c.fill_nonzero();

                    for (i, col) in cols.iter().enumerate() {
                        let cx = x_offsets[i];
                        let cw = col.width.unwrap_or(auto_w);
                        let prefix = col.prefix.as_deref().unwrap_or("");
                        let align = col.align.as_deref().unwrap_or("left");

                        let text = prefix;
                        let font = fonts.bold;
                        let font_size = 8.0;
                        let encoded = to_win_ansi(text, 50);
                        let text_w = encoded.len() as f32 * font_size * 0.32;

                        let tx = match align {
                            "center" => cx + (cw - text_w) / 2.0,
                            "right" => cx + cw - text_w - cell_pad,
                            _ => cx + cell_pad,
                        };
                        show_text(
                            c,
                            &encoded,
                            font,
                            font_size,
                            tx,
                            header_y - 6.0,
                            [1.0, 1.0, 1.0],
                        );
                    }

                    cursor.y -= header_h + 2.0;

                    // ── Data rows ──
                    for (row_idx, row_data) in data.iter().enumerate() {
                        let row_y = cursor.y;

                        // Alternating row color
                        if row_idx % 2 == 1 {
                            c.set_fill_rgb(0.95, 0.96, 0.98);
                            c.rect(elem_x, row_y - row_h, max_width, row_h);
                            c.fill_nonzero();
                        }

                        for (i, col) in cols.iter().enumerate() {
                            let cx = x_offsets[i];
                            let cw = col.width.unwrap_or(auto_w);
                            let align = col.align.as_deref().unwrap_or("left");
                            let key = col.key.as_deref().unwrap_or("");
                            let prefix = col.prefix.as_deref().unwrap_or("");

                            // Extrai valor do JSON
                            let raw_val = row_data.get(key);
                            let val_str = match raw_val {
                                Some(v) if v.is_string() => v.as_str().unwrap_or("").to_string(),
                                Some(v) if v.is_number() => {
                                    let n = v.as_f64().unwrap_or(0.0);
                                    format_value(n, col.format.as_deref())
                                }
                                Some(v) => v.to_string(),
                                None => String::new(),
                            };

                            let text = if prefix.is_empty() {
                                val_str.clone()
                            } else {
                                format!("{} {}", prefix, val_str)
                            };
                            let encoded = to_win_ansi(&text, 80);
                            let font_size = 7.5;
                            let text_w = encoded.len() as f32 * font_size * 0.32;

                            let tx = match align {
                                "center" => cx + (cw - text_w) / 2.0,
                                "right" => cx + cw - text_w - cell_pad,
                                _ => cx + cell_pad,
                            };

                            show_text(
                                c,
                                &encoded,
                                fonts.regular,
                                font_size,
                                tx,
                                row_y - 6.0,
                                [0.15, 0.15, 0.20],
                            );
                        }

                        cursor.y -= row_h + 1.0;
                    }

                    // ── Linha separadora abaixo da tabela ──
                    c.set_stroke_rgb(0.85, 0.85, 0.90);
                    c.set_line_width(0.5);
                    c.move_to(elem_x, cursor.y + 2.0);
                    c.line_to(elem_x + max_width, cursor.y + 2.0);
                    c.stroke();

                    cursor.advance(6.0);
                }
            }
            "totalizer" => {
                let key = el.column.as_deref().unwrap_or("");
                let label = el.label.as_deref().unwrap_or("Total");

                // Soma os valores da coluna
                let total: f64 = data
                    .iter()
                    .filter_map(|row| row.get(key))
                    .filter_map(|v| v.as_f64())
                    .sum();

                let fmt = el.format.as_deref().unwrap_or("number");
                let val_str = format_value(total, Some(fmt));
                let text = format!("{}: {}", label, val_str);
                let encoded = to_win_ansi(&text, 100);
                let font_size = el.style.as_ref().and_then(|s| s.font_size).unwrap_or(11.0);
                let bold = el.style.as_ref().and_then(|s| s.bold).unwrap_or(true);
                let color = el
                    .style
                    .as_ref()
                    .and_then(|s| s.color.as_deref())
                    .unwrap_or("#1a3a6b");
                let align = el
                    .style
                    .as_ref()
                    .and_then(|s| s.align.as_deref())
                    .unwrap_or("right");
                let rgb = hex_to_rgb(color);
                let font = if bold { fonts.bold } else { fonts.regular };
                let text_w = encoded.len() as f32 * font_size * 0.32;

                let tx = match align {
                    "center" => elem_x + (max_width - text_w) / 2.0,
                    "right" => elem_x + max_width - text_w - 4.0,
                    _ => elem_x + 4.0,
                };

                // Linha separadora acima do total
                c.set_stroke_rgb(0.75, 0.75, 0.82);
                c.set_line_width(0.8);
                c.move_to(elem_x, cursor.y);
                c.line_to(elem_x + max_width, cursor.y);
                c.stroke();

                cursor.advance(4.0);
                show_text(c, &encoded, font, font_size, tx, cursor.y, rgb);
                cursor.advance(font_size + 4.0);
            }
            "spacer" => {
                let h = el.h.unwrap_or(10.0);
                cursor.advance(h);
            }
            "chart" | "bar" | "line" | "pie" | "donut" => {
                let chart_h = elem_h.max(150.0);

                // Busca o dataSource do contexto para chart_data_source
                let chart_data_source = el.chart_data_source.as_deref();
                let chart_ds_data: Option<Vec<serde_json::Value>> = chart_data_source
                    .and_then(|key| ctx.data_source.as_ref()?.get(key)?.as_array().cloned())
                    .map(|arr| arr.into_iter().collect());

                // Se tem chart_data_source v2, extrai labels/values do array
                let (final_labels, final_values) = if let Some(ref ds_items) = chart_ds_data {
                    let labels: Vec<String> = ds_items
                        .iter()
                        .filter_map(|item| {
                            item.as_object()
                                .and_then(|obj| {
                                    obj.get("label")
                                        .or_else(|| obj.get("name"))
                                        .or_else(|| obj.get("categoria"))
                                        .or_else(|| obj.get("mes"))
                                })
                                .and_then(|v| v.as_str().map(String::from))
                        })
                        .collect();
                    let values: Vec<f64> = ds_items
                        .iter()
                        .filter_map(|item| {
                            item.as_object()
                                .and_then(|obj| {
                                    obj.get("value")
                                        .or_else(|| obj.get("valor"))
                                        .or_else(|| obj.get("total"))
                                        .or_else(|| obj.get("receita"))
                                        .or_else(|| obj.get("qtd"))
                                })
                                .and_then(|v| v.as_f64())
                        })
                        .collect();
                    (labels, values)
                } else {
                    (
                        el.chart_labels.clone().unwrap_or_default(),
                        el.chart_values.clone().unwrap_or_default(),
                    )
                };

                let chart_type = el.chart_type.as_deref().unwrap_or("bar");
                let chart_title = el.chart_title.as_deref().unwrap_or("");

                let primary = [0.10, 0.40, 0.75]; // default blue
                let accent = [0.95, 0.40, 0.20]; // default orange

                // O chart desenha ACIMA do cursor (entre cursor.y - chart_h e cursor.y)
                // A base visual do chart é cursor.y (Y inferior do PDF é o topo visual)
                // O chart cresce para CIMA no PDF (Y maior = mais alto), então:
                //   chart_base_y = cursor.y - chart_h (Y inferior da área do chart)
                //   O chart desenha de chart_base_y até chart_base_y + chart_h = cursor.y
                //   cursor.y = cursor.y - chart_h (avança, descendo no layout)
                let chart_base_y = cursor.y - chart_h;

                if !final_labels.is_empty() && !final_values.is_empty() {
                    let cd = ChartData {
                        title: chart_title.to_string(),
                        labels: final_labels,
                        row_labels: vec![],
                        values: final_values,
                        chart_type: chart_type.to_string(),
                    };

                    let cw = if chart_type == "pie" || chart_type == "donut" {
                        max_width * 0.55
                    } else {
                        max_width
                    };

                    match chart_type {
                        "bar" => {
                            draw_bar_chart(
                                c,
                                &cd,
                                elem_x,
                                chart_base_y,
                                cw,
                                chart_h,
                                primary,
                                "",
                                5.5,
                                [0.55, 0.55, 0.60],
                                [0.88, 0.88, 0.92],
                                8,
                            );
                        }
                        "line" => {
                            draw_line_chart(
                                c,
                                &cd,
                                elem_x,
                                chart_base_y,
                                cw,
                                chart_h,
                                primary,
                                accent,
                            );
                        }
                        "pie" | "donut" => {
                            draw_pie_chart(
                                c,
                                &cd,
                                elem_x,
                                chart_base_y,
                                cw,
                                chart_h,
                                primary,
                                accent,
                            );
                        }
                        _ => {}
                    }
                } else {
                    // Dados vazios — mostra placeholder
                    let msg_y = cursor.y - chart_h / 2.0;
                    show_text(
                        c,
                        &to_win_ansi("Sem dados para o gráfico", 40),
                        fonts.regular,
                        10.0,
                        elem_x + max_width * 0.3,
                        msg_y,
                        [0.5, 0.5, 0.5],
                    );
                }

                // Avança o cursor pela altura consumida + gap extra
                let mb = el
                    .style
                    .as_ref()
                    .and_then(|s| s.margin_bottom)
                    .unwrap_or(12.0);
                // Gap extra de 10px abaixo do chart (espaço para labels do chart)
                cursor.advance(chart_h + mb + 10.0);
            }
            _ => {
                // Tipo desconhecido — tenta renderizar como container com children
                if let Some(ref children) = el.children {
                    let mut inner = Cursor::new(cursor.y);
                    render_elements(c, children, ctx, elem_x, &mut inner, elem_w, fonts, data);
                    cursor.y = inner.y;
                }
            }
        }
    }
}

// ─── Renderiza elemento de texto ─────────────────────────────────────────────

fn render_text_element(
    c: &mut Content,
    el: &Element,
    ctx: &RenderContext,
    x: f32,
    y: f32,
    max_w: f32,
    fonts: &ContentFonts<'_>,
    data: &[serde_json::Value],
) -> Result<f32, String> {
    let prefix = el.prefix.as_deref().unwrap_or("");
    let suffix = el.suffix.as_deref().unwrap_or("");
    let key = el.key.as_deref().unwrap_or("");
    let raw_value = el.value.as_deref().unwrap_or("");

    // Interpola {{key}} no value
    let interpolated = if raw_value.contains("{{") {
        let mut result = raw_value.to_string();
        for (idx, row) in data.iter().enumerate() {
            if let Some(obj) = row.as_object() {
                for (k, v) in obj {
                    let placeholder = format!("{{{{{}}}}}", k);
                    if result.contains(&placeholder) {
                        let val_str = match v {
                            serde_json::Value::String(s) => s.clone(),
                            serde_json::Value::Number(n) => {
                                let f = n.as_f64().unwrap_or(0.0);
                                if f == f.trunc() && f < 1e12 {
                                    format!("{}", f as i64)
                                } else {
                                    format!("{:.2}", f)
                                }
                            }
                            _ => v.to_string(),
                        };
                        result = result.replace(&placeholder, &val_str);
                    }
                }
            }
            // Usa apenas o primeiro item do data para interpolação simples
            break;
        }
        result
    } else {
        raw_value.to_string()
    };

    // Se tem key, busca o valor no primeiro item do data
    let key_value = if !key.is_empty() && !data.is_empty() {
        match data[0].get(key) {
            Some(v) if v.is_string() => v.as_str().unwrap_or("").to_string(),
            Some(v) if v.is_number() => {
                let n = v.as_f64().unwrap_or(0.0);
                format_value(n, el.format.as_deref())
            }
            Some(v) => v.to_string(),
            None => String::new(),
        }
    } else {
        String::new()
    };

    let text = if !key_value.is_empty() {
        format!("{}{}{}", prefix, key_value, suffix)
    } else if !interpolated.is_empty() {
        interpolated
    } else {
        format!("{}{}", prefix, suffix)
    };

    if text.is_empty() {
        return Ok(0.0);
    }

    let font_size = el.style.as_ref().and_then(|s| s.font_size).unwrap_or(10.0);
    let bold = el.style.as_ref().and_then(|s| s.bold).unwrap_or(false);
    let color = el
        .style
        .as_ref()
        .and_then(|s| s.color.as_deref())
        .unwrap_or("#000000");
    let align = el
        .style
        .as_ref()
        .and_then(|s| s.align.as_deref())
        .unwrap_or("left");
    let v_align = el
        .style
        .as_ref()
        .and_then(|s| s.vertical_align.as_deref())
        .unwrap_or("top");
    let rgb = hex_to_rgb(color);
    let font = if bold { fonts.bold } else { fonts.regular };

    let encoded = to_win_ansi(&text, 200);
    let text_w = encoded.len() as f32 * font_size * 0.32;

    let pad = extract_padding(&el.style);
    let text_h = font_size + 4.0;

    // Aplica padding left/right ao limitar a largura
    let inner_x = x + pad.left;
    let inner_max_w = max_w - pad.left - pad.right;

    let tx = match align {
        "center" => inner_x + (inner_max_w - text_w) / 2.0,
        "right" => inner_x + inner_max_w - text_w,
        _ => inner_x,
    };

    // Aplica vertical align: o y recebido é o topo da área.
    // Por default (top), o texto fica em y - pad.top.
    // Para middle, centraliza verticalmente.
    // Para bottom, o texto fica mais abaixo.
    let text_y = match v_align {
        "middle" => y - pad.top - ((text_h - (font_size + 4.0)) / 2.0).max(0.0),
        "bottom" => y - pad.top - (text_h - font_size - 4.0).max(0.0),
        _ => y - pad.top, // top (default)
    };

    show_text(c, &encoded, font, font_size, tx, text_y, rgb);

    // Altura total consumida = padding top + texto + padding bottom
    Ok(pad.top + text_h + pad.bottom)
}

// ═══════════════════════════════════════════════════════════════════════════════
// V2 DATA BLOCK / DATA GROUP RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

/// Renderiza um DataBlock v2 — gera preHeader + tabela automática + body (totalizadores).
///
/// O `block` é um objeto JSON com:
///   - `preHeader` (opcional): texto acima da tabela
///   - `dataHeader`: array de `{ key, prefix }` — define colunas
///   - `dataBodyValue`: string — chave para lookup no `data_source`
///   - `body` (opcional): array de `{ accessor?, value?, prefix }` — totalizadores
fn render_data_block(
    c: &mut Content,
    block: &serde_json::Value,
    data_source: Option<&HashMap<String, serde_json::Value>>,
    origin_x: f32,
    cursor: &mut Cursor,
    max_width: f32,
    fonts: &ContentFonts<'_>,
) {
    // ── preHeader ──
    if let Some(text) = block.get("preHeader").and_then(|v| v.as_str()) {
        if !text.is_empty() {
            let encoded = to_win_ansi(text, 100);
            let font_size = 11.0;
            let text_w = encoded.len() as f32 * font_size * 0.32;
            let rgb = hex_to_rgb("#1a3a6b");
            show_text(
                c,
                &encoded,
                fonts.bold,
                font_size,
                origin_x + 2.0,
                cursor.y,
                rgb,
            );
            cursor.advance(font_size + 6.0);

            // Linha separadora abaixo do preHeader
            c.set_stroke_rgb(0.75, 0.75, 0.82);
            c.set_line_width(0.5);
            c.move_to(origin_x, cursor.y);
            c.line_to(origin_x + max_width, cursor.y);
            c.stroke();
            cursor.advance(4.0);
        }
    }

    // ── Extrai configuração da tabela ──
    let header_cols = match block.get("dataHeader").and_then(|v| v.as_array()) {
        Some(arr) => arr,
        None => return,
    };
    let body_key = match block.get("dataBodyValue").and_then(|v| v.as_str()) {
        Some(k) => k,
        None => return,
    };

    // Busca os dados no data_source
    let rows: Vec<&serde_json::Value> = match data_source {
        Some(ds) => ds
            .get(body_key)
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().collect())
            .unwrap_or_default(),
        None => Vec::new(),
    };

    if rows.is_empty() {
        // Se não achou dados, mostra aviso
        let msg = format!("[Nenhum dado encontrado para: {}]", body_key);
        let encoded = to_win_ansi(&msg, 80);
        show_text(
            c,
            &encoded,
            fonts.regular,
            8.0,
            origin_x + 2.0,
            cursor.y,
            [0.6, 0.6, 0.6],
        );
        cursor.advance(14.0);
        return;
    }

    // ── Renderiza a tabela ──
    let header_h = 22.0;
    let row_h = 18.0;
    let cell_pad = 4.0;

    // Calcula largura das colunas (distribuição igualitária)
    let col_count = header_cols.len();
    let col_w = if col_count > 0 {
        max_width / col_count as f32
    } else {
        max_width
    };

    // ── Header da tabela ──
    let header_y = cursor.y;
    let hdr_bg = hex_to_rgb("#1a3a6b");
    c.set_fill_rgb(hdr_bg[0], hdr_bg[1], hdr_bg[2]);
    c.rect(origin_x, header_y - header_h, max_width, header_h);
    c.fill_nonzero();

    for (i, col_def) in header_cols.iter().enumerate() {
        let cx = origin_x + i as f32 * col_w;
        let prefix = col_def.get("prefix").and_then(|v| v.as_str()).unwrap_or("");
        let encoded = to_win_ansi(prefix, 50);
        show_text(
            c,
            &encoded,
            fonts.bold,
            8.0,
            cx + cell_pad,
            header_y - 6.0,
            [1.0, 1.0, 1.0],
        );
    }

    cursor.y -= header_h + 2.0;

    // ── Data rows ──
    for (row_idx, row_data) in rows.iter().enumerate() {
        let row_y = cursor.y;

        // Alternating row color
        if row_idx % 2 == 1 {
            c.set_fill_rgb(0.95, 0.96, 0.98);
            c.rect(origin_x, row_y - row_h, max_width, row_h);
            c.fill_nonzero();
        }

        for (i, col_def) in header_cols.iter().enumerate() {
            let cx = origin_x + i as f32 * col_w;
            let key = col_def.get("key").and_then(|v| v.as_str()).unwrap_or("");
            let prefix = col_def.get("prefix").and_then(|v| v.as_str()).unwrap_or("");

            let raw_val = row_data.get(key);
            let val_str = match raw_val {
                Some(v) if v.is_string() => v.as_str().unwrap_or("").to_string(),
                Some(v) if v.is_number() => {
                    let n = v.as_f64().unwrap_or(0.0);
                    if n == n.trunc() && n < 1e12 {
                        format!("{}", n as i64)
                    } else {
                        format!("{:.2}", n)
                    }
                }
                Some(v) => v.to_string(),
                None => String::new(),
            };

            let text = if prefix.is_empty() {
                val_str.clone()
            } else {
                format!("{} {}", prefix, val_str)
            };
            let encoded = to_win_ansi(&text, 80);
            let font_size = 7.5;
            let text_w = encoded.len() as f32 * font_size * 0.32;

            let tx = cx + cell_pad;
            // Se o texto for muito largo, alinha à direita para não vazar
            let tx = if text_w > col_w - cell_pad * 2.0 {
                cx + col_w - text_w - cell_pad
            } else {
                tx
            };

            show_text(
                c,
                &encoded,
                fonts.regular,
                font_size,
                tx,
                row_y - 6.0,
                [0.15, 0.15, 0.20],
            );
        }

        cursor.y -= row_h + 1.0;
    }

    // ── Linha separadora abaixo da tabela ──
    c.set_stroke_rgb(0.85, 0.85, 0.90);
    c.set_line_width(0.5);
    c.move_to(origin_x, cursor.y + 2.0);
    c.line_to(origin_x + max_width, cursor.y + 2.0);
    c.stroke();

    cursor.advance(6.0);

    // ── Renderiza body (totalizadores) ──
    if let Some(body_items) = block.get("body").and_then(|v| v.as_array()) {
        for item in body_items {
            let prefix = item.get("prefix").and_then(|v| v.as_str()).unwrap_or("");
            let accessor = item.get("accessor").and_then(|v| v.as_str());
            let value = item.get("value");

            // Tenta calcular o total a partir do accessor nos dados
            let total_val: f64 = if let Some(acc) = accessor {
                rows.iter()
                    .filter_map(|row| row.get(acc))
                    .filter_map(|v| v.as_f64())
                    .sum()
            } else if let Some(v) = value {
                v.as_f64().unwrap_or(0.0)
            } else {
                0.0
            };

            // Se veio value como string, tenta parsear como número
            let display_val = if let Some(v) = value {
                match v {
                    serde_json::Value::String(s) => s.clone(),
                    serde_json::Value::Number(n) => {
                        let f = n.as_f64().unwrap_or(0.0);
                        if f == f.trunc() && f < 1e12 {
                            format!("{}", f as i64)
                        } else {
                            format!("{:.2}", f)
                        }
                    }
                    _ => format_value(total_val, Some("number")),
                }
            } else {
                format_value(total_val, Some("number"))
            };

            let text = format!("{}: {}", prefix, display_val);
            let encoded = to_win_ansi(&text, 100);
            let font_size = 9.0;
            let text_w = encoded.len() as f32 * font_size * 0.32;

            // Linha separadora acima do total
            c.set_stroke_rgb(0.75, 0.75, 0.82);
            c.set_line_width(0.8);
            c.move_to(origin_x, cursor.y);
            c.line_to(origin_x + max_width, cursor.y);
            c.stroke();

            cursor.advance(4.0);
            show_text(
                c,
                &encoded,
                fonts.bold,
                font_size,
                origin_x + max_width - text_w - 4.0,
                cursor.y,
                [0.1, 0.23, 0.42],
            );
            cursor.advance(font_size + 4.0);
        }
    }

    // Espaçamento final após o bloco
    cursor.advance(8.0);
}

/// Renderiza um DataGroup v2 — itera sobre `groupData[]` e renderiza cada sub-bloco.
///
/// O `group` é um objeto JSON com:
///   - `groupKey`: string identificadora (usada para lookup de contexto)
///   - `groupData`: array de DataBlock
fn render_data_group(
    c: &mut Content,
    group: &serde_json::Value,
    data_source: Option<&HashMap<String, serde_json::Value>>,
    origin_x: f32,
    cursor: &mut Cursor,
    max_width: f32,
    fonts: &ContentFonts<'_>,
) {
    let group_key = group
        .get("groupKey")
        .and_then(|v| v.as_str())
        .unwrap_or("grupo");
    let sub_blocks = match group.get("groupData").and_then(|v| v.as_array()) {
        Some(arr) => arr,
        None => return,
    };

    // Título do grupo (opcional)
    if !group_key.is_empty() {
        let encoded = to_win_ansi(&format!("📁 {}", group_key), 80);
        show_text(
            c,
            &encoded,
            fonts.bold,
            10.0,
            origin_x + 2.0,
            cursor.y,
            [0.3, 0.3, 0.3],
        );
        cursor.advance(16.0);
    }

    for sub_block in sub_blocks {
        render_data_block(
            c,
            sub_block,
            data_source,
            origin_x,
            cursor,
            max_width,
            fonts,
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAWING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

fn fill_rounded_rect(
    c: &mut Content,
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    corners: &Corners,
    rgb: &[f32; 3],
) {
    c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
    rounded_rect_path(c, x, y, w, h, corners);
    c.fill_nonzero();
}

fn stroke_rounded_rect(
    c: &mut Content,
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    corners: &Corners,
    rgb: &[f32; 3],
    line_width: f32,
) {
    c.set_stroke_rgb(rgb[0], rgb[1], rgb[2]);
    c.set_line_width(line_width);
    rounded_rect_path(c, x, y, w, h, corners);
    c.stroke();
}

fn rounded_rect_path(c: &mut Content, x: f32, y: f32, w: f32, h: f32, corners: &Corners) {
    // Ordem: bottom-left, top-left, top-right, bottom-right (sentido horário do canto inferior esquerdo)
    let tl = corners.top_left();
    let tr = corners.top_right();
    let br = corners.bottom_right();
    let bl = corners.bottom_left();

    let k = KAPPA;

    if bl > 0.0 {
        c.move_to(x, y + bl);
        c.cubic_to(x, y + bl - k * bl, x + bl - k * bl, y, x + bl, y);
    } else {
        c.move_to(x, y);
    }

    c.line_to(x + w - br, y);

    if br > 0.0 {
        c.cubic_to(
            x + w - br + k * br,
            y,
            x + w,
            y + br - k * br,
            x + w,
            y + br,
        );
    }

    c.line_to(x + w, y + h - tr);

    if tr > 0.0 {
        c.cubic_to(
            x + w,
            y + h - tr + k * tr,
            x + w - tr + k * tr,
            y + h,
            x + w - tr,
            y + h,
        );
    }

    c.line_to(x + tl, y + h);

    if tl > 0.0 {
        c.cubic_to(
            x + tl - k * tl,
            y + h,
            x,
            y + h - tl + k * tl,
            x,
            y + h - tl,
        );
    }

    c.close_path();
}

fn fill_gradient_rect(c: &mut Content, x: f32, y: f32, w: f32, h: f32, grad: &GradientDef) {
    let colors: Vec<[f32; 3]> = grad.colors.iter().map(|hex| hex_to_rgb(hex)).collect();
    if colors.len() < 2 {
        if let Some(first) = colors.first() {
            c.set_fill_rgb(first[0], first[1], first[2]);
            c.rect(x, y, w, h);
            c.fill_nonzero();
        }
        return;
    }

    let dir = grad.direction.as_deref().unwrap_or("top-bottom");
    let steps = 60u32;

    match dir {
        "left-right" => {
            for i in 0..steps {
                let t = i as f32 / (steps - 1) as f32;
                let rgb = lerp_color(&colors, t);
                let seg_w = w / steps as f32 + 1.0;
                c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
                c.rect(x + i as f32 * (w / steps as f32), y, seg_w, h);
                c.fill_nonzero();
            }
        }
        "diagonal" => {
            // Diagonal simplificada: faixas diagonais
            for i in 0..steps {
                let t = i as f32 / (steps - 1) as f32;
                let rgb = lerp_color(&colors, t);
                c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
                // Desenha como triângulos sobrepostos
                let diag_x = x + t * w;
                let top = y + h;
                c.move_to(diag_x, y);
                c.line_to(diag_x + w / steps as f32 + 1.0, y);
                c.line_to(diag_x + w / steps as f32 + 1.0, top);
                c.line_to(diag_x, top);
                c.close_path();
                c.fill_nonzero();
            }
        }
        _ => {
            // top-bottom (default)
            for i in 0..steps {
                let t = i as f32 / (steps - 1) as f32;
                let rgb = lerp_color(&colors, t);
                let seg_h = h / steps as f32 + 1.0;
                c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
                c.rect(x, y + i as f32 * (h / steps as f32), w, seg_h);
                c.fill_nonzero();
            }
        }
    }
}

fn lerp_color(colors: &[[f32; 3]], t: f32) -> [f32; 3] {
    if colors.is_empty() {
        return [0.0, 0.0, 0.0];
    }
    if colors.len() == 1 {
        return colors[0];
    }
    let segments = colors.len() - 1;
    let seg_t = t * segments as f32;
    let idx = (seg_t as usize).min(segments - 1);
    let local_t = seg_t - idx as f32;
    let a = colors[idx];
    let b = colors[idx + 1];
    [
        a[0] + (b[0] - a[0]) * local_t,
        a[1] + (b[1] - a[1]) * local_t,
        a[2] + (b[2] - a[2]) * local_t,
    ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

fn format_value(value: f64, format: Option<&str>) -> String {
    match format {
        Some("currency") => format!("R$ {:.2}", value).replace('.', ","),
        Some("number") => {
            if value == value.trunc() && value < 1e12 {
                format!("{}", value as i64)
            } else {
                format!("{:.2}", value).replace('.', ",")
            }
        }
        Some("percentage") => format!("{:.1}%", value).replace('.', ","),
        _ => {
            if value == value.trunc() && value < 1e12 {
                format!("{}", value as i64)
            } else {
                format!("{:.2}", value)
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
