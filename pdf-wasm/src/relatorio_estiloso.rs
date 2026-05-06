use pdf_writer::{Content, Finish, Name, Pdf, Rect, Ref, Str};
use serde::Deserialize;
use wasm_bindgen::prelude::*;

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const PAGE_W: f32 = 595.28;
const PAGE_H: f32 = 841.89;
const MARGIN: f32 = 40.0;
const KAPPA: f32 = 0.5522847498;

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RelatorioConfig {
    pub titulo: String,
    pub subtitulo: Option<String>,
    pub empresa: Option<String>,
    pub cor_primaria: Option<[f32; 3]>,
    pub cor_destaque: Option<[f32; 3]>,
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────
#[wasm_bindgen]
pub fn gerar_relatorio_estiloso(config_json: &str) -> Result<Vec<u8>, JsError> {
    let cfg: RelatorioConfig =
        serde_json::from_str(config_json).map_err(|e| JsError::new(&e.to_string()))?;
    criar_relatorio(&cfg).map_err(|e| JsError::new(&e))
}

// ─── CRIA RELATÓRIO PREMIUM ───────────────────────────────────────────────────
fn criar_relatorio(cfg: &RelatorioConfig) -> Result<Vec<u8>, String> {
    let mut pdf = Pdf::new();

    // Cores
    let primary = cfg.cor_primaria.unwrap_or([0.122, 0.302, 0.702]);
    let accent = cfg.cor_destaque.unwrap_or([0.961, 0.620, 0.043]);
    let empresa = cfg.empresa.as_deref().unwrap_or("ClearDataTicket");

    // IDs
    let mut next_id = 1;
    let mut alloc = || {
        let r = Ref::new(next_id);
        next_id += 1;
        r
    };

    let catalog_id = alloc();
    let pages_id = alloc();
    let font_regular_id = alloc();
    let font_bold_id = alloc();
    let font_mono_id = alloc();
    let page_id = alloc();
    let content_id = alloc();

    // Estrutura
    pdf.catalog(catalog_id).pages(pages_id);

    let mut pages = pdf.pages(pages_id);
    pages.media_box(Rect::new(0.0, 0.0, PAGE_W, PAGE_H));
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
    {
        let mut f = pdf.type1_font(font_mono_id);
        f.base_font(Name(b"Courier"));
        f.encoding_predefined(Name(b"WinAnsiEncoding"));
    }

    let mut c = Content::new();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. BACKGROUND COM DEGRADÊ SUTIL
    // ─────────────────────────────────────────────────────────────────────────
    for i in 0..100 {
        let t = i as f32 / 99.0;
        let x = i as f32 * (PAGE_W / 99.0);
        let intensidade = 0.98 - t * 0.08;
        c.set_fill_rgb(intensidade, intensidade, 1.0);
        c.rect(x, 0.0, PAGE_W / 99.0 + 1.0, PAGE_H);
        c.fill_nonzero();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. HEADER PREMIUM
    // ─────────────────────────────────────────────────────────────────────────
    let header_h = 140.0;
    let header_y = PAGE_H - header_h;

    for i in 0..60 {
        let t = i as f32 / 59.0;
        let r = lerp(primary[0], primary[0] * 0.6, t);
        let g = lerp(primary[1], primary[1] * 0.5, t);
        let b = lerp(primary[2], primary[2] * 0.7, t);
        let x = i as f32 * (PAGE_W / 59.0);
        c.set_fill_rgb(r, g, b);
        c.rect(x, header_y, PAGE_W / 59.0 + 1.0, header_h);
        c.fill_nonzero();
    }

    c.set_stroke_rgb(accent[0], accent[1], accent[2]);
    c.set_line_width(3.0);
    c.move_to(0.0, header_y + header_h);
    c.line_to(PAGE_W, header_y + header_h);
    c.stroke();

    c.set_stroke_rgb(accent[0], accent[1], accent[2]);
    c.set_line_width(0.5);
    c.move_to(MARGIN, header_y);
    c.line_to(PAGE_W - MARGIN, header_y);
    c.stroke();

    // ─────────────────────────────────────────────────────────────────────────
    // 3. LOGO/CÍRCULO DECORATIVO
    // ─────────────────────────────────────────────────────────────────────────
    for i in 0..20 {
        let t = i as f32 / 19.0;
        let r = lerp(accent[0], primary[0], t);
        let g = lerp(accent[1], primary[1], t);
        let b = lerp(accent[2], primary[2], t);
        let raio = 35.0 - t * 5.0;
        draw_circle(&mut c, PAGE_W - 70.0, header_y + 70.0, raio, r, g, b, true);
    }

    draw_circle(
        &mut c,
        PAGE_W - 70.0,
        header_y + 70.0,
        22.0,
        1.0,
        1.0,
        1.0,
        true,
    );

    c.begin_text();
    c.set_fill_rgb(primary[0], primary[1], primary[2]);
    c.set_font(Name(b"F2"), 14.0);
    c.set_text_matrix([1.0, 0.0, 0.0, 1.0, PAGE_W - 80.0, header_y + 66.0]);
    c.show(Str(b"PDF"));
    c.end_text();

    // ─────────────────────────────────────────────────────────────────────────
    // 4. TÍTULOS
    // ─────────────────────────────────────────────────────────────────────────
    show_text(
        &mut c,
        &to_win_ansi(empresa, 40),
        Name(b"F1"),
        9.0,
        MARGIN,
        header_y + header_h - 18.0,
        [0.7, 0.7, 0.8],
    );

    show_text(
        &mut c,
        &to_win_ansi(&cfg.titulo, 50),
        Name(b"F2"),
        24.0,
        MARGIN,
        header_y + header_h - 50.0,
        [1.0, 1.0, 1.0],
    );

    if let Some(sub) = &cfg.subtitulo {
        show_text(
            &mut c,
            &to_win_ansi(sub, 60),
            Name(b"F1"),
            11.0,
            MARGIN,
            header_y + header_h - 75.0,
            [0.85, 0.85, 0.9],
        );
    }

    // Data estática
    let data = "Gerado em: 15/04/2026";
    show_text(
        &mut c,
        data.as_bytes(),
        Name(b"F1"),
        7.5,
        MARGIN,
        header_y + header_h - 100.0,
        [0.7, 0.7, 0.8],
    );

    let mut current_y = header_y - 30.0;

    // ─────────────────────────────────────────────────────────────────────────
    // 5. CARDS DE MÉTRICAS
    // ─────────────────────────────────────────────────────────────────────────
    let cards: [(&str, &str, &str, &str); 4] = [
        ("Receita Total", "R$ 847.522", "+23%", "$"),
        ("Clientes Ativos", "1.847", "+12%", "U"),
        ("Ticket Medio", "R$ 458", "+8%", "T"),
        ("NPS", "76", "+5pt", "N"),
    ];

    let card_w = (PAGE_W - 2.0 * MARGIN - 30.0) / 4.0;

    for (i, (titulo, valor, variacao, icone)) in cards.iter().enumerate() {
        let cx = MARGIN + i as f32 * (card_w + 10.0);
        let card_y = current_y - 85.0;
        let card_h = 75.0;

        c.set_fill_rgb(0.92, 0.92, 0.96);
        rounded_rect_path(&mut c, cx + 2.0, card_y - 2.0, card_w, card_h, 10.0);
        c.fill_nonzero();

        c.set_fill_rgb(1.0, 1.0, 1.0);
        rounded_rect_path(&mut c, cx, card_y, card_w, card_h, 10.0);
        c.fill_nonzero();

        c.set_stroke_rgb(accent[0], accent[1], accent[2]);
        c.set_line_width(3.0);
        c.move_to(cx + 3.0, card_y + 5.0);
        c.line_to(cx + 3.0, card_y + card_h - 5.0);
        c.stroke();

        show_text(
            &mut c,
            icone.as_bytes(),
            Name(b"F1"),
            18.0,
            cx + 12.0,
            card_y + card_h - 20.0,
            [0.3, 0.3, 0.4],
        );

        show_text(
            &mut c,
            valor.as_bytes(),
            Name(b"F2"),
            16.0,
            cx + 40.0,
            card_y + card_h - 22.0,
            primary,
        );

        show_text(
            &mut c,
            titulo.as_bytes(),
            Name(b"F1"),
            7.5,
            cx + 40.0,
            card_y + card_h - 42.0,
            [0.5, 0.5, 0.6],
        );

        let cor_variacao = if variacao.starts_with('+') {
            [0.1, 0.7, 0.2]
        } else {
            [0.8, 0.2, 0.2]
        };
        show_text(
            &mut c,
            variacao.as_bytes(),
            Name(b"F1"),
            8.0,
            cx + 40.0,
            card_y + 10.0,
            cor_variacao,
        );
    }

    current_y -= 100.0;

    // ─────────────────────────────────────────────────────────────────────────
    // 6. GRAFICO DE BARRAS
    // ─────────────────────────────────────────────────────────────────────────
    c.set_stroke_rgb(primary[0], primary[1], primary[2]);
    c.set_line_width(2.0);
    c.move_to(MARGIN, current_y);
    c.line_to(PAGE_W - MARGIN, current_y);
    c.stroke();

    show_text(
        &mut c,
        b"GRAFICO - PERFORMANCE MENSAL",
        Name(b"F2"),
        14.0,
        MARGIN,
        current_y - 15.0,
        primary,
    );

    current_y -= 45.0;

    let chart_data: [f32; 6] = [85.0, 92.0, 78.0, 88.0, 95.0, 82.0];
    let chart_labels: [&str; 6] = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    let chart_w = PAGE_W - 2.0 * MARGIN;
    let chart_h = 140.0;
    let chart_x = MARGIN;
    let chart_y = current_y - chart_h;

    c.set_fill_rgb(1.0, 1.0, 1.0);
    rounded_rect_path(&mut c, chart_x, chart_y, chart_w, chart_h, 8.0);
    c.fill_nonzero();

    c.set_stroke_rgb(0.85, 0.85, 0.9);
    c.set_line_width(0.8);
    rounded_rect_path(&mut c, chart_x, chart_y, chart_w, chart_h, 8.0);
    c.stroke();

    let max_val = chart_data.iter().fold(0.0f32, |a, &b| a.max(b));
    let bar_w = chart_w / chart_data.len() as f32 * 0.6;
    let bar_spacing = chart_w / chart_data.len() as f32;

    for (i, &val) in chart_data.iter().enumerate() {
        let altura = (val / max_val) * (chart_h - 40.0);
        let bar_x = chart_x + i as f32 * bar_spacing + (bar_spacing - bar_w) / 2.0;
        let bar_y = chart_y + (chart_h - 40.0) - altura;

        let intensidade = 0.5 + (val / max_val) * 0.5;
        c.set_fill_rgb(
            primary[0] * intensidade,
            primary[1] * intensidade,
            primary[2] * intensidade,
        );
        rounded_rect_path(&mut c, bar_x, bar_y, bar_w, altura, 4.0);
        c.fill_nonzero();

        let val_str = format!("{:.0}%", val);
        show_text(
            &mut c,
            val_str.as_bytes(),
            Name(b"F2"),
            7.5,
            bar_x + 3.0,
            bar_y - 12.0,
            primary,
        );

        show_text(
            &mut c,
            chart_labels[i].as_bytes(),
            Name(b"F1"),
            8.0,
            bar_x + 3.0,
            chart_y + 5.0,
            [0.4, 0.4, 0.5],
        );
    }

    c.set_stroke_rgb(0.7, 0.7, 0.8);
    c.set_line_width(0.5);
    c.move_to(chart_x, chart_y + chart_h - 40.0);
    c.line_to(chart_x + chart_w, chart_y + chart_h - 40.0);
    c.stroke();

    current_y -= chart_h + 20.0;

    // ─────────────────────────────────────────────────────────────────────────
    // 7. TABELA DE INDICADORES
    // ─────────────────────────────────────────────────────────────────────────
    show_text(
        &mut c,
        b"TABELA DE INDICADORES",
        Name(b"F2"),
        14.0,
        MARGIN,
        current_y - 10.0,
        primary,
    );

    current_y -= 40.0;

    // Cabecalho
    c.set_fill_rgb(primary[0], primary[1], primary[2]);
    rounded_rect_path(
        &mut c,
        MARGIN,
        current_y - 25.0,
        PAGE_W - 2.0 * MARGIN,
        25.0,
        6.0,
    );
    c.fill_nonzero();

    let colunas: [&str; 5] = ["INDICADOR", "VALOR", "REALIZADO", "META", "STATUS"];
    let col_w = (PAGE_W - 2.0 * MARGIN) / colunas.len() as f32;

    for (i, col) in colunas.iter().enumerate() {
        show_text(
            &mut c,
            col.as_bytes(),
            Name(b"F2"),
            9.0,
            MARGIN + i as f32 * col_w + 8.0,
            current_y - 16.0,
            [1.0, 1.0, 1.0],
        );
    }

    current_y -= 35.0;

    let dados: [(&str, &str, &str, &str, &str); 5] = [
        ("Receita Total", "R$ 847.522", "92%", "R$ 920.000", "OK"),
        ("Clientes Novos", "347", "115%", "300", "OK"),
        ("Ticket Medio", "R$ 458", "102%", "R$ 450", "OK"),
        ("Margem Bruta", "42%", "105%", "40%", "OK"),
        ("Churn", "3.2%", "80%", "4.0%", "OK"),
    ];

    for (i, (indicador, valor, realizado, meta, status)) in dados.iter().enumerate() {
        let row_y = current_y - i as f32 * 22.0;

        if i % 2 == 0 {
            c.set_fill_rgb(0.98, 0.98, 1.0);
            c.rect(MARGIN, row_y - 18.0, PAGE_W - 2.0 * MARGIN, 22.0);
            c.fill_nonzero();
        }

        show_text(
            &mut c,
            indicador.as_bytes(),
            Name(b"F2"),
            8.0,
            MARGIN + 0.0 * col_w + 8.0,
            row_y - 12.0,
            [0.2, 0.2, 0.3],
        );
        show_text(
            &mut c,
            valor.as_bytes(),
            Name(b"F1"),
            8.0,
            MARGIN + 1.0 * col_w + 8.0,
            row_y - 12.0,
            [0.3, 0.3, 0.4],
        );
        show_text(
            &mut c,
            realizado.as_bytes(),
            Name(b"F1"),
            8.0,
            MARGIN + 2.0 * col_w + 8.0,
            row_y - 12.0,
            [0.3, 0.3, 0.4],
        );
        show_text(
            &mut c,
            meta.as_bytes(),
            Name(b"F1"),
            8.0,
            MARGIN + 3.0 * col_w + 8.0,
            row_y - 12.0,
            [0.3, 0.3, 0.4],
        );

        let cor_status = if *status == "OK" {
            [0.1, 0.7, 0.2]
        } else {
            [0.8, 0.2, 0.2]
        };
        show_text(
            &mut c,
            status.as_bytes(),
            Name(b"F2"),
            9.0,
            MARGIN + 4.0 * col_w + 8.0,
            row_y - 12.0,
            cor_status,
        );
    }

    current_y -= (dados.len() as f32 * 22.0) + 30.0;

    // ─────────────────────────────────────────────────────────────────────────
    // 8. RODAPE
    // ─────────────────────────────────────────────────────────────────────────
    let footer_y = 40.0;

    c.set_stroke_rgb(accent[0], accent[1], accent[2]);
    c.set_line_width(1.5);
    c.move_to(MARGIN, footer_y + 15.0);
    c.line_to(PAGE_W - MARGIN, footer_y + 15.0);
    c.stroke();

    c.set_stroke_rgb(0.85, 0.85, 0.9);
    c.set_line_width(0.5);
    c.move_to(MARGIN, footer_y + 12.0);
    c.line_to(PAGE_W - MARGIN, footer_y + 12.0);
    c.stroke();

    show_text(
        &mut c,
        &to_win_ansi(empresa, 40),
        Name(b"F1"),
        7.5,
        MARGIN,
        footer_y,
        [0.45, 0.45, 0.55],
    );

    show_text(
        &mut c,
        b"Relatorio Gerado pelo Sistema",
        Name(b"F1"),
        7.0,
        PAGE_W / 2.0 - 100.0,
        footer_y,
        [0.45, 0.45, 0.55],
    );

    show_text(
        &mut c,
        b"Pagina 1 de 1",
        Name(b"F1"),
        7.5,
        PAGE_W - 80.0,
        footer_y,
        [0.45, 0.45, 0.55],
    );

    // ─────────────────────────────────────────────────────────────────────────
    // FINALIZA
    // ─────────────────────────────────────────────────────────────────────────
    let content_bytes = c.finish();

    let mut page = pdf.page(page_id);
    page.parent(pages_id);
    page.media_box(Rect::new(0.0, 0.0, PAGE_W, PAGE_H));
    {
        let mut res = page.resources();
        let mut fonts = res.fonts();
        fonts.pair(Name(b"F1"), font_regular_id);
        fonts.pair(Name(b"F2"), font_bold_id);
        fonts.pair(Name(b"F3"), font_mono_id);
        fonts.finish();
    }
    page.contents(content_id);
    page.finish();

    pdf.stream(content_id, &content_bytes);

    Ok(pdf.finish())
}

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + t * (b - a)
}

fn show_text(c: &mut Content, text: &[u8], font: Name, size: f32, x: f32, y: f32, rgb: [f32; 3]) {
    c.begin_text();
    c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
    c.set_font(font, size);
    c.set_text_matrix([1.0, 0.0, 0.0, 1.0, x, y]);
    c.show(Str(text));
    c.end_text();
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

fn to_win_ansi(s: &str, max_chars: usize) -> Vec<u8> {
    crate::encoding::to_win_ansi(s, max_chars)
}
