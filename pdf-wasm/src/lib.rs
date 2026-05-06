use pdf_writer::{Content, Finish, Name, Pdf, Rect, Ref, Str};
use serde::Deserialize;
use serde::Serialize;
mod meu_playground;

pub use meu_playground::gerar_pdf_brincadeira;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

mod relatorio_estiloso;
pub use relatorio_estiloso::gerar_relatorio_estiloso;

mod relatorio_estilo_premium;
pub use relatorio_estilo_premium::gerar_relatorio_premium;

mod flex_report;
pub use flex_report::generate_flex_report;

mod charts; // gráficos compartilhados (bar, line, pie, donut, metric cards)
pub(crate) use charts::ChartData;
pub(crate) use charts::MetricCardData;

mod pdf_v3;

// Wrapper sem wasm_bindgen para uso nativo
pub fn generate_pdf_v3(report_json: &str, datasets_json: &str, variables_json: &str) -> Vec<u8> {
    pdf_v3::generate_pdf_v3_inner(report_json, datasets_json, variables_json)
}

pub(crate) use charts::draw_bar_chart;
pub(crate) use charts::draw_line_chart;
pub(crate) use charts::draw_metric_cards;
pub(crate) use charts::draw_pie_chart;
pub(crate) use charts::KAPPA;
#[cfg(target_arch = "wasm32")]
pub use pdf_v3::generate_pdf_v3_wasm;

mod encoding;
use encoding::to_win_ansi as to_utf8_winansi;

// ─── A4 page constants ──────────────────────────────────────────────────────
pub(crate) const PAGE_W: f32 = 595.28;
pub(crate) const PAGE_H: f32 = 841.89;
pub(crate) const MARGIN: f32 = 40.0;

// ─── Data structures ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableRow {
    pub cells: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfConfig {
    pub title: String,
    pub subtitle: Option<String>,
    pub headers: Vec<String>,
    pub rows: Vec<TableRow>,
    pub primary_color: Option<[f32; 3]>,
    pub accent_color: Option<[f32; 3]>,
    pub company_name: Option<String>,
    pub chart_data: Option<Vec<ChartData>>,
    pub generation_date: Option<String>,
    pub metric_cards: Option<Vec<MetricCardData>>,
}

// ─── Initialisation ───────────────────────────────────────────────────────────

#[cfg_attr(target_arch = "wasm32", wasm_bindgen(start))]
pub fn init_panic_hook() {
    #[cfg(target_arch = "wasm32")]
    console_error_panic_hook::set_once();
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn generate_pdf(config_json: &str) -> Result<Vec<u8>, JsError> {
    let cfg: PdfConfig =
        serde_json::from_str(config_json).map_err(|e| JsError::new(&e.to_string()))?;
    build_pdf(&cfg).map_err(|e| JsError::new(&e))
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

fn build_pdf(cfg: &PdfConfig) -> Result<Vec<u8>, String> {
    let primary = cfg.primary_color.unwrap_or([0.122, 0.302, 0.702]);
    let accent = cfg.accent_color.unwrap_or([0.118, 0.694, 0.831]);

    // Layout com espaço para gráficos e metric cards
    let has_charts = cfg
        .chart_data
        .as_ref()
        .map(|c| !c.is_empty())
        .unwrap_or(false);
    let has_metric_cards = cfg
        .metric_cards
        .as_ref()
        .map(|c| !c.is_empty())
        .unwrap_or(false);
    let header_h = if has_charts || has_metric_cards {
        180.0
    } else {
        88.0
    };
    let charts_area_h = if has_charts { 180.0 } else { 0.0 };
    let metric_cards_h = if has_metric_cards { 100.0 } else { 0.0 };

    const FOOTER_H: f32 = 28.0;
    const HEADER_ROW_H: f32 = 24.0;
    const DATA_ROW_H: f32 = 20.0;
    let table_w = PAGE_W - 2.0 * MARGIN;
    let col_count = cfg.headers.len().max(1);
    let col_w = table_w / col_count as f32;

    let available_h =
        PAGE_H - header_h - metric_cards_h - charts_area_h - HEADER_ROW_H - FOOTER_H - 30.0;
    let rows_per_page = ((available_h / DATA_ROW_H).floor() as usize).max(1);

    let total_rows = cfg.rows.len();
    let num_pages = if total_rows == 0 {
        1
    } else {
        (total_rows + rows_per_page - 1) / rows_per_page
    };

    // ── Reference allocator ────────────────────────────────────────────────────
    let mut next_id: i32 = 1;
    let mut alloc = move || {
        let r = Ref::new(next_id);
        next_id += 1;
        r
    };

    let catalog_id = alloc();
    let pages_id = alloc();
    let font_regular_id = alloc();
    let font_bold_id = alloc();
    let page_ids: Vec<Ref> = (0..num_pages).map(|_| alloc()).collect();
    let content_ids: Vec<Ref> = (0..num_pages).map(|_| alloc()).collect();

    // ── Document skeleton ──────────────────────────────────────────────────────
    let mut pdf = Pdf::new();
    pdf.catalog(catalog_id).pages(pages_id);

    let mut pages = pdf.pages(pages_id);
    pages.media_box(Rect::new(0.0, 0.0, PAGE_W, PAGE_H));
    pages.kids(page_ids.iter().copied());
    pages.finish();

    // Fontes
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

    let company = cfg.company_name.as_deref().unwrap_or("ClearDataTicket");

    for page_idx in 0..num_pages {
        let row_start = page_idx * rows_per_page;
        let row_end = (row_start + rows_per_page).min(total_rows);
        let page_rows = if row_start < total_rows {
            &cfg.rows[row_start..row_end]
        } else {
            &[]
        };

        let mut c = Content::new();

        // ── 1. HEADER BAND (gradiente) ──────────────────────────────────────────
        let header_y = PAGE_H - header_h;
        let grad_steps = 50u32;
        for i in 0..grad_steps {
            let t = i as f32 / (grad_steps - 1) as f32;
            let r = lerp(primary[0], accent[0], t);
            let g = lerp(primary[1], accent[1], t);
            let b = lerp(primary[2], accent[2], t);
            let x = i as f32 * (PAGE_W / grad_steps as f32);
            let w = PAGE_W / grad_steps as f32 + 1.0;
            c.set_fill_rgb(r, g, b);
            c.rect(x, header_y, w, header_h);
            c.fill_nonzero();
        }

        // Círculos decorativos
        draw_circle(
            &mut c,
            PAGE_W - 55.0,
            PAGE_H - header_h / 2.0,
            38.0,
            accent[0] * 0.7 + 0.3,
            accent[1] * 0.7 + 0.3,
            accent[2] * 0.7 + 0.3,
            true,
        );

        // Company name
        show_text(
            &mut c,
            &to_win_ansi(company, 40),
            Name(b"F1"),
            8.5,
            MARGIN,
            PAGE_H - 18.0,
            [0.85, 0.93, 1.0],
        );

        // Title
        show_text(
            &mut c,
            &to_win_ansi(&cfg.title, 60),
            Name(b"F2"),
            19.0,
            MARGIN,
            PAGE_H - 46.0,
            [1.0, 1.0, 1.0],
        );

        // Subtitle
        if let Some(ref sub) = cfg.subtitle {
            show_text(
                &mut c,
                &to_win_ansi(sub, 80),
                Name(b"F1"),
                9.5,
                MARGIN,
                PAGE_H - 64.0,
                [0.85, 0.93, 1.0],
            );
        }

        // Page counter
        let pg_text = format!("Página {} de {}", page_idx + 1, num_pages);
        show_text(
            &mut c,
            pg_text.as_bytes(),
            Name(b"F1"),
            8.5,
            PAGE_W - 110.0,
            PAGE_H - 18.0,
            [0.85, 0.93, 1.0],
        );

        let mut current_y = header_y - 25.0;

        // ── 1b. METRIC CARDS ────────────────────────────────────────────────────
        if has_metric_cards && page_idx == 0 {
            let cards = cfg.metric_cards.as_ref().unwrap();
            let card_width =
                (table_w - (cards.len().min(6) - 1) as f32 * 10.0) / cards.len().min(6) as f32;
            draw_metric_cards(
                &mut c,
                cards,
                MARGIN,
                current_y - metric_cards_h + 10.0,
                card_width,
                metric_cards_h - 15.0,
                primary,
                accent,
            );
            current_y -= metric_cards_h + 5.0;
        }

        // ── 2. GRÁFICOS ─────────────────────────────────────────────────────────
        if has_charts && page_idx == 0 {
            let charts = cfg.chart_data.as_ref().unwrap();
            let chart_width = (table_w - 20.0) / charts.len().min(2) as f32;

            for (idx, chart) in charts.iter().enumerate().take(2) {
                let chart_x = MARGIN + idx as f32 * (chart_width + 20.0);
                let chart_y = current_y - 160.0;

                // Fundo branco do gráfico
                c.set_fill_rgb(1.0, 1.0, 1.0);
                c.rect(chart_x, chart_y, chart_width, 150.0);
                c.fill_nonzero();

                // Borda
                c.set_stroke_rgb(0.8, 0.8, 0.8);
                c.set_line_width(0.5);
                c.rect(chart_x, chart_y, chart_width, 150.0);
                c.stroke();

                // Título do gráfico
                show_text(
                    &mut c,
                    &to_win_ansi(&chart.title, 30),
                    Name(b"F2"),
                    9.0,
                    chart_x + 10.0,
                    chart_y + 140.0,
                    primary,
                );

                // Desenha o gráfico baseado no tipo
                match chart.chart_type.as_str() {
                    "bar" => draw_bar_chart(
                        &mut c,
                        chart,
                        chart_x + 10.0,
                        chart_y + 20.0,
                        chart_width - 20.0,
                        110.0,
                        accent,
                        "",
                        5.5,
                        [0.55, 0.55, 0.60],
                        [0.88, 0.88, 0.92],
                        8,
                    ),
                    "line" => draw_line_chart(
                        &mut c,
                        chart,
                        chart_x + 10.0,
                        chart_y + 20.0,
                        chart_width - 20.0,
                        110.0,
                        accent,
                        primary,
                    ),
                    "pie" | "donut" => draw_pie_chart(
                        &mut c,
                        chart,
                        chart_x + 10.0,
                        chart_y + 20.0,
                        chart_width - 20.0,
                        110.0,
                        accent,
                        primary,
                    ),
                    _ => draw_bar_chart(
                        &mut c,
                        chart,
                        chart_x + 10.0,
                        chart_y + 20.0,
                        chart_width - 20.0,
                        110.0,
                        accent,
                        "",
                        5.5,
                        [0.55, 0.55, 0.60],
                        [0.88, 0.88, 0.92],
                        8,
                    ),
                }
            }
            current_y -= 180.0;
        }

        // ── 3. TABLE ───────────────────────────────────────────────────────────
        let table_top = current_y - 12.0;
        const CELL_PAD: f32 = 8.0;

        if !cfg.headers.is_empty() {
            let hrow_y = table_top - HEADER_ROW_H;

            // ── Header row ──────────────────────────────────────
            draw_rounded_rect_fill(
                &mut c,
                MARGIN,
                hrow_y,
                table_w,
                HEADER_ROW_H,
                5.0,
                primary[0],
                primary[1],
                primary[2],
                1.0,
            );

            // Accent line at bottom of header
            c.set_stroke_rgb(accent[0], accent[1], accent[2]);
            c.set_line_width(1.5);
            c.move_to(MARGIN, hrow_y);
            c.line_to(PAGE_W - MARGIN, hrow_y);
            c.stroke();

            // Header labels
            for (i, lbl) in cfg.headers.iter().enumerate() {
                let x = MARGIN + i as f32 * col_w + CELL_PAD;
                let y = hrow_y + 8.0;
                show_text(
                    &mut c,
                    &to_win_ansi(lbl, 22),
                    Name(b"F2"),
                    8.0,
                    x,
                    y,
                    [1.0, 1.0, 1.0],
                );
            }

            // ── Data rows ────────────────────────────────────────
            if !page_rows.is_empty() {
                let first_data_y = table_top - HEADER_ROW_H - DATA_ROW_H;
                let last_data_y = table_top - HEADER_ROW_H - page_rows.len() as f32 * DATA_ROW_H;

                for (ri, row) in page_rows.iter().enumerate() {
                    let row_y = table_top - HEADER_ROW_H - (ri + 1) as f32 * DATA_ROW_H;

                    // Alternating rows (tinted with primary color at 5%)
                    if ri % 2 == 0 {
                        c.set_fill_rgb(
                            1.0 - (1.0 - primary[0]) * 0.05,
                            1.0 - (1.0 - primary[1]) * 0.05,
                            1.0 - (1.0 - primary[2]) * 0.05,
                        );
                        c.rect(MARGIN, row_y, table_w, DATA_ROW_H);
                        c.fill_nonzero();
                    }

                    // Horizontal grid line at bottom of row
                    c.set_stroke_rgb(0.92, 0.92, 0.95);
                    c.set_line_width(0.3);
                    c.move_to(MARGIN, row_y);
                    c.line_to(PAGE_W - MARGIN, row_y);
                    c.stroke();

                    // Cell text (first column in bold)
                    for (ci, cell) in row.cells.iter().enumerate().take(col_count) {
                        let x = MARGIN + ci as f32 * col_w + CELL_PAD;
                        let y = row_y + 6.0;
                        let font = if ci == 0 { Name(b"F2") } else { Name(b"F1") };
                        show_text(
                            &mut c,
                            &to_win_ansi(cell, 25),
                            font,
                            7.0,
                            x,
                            y,
                            [0.15, 0.15, 0.20],
                        );
                    }
                }

                // Vertical grid lines between columns
                c.set_stroke_rgb(0.92, 0.92, 0.95);
                c.set_line_width(0.3);
                for ci in 1..col_count {
                    let vx = MARGIN + ci as f32 * col_w;
                    c.move_to(vx, first_data_y);
                    c.line_to(vx, last_data_y);
                    c.stroke();
                }

                // Bottom border line
                c.set_stroke_rgb(0.85, 0.85, 0.90);
                c.set_line_width(0.8);
                c.move_to(MARGIN, last_data_y);
                c.line_to(PAGE_W - MARGIN, last_data_y);
                c.stroke();
            }
        }

        // ── 4. FOOTER ──────────────────────────────────────────────────────────
        c.set_stroke_rgb(accent[0], accent[1], accent[2]);
        c.set_line_width(1.2);
        c.move_to(MARGIN, FOOTER_H + 14.0);
        c.line_to(PAGE_W - MARGIN, FOOTER_H + 14.0);
        c.stroke();

        show_text(
            &mut c,
            &to_win_ansi(company, 40),
            Name(b"F1"),
            7.0,
            MARGIN,
            FOOTER_H,
            [0.50, 0.52, 0.56],
        );

        let pg_r = format!("Pág. {} / {}", page_idx + 1, num_pages);
        show_text(
            &mut c,
            pg_r.as_bytes(),
            Name(b"F1"),
            7.0,
            PAGE_W - 70.0,
            FOOTER_H,
            [0.50, 0.52, 0.56],
        );

        if let Some(date_str) = &cfg.generation_date {
            let date_text = format!("Gerado em: {}", date_str);
            show_text(
                &mut c,
                &to_win_ansi(&date_text, 35),
                Name(b"F1"),
                6.5,
                PAGE_W / 2.0 - 65.0,
                FOOTER_H,
                [0.50, 0.52, 0.56],
            );
        }

        // ── Assemble page ──────────────────────────────────────────────────────
        let content_bytes = c.finish();

        let mut page = pdf.page(page_ids[page_idx]);
        page.parent(pages_id);
        page.media_box(Rect::new(0.0, 0.0, PAGE_W, PAGE_H));
        {
            let mut res = page.resources();
            let mut fonts = res.fonts();
            fonts.pair(Name(b"F1"), font_regular_id);
            fonts.pair(Name(b"F2"), font_bold_id);
            fonts.finish();
        }
        page.contents(content_ids[page_idx]);
        page.finish();

        pdf.stream(content_ids[page_idx], &content_bytes);
    }

    Ok(pdf.finish())
}

// ─── Helpers inlines (usados pelo render_template) ──────────────────────────
fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + t * (b - a)
}

pub(crate) fn show_text(
    c: &mut Content,
    text: &[u8],
    font: Name,
    size: f32,
    x: f32,
    y: f32,
    rgb: [f32; 3],
) {
    c.begin_text();
    c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
    c.set_font(font, size);
    c.set_text_matrix([1.0, 0.0, 0.0, 1.0, x, y]);
    c.show(Str(text));
    c.end_text();
}

fn draw_rounded_rect_fill(
    c: &mut Content,
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    r: f32,
    cr: f32,
    cg: f32,
    cb: f32,
    _opacity: f32,
) {
    c.set_fill_rgb(cr, cg, cb);
    rounded_rect_path(c, x, y, w, h, r);
    c.fill_nonzero();
}

fn rounded_rect_path(c: &mut Content, x: f32, y: f32, w: f32, h: f32, r: f32) {
    let k = KAPPA * r;
    c.move_to(x + r, y);
    c.line_to(x + w - r, y);
    c.cubic_to(x + w - r + k, y, x + w, y + r - k, x + w, y + r);
    c.line_to(x + w, y + h - r);
    c.cubic_to(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h);
    c.line_to(x + r, y + h);
    c.cubic_to(x + r - k, y + h, x, y + h - r + k, x, y + h - r);
    c.line_to(x, y + r);
    c.cubic_to(x, y + r - k, x + r - k, y, x + r, y);
    c.close_path();
}

fn draw_circle(c: &mut Content, cx: f32, cy: f32, r: f32, cr: f32, cg: f32, cb: f32, fill: bool) {
    let k = KAPPA * r;
    if fill {
        c.set_fill_rgb(cr, cg, cb);
    } else {
        c.set_stroke_rgb(cr, cg, cb);
    }
    c.move_to(cx + r, cy);
    c.cubic_to(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
    c.cubic_to(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
    c.cubic_to(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
    c.cubic_to(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
    c.close_path();
    if fill {
        c.fill_nonzero();
    } else {
        c.stroke();
    }
}

// ─── Encoding (delega para módulo centralizado) ─────────────────────────────
pub(crate) fn to_win_ansi(s: &str, max_chars: usize) -> Vec<u8> {
    let mut bytes = to_utf8_winansi(s, max_chars);
    if bytes.len() > max_chars {
        bytes.truncate(max_chars);
        bytes.extend_from_slice(b"...");
    }
    bytes
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOVO: Render Plan — motor de template JSON
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderPlan {
    pub page: PageConfig,
    pub elements: Vec<RenderElement>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PageConfig {
    pub width: Option<f32>,
    pub height: Option<f32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderElement {
    pub r#type: String, // "rect" | "text" | "line"
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
    // rect
    pub background_color: Option<String>, // "#RRGGBB" ou "#RRGGBBAA"
    pub border_radius: Option<f32>,
    // text
    pub text: Option<String>,
    pub font_size: Option<f32>,
    pub color: Option<String>,
    pub bold: Option<bool>,
    pub align: Option<String>, // "left" | "center" | "right"
    // line
    pub line_color: Option<String>,
    pub line_width: Option<f32>,
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn render_template(plan_json: &str) -> Result<Vec<u8>, JsError> {
    let plan: RenderPlan =
        serde_json::from_str(plan_json).map_err(|e| JsError::new(&e.to_string()))?;
    execute_render_plan(&plan).map_err(|e| JsError::new(&e))
}

fn execute_render_plan(plan: &RenderPlan) -> Result<Vec<u8>, String> {
    let pw = plan.page.width.unwrap_or(PAGE_W);
    let ph = plan.page.height.unwrap_or(PAGE_H);

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
    let page_id = alloc();
    let content_id = alloc();

    pdf.catalog(catalog_id).pages(pages_id);

    let mut pages = pdf.pages(pages_id);
    pages.media_box(Rect::new(0.0, 0.0, pw, ph));
    pages.kids([page_id]);
    pages.finish();

    // Fontes
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

    let mut c = Content::new();

    // Fundo branco
    c.set_fill_rgb(1.0, 1.0, 1.0);
    c.rect(0.0, 0.0, pw, ph);
    c.fill_nonzero();

    for el in &plan.elements {
        match el.r#type.as_str() {
            "rect" => draw_rect_element(&mut c, el),
            "text" => draw_text_element(&mut c, el),
            "line" => draw_line_element(&mut c, el),
            _ => {}
        }
    }

    let content_bytes = c.finish();

    let mut page = pdf.page(page_id);
    page.parent(pages_id);
    page.media_box(Rect::new(0.0, 0.0, pw, ph));
    {
        let mut res = page.resources();
        let mut fonts = res.fonts();
        fonts.pair(Name(b"F1"), font_regular_id);
        fonts.pair(Name(b"F2"), font_bold_id);
        fonts.finish();
    }
    page.contents(content_id);
    page.finish();

    pdf.stream(content_id, &content_bytes);

    Ok(pdf.finish())
}

pub(crate) fn hex_to_rgb(hex: &str) -> [f32; 3] {
    let hex = hex.trim_start_matches('#');
    if hex.len() < 6 {
        return [0.0, 0.0, 0.0];
    }
    let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0) as f32 / 255.0;
    let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0) as f32 / 255.0;
    let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0) as f32 / 255.0;
    [r, g, b]
}

fn draw_rect_element(c: &mut Content, el: &RenderElement) {
    let bg = el.background_color.as_deref().unwrap_or("#cccccc");
    let rgb = hex_to_rgb(bg);
    let r = el.border_radius.unwrap_or(0.0);

    if r > 0.5 {
        c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
        rounded_rect_path(c, el.x, el.y, el.w, el.h, r);
        c.fill_nonzero();
    } else {
        c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
        c.rect(el.x, el.y, el.w, el.h);
        c.fill_nonzero();
    }
}

fn draw_text_element(c: &mut Content, el: &RenderElement) {
    let text = match el.text.as_deref() {
        Some(t) => t,
        None => return,
    };
    let size = el.font_size.unwrap_or(10.0);
    let color = el.color.as_deref().unwrap_or("#000000");
    let rgb = hex_to_rgb(color);
    let bold = el.bold.unwrap_or(false);
    let align = el.align.as_deref().unwrap_or("left");

    let font = if bold { Name(b"F2") } else { Name(b"F1") };
    let encoded = to_utf8_winansi(text, 200);

    // Calculate text width approximation (rough: ~0.6 * size per char for Helvetica)
    let text_width = encoded.len() as f32 * size * 0.32;

    let (tx, ty) = match align {
        "center" => (el.x + (el.w - text_width) / 2.0, el.y),
        "right" => (el.x + el.w - text_width, el.y),
        _ => (el.x, el.y),
    };

    show_text(c, &encoded, font, size, tx, ty, rgb);
}

fn draw_line_element(c: &mut Content, el: &RenderElement) {
    let color = el.line_color.as_deref().unwrap_or("#000000");
    let rgb = hex_to_rgb(color);
    let lw = el.line_width.unwrap_or(0.5);

    c.set_stroke_rgb(rgb[0], rgb[1], rgb[2]);
    c.set_line_width(lw);
    c.move_to(el.x, el.y);
    c.line_to(el.x + el.w, el.y);
    c.stroke();
}
