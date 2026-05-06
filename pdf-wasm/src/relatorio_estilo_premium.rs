use crate::KAPPA;
use pdf_writer::{Content, Finish, Name, Pdf, Rect, Ref, Str};
use serde::Deserialize;
use wasm_bindgen::prelude::*;

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const PAGE_W: f32 = 595.28;
const PAGE_H: f32 = 841.89;
const MARGIN: f32 = 20.0;

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PremiumConfig {
    pub titulo: String,
    pub subtitulo: Option<String>,
    pub empresa: Option<String>,
    pub cor_primaria: Option<[f32; 3]>,
    pub cor_destaque: Option<[f32; 3]>,
    pub cor_secundaria: Option<[f32; 3]>,
}

#[wasm_bindgen]
pub fn gerar_relatorio_premium(config_json: &str) -> Result<Vec<u8>, JsError> {
    let cfg: PremiumConfig =
        serde_json::from_str(config_json).map_err(|e| JsError::new(&e.to_string()))?;
    criar_relatorio_premium(&cfg).map_err(|e| JsError::new(&e))
}

fn criar_relatorio_premium(cfg: &PremiumConfig) -> Result<Vec<u8>, String> {
    let mut pdf = Pdf::new();

    // Paleta de cores moderna
    let primary = cfg.cor_primaria.unwrap_or([0.07, 0.13, 0.26]); // #122142 - Navy Profundo
    let accent = cfg.cor_destaque.unwrap_or([0.98, 0.45, 0.19]); // #FA7330 - Laranja Vibrante
    let secondary = cfg.cor_secundaria.unwrap_or([0.20, 0.80, 0.60]); // #33CC99 - Verde Menta
    let empresa = cfg.empresa.as_deref().unwrap_or("DATA VISION");

    // IDs
    let mut next_id = 1;
    let mut alloc = || {
        let r = Ref::new(next_id);
        next_id += 1;
        r
    };

    let catalog_id = alloc();
    let pages_id = alloc();
    let font_light_id = alloc();
    let font_bold_id = alloc();
    let font_black_id = alloc();
    let page_id = alloc();
    let content_id = alloc();

    pdf.catalog(catalog_id).pages(pages_id);
    let mut pages = pdf.pages(pages_id);
    pages.media_box(Rect::new(0.0, 0.0, PAGE_W, PAGE_H));
    pages.kids([page_id]);
    pages.finish();

    // Fontes
    {
        let mut f = pdf.type1_font(font_light_id);
        f.base_font(Name(b"Helvetica"));
        f.encoding_predefined(Name(b"WinAnsiEncoding"));
    }
    {
        let mut f = pdf.type1_font(font_bold_id);
        f.base_font(Name(b"Helvetica-Bold"));
        f.encoding_predefined(Name(b"WinAnsiEncoding"));
    }
    {
        let mut f = pdf.type1_font(font_black_id);
        f.base_font(Name(b"Helvetica-Bold"));
        f.encoding_predefined(Name(b"WinAnsiEncoding"));
    }

    let mut c = Content::new();

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. BACKGROUND COM PADRÃO DE PONTOS (MODERNO)
    // ═══════════════════════════════════════════════════════════════════════════
    c.set_fill_rgb(0.98, 0.98, 1.0);
    c.rect(0.0, 0.0, PAGE_W, PAGE_H);
    c.fill_nonzero();

    // Padrão de pontos decorativos
    for i in 0..150 {
        let x = (i as f32 * 37.0) % PAGE_W;
        let y = (i as f32 * 23.0) % PAGE_H;
        let opacity = 0.3 + (i as f32 % 50.0) / 100.0;
        if i % 3 == 0 {
            draw_small_circle(&mut c, x, y, 1.5, 0.85, 0.85, 0.95);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. BLOCO LATERAL ESQUERDO (ESTILO DASHBOARD MODERNO)
    // ═══════════════════════════════════════════════════════════════════════════
    let sidebar_w = 120.0;
    c.set_fill_rgb(primary[0] * 0.95, primary[1] * 0.95, primary[2] * 0.98);
    c.rect(0.0, 0.0, sidebar_w, PAGE_H);
    c.fill_nonzero();

    // Linha decorativa lateral
    c.set_stroke_rgb(accent[0], accent[1], accent[2]);
    c.set_line_width(3.0);
    c.move_to(sidebar_w - 2.0, 0.0);
    c.line_to(sidebar_w - 2.0, PAGE_H);
    c.stroke();

    // Logo minimalista na sidebar
    for i in 0..3 {
        let t = i as f32 / 2.0;
        let tamanho = 25.0 - t * 5.0;
        draw_circle(
            &mut c,
            sidebar_w / 2.0,
            80.0 + i as f32 * 35.0,
            tamanho,
            accent[0] * (1.0 - t * 0.3),
            accent[1] * (1.0 - t * 0.3),
            accent[2] * (1.0 - t * 0.3),
            true,
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. HEADER HERO (ESTILO REVISTA)
    // ═══════════════════════════════════════════════════════════════════════════
    let hero_h = 220.0;
    let hero_y = PAGE_H - hero_h;
    let content_start = sidebar_w + 20.0;
    let content_w = PAGE_W - content_start - MARGIN;

    // Gradiente dramático
    for i in 0..80 {
        let t = i as f32 / 79.0;
        let r = lerp(primary[0] * 1.2, primary[0] * 0.6, t);
        let g = lerp(primary[1] * 1.1, primary[1] * 0.4, t);
        let b = lerp(primary[2] * 1.3, primary[2] * 0.5, t);
        let x = content_start + i as f32 * (content_w / 80.0);
        c.set_fill_rgb(r, g, b);
        c.rect(x, hero_y, content_w / 80.0 + 1.0, hero_h);
        c.fill_nonzero();
    }

    for i in 0..200 {
        let x = content_start + (i as f32 * 23.0) % content_w;
        let y = hero_y + (i as f32 * 17.0) % hero_h;
        draw_small_circle(&mut c, x, y, 1.0, 1.0, 1.0, 1.0);
    }
    // Badge "RELATORIO EXECUTIVO"
    let badge_w = 180.0;
    let badge_h = 24.0;
    c.set_fill_rgb(accent[0], accent[1], accent[2]);
    rounded_rect_path(
        &mut c,
        content_start + 20.0,
        hero_y + 20.0,
        badge_w,
        badge_h,
        12.0,
    );
    c.fill_nonzero();

    show_text(
        &mut c,
        b"RELATORIO EXECUTIVO",
        Name(b"F1"),
        9.0,
        content_start + 30.0,
        hero_y + 35.0,
        [1.0, 1.0, 1.0],
    );

    // Título principal (grande, impactante)
    show_text(
        &mut c,
        &to_win_ansi(&cfg.titulo, 40),
        Name(b"F2"),
        28.0,
        content_start + 20.0,
        hero_y + 90.0,
        [1.0, 1.0, 1.0],
    );

    // Subtítulo com linha decorativa
    if let Some(sub) = &cfg.subtitulo {
        show_text(
            &mut c,
            &to_win_ansi(sub, 60),
            Name(b"F1"),
            11.0,
            content_start + 20.0,
            hero_y + 125.0,
            [0.85, 0.85, 0.95],
        );
    }

    // Linha de destaque
    c.set_stroke_rgb(accent[0], accent[1], accent[2]);
    c.set_line_width(2.5);
    c.move_to(content_start + 20.0, hero_y + 145.0);
    c.line_to(content_start + 120.0, hero_y + 145.0);
    c.stroke();

    // Data e empresa
    show_text(
        &mut c,
        &to_win_ansi(empresa, 30),
        Name(b"F1"),
        8.0,
        content_start + 20.0,
        hero_y + 165.0,
        [0.7, 0.7, 0.85],
    );

    show_text(
        &mut c,
        b"15 ABRIL 2026",
        Name(b"F1"),
        8.0,
        content_start + 20.0,
        hero_y + 185.0,
        [0.7, 0.7, 0.85],
    );

    let mut current_y = hero_y - 30.0;

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. KPI CARDS COM SOMBRAS (DESIGN MODERNO)
    // ═══════════════════════════════════════════════════════════════════════════
    let kpis = [
        ("RECEITA TOTAL", "R$ 1.2M", "+23%", secondary),
        ("NPS", "76", "+12pts", accent),
        ("TICKET MEDIO", "R$ 458", "+8%", [0.55, 0.33, 0.86]),
        ("CHURN", "2.4%", "-1.2pp", [0.98, 0.45, 0.19]),
    ];

    let kpi_w = (content_w - 30.0) / 4.0;

    for (i, (titulo, valor, tendencia, cor)) in kpis.iter().enumerate() {
        let cx = content_start + i as f32 * (kpi_w + 10.0);
        let card_y = current_y - 95.0;

        // Sombra
        c.set_fill_rgb(0.85, 0.85, 0.9);
        rounded_rect_path(&mut c, cx + 2.0, card_y - 2.0, kpi_w, 85.0, 12.0);
        c.fill_nonzero();

        // Card branco
        c.set_fill_rgb(1.0, 1.0, 1.0);
        rounded_rect_path(&mut c, cx, card_y, kpi_w, 85.0, 12.0);
        c.fill_nonzero();

        // Barra colorida no topo
        c.set_fill_rgb(cor[0], cor[1], cor[2]);
        rounded_rect_path(&mut c, cx, card_y + 75.0, kpi_w, 10.0, 4.0);
        c.fill_nonzero();

        // Título
        show_text(
            &mut c,
            titulo.as_bytes(),
            Name(b"F1"),
            7.0,
            cx + 12.0,
            card_y + 68.0,
            [0.5, 0.5, 0.65],
        );

        // Valor (grande)
        show_text(
            &mut c,
            valor.as_bytes(),
            Name(b"F2"),
            20.0,
            cx + 12.0,
            card_y + 45.0,
            [0.12, 0.12, 0.25],
        );

        // Tendência
        let cor_tend = if tendencia.starts_with('+') {
            [0.2, 0.7, 0.3]
        } else {
            [0.9, 0.3, 0.2]
        };
        show_text(
            &mut c,
            tendencia.as_bytes(),
            Name(b"F1"),
            8.0,
            cx + 12.0,
            card_y + 22.0,
            cor_tend,
        );
    }

    current_y -= 110.0;

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. SEÇÃO DE DESTAQUE COM FOTO/GRÁFICO
    // ═══════════════════════════════════════════════════════════════════════════
    let destacado_h = 180.0;
    let destacado_y = current_y - destacado_h;

    // Card de destaque
    c.set_fill_rgb(1.0, 1.0, 1.0);
    rounded_rect_path(
        &mut c,
        content_start,
        destacado_y,
        content_w,
        destacado_h,
        16.0,
    );
    c.fill_nonzero();

    c.set_stroke_rgb(0.92, 0.92, 0.96);
    c.set_line_width(1.0);
    rounded_rect_path(
        &mut c,
        content_start,
        destacado_y,
        content_w,
        destacado_h,
        16.0,
    );
    c.stroke();

    // Título da seção
    show_text(
        &mut c,
        b"ANALISE DE PERFORMANCE",
        Name(b"F2"),
        14.0,
        content_start + 20.0,
        destacado_y + 30.0,
        primary,
    );

    // Gráfico de barras estilizado
    let chart_dados = [92, 88, 95, 78, 86, 91, 84];
    let chart_labels = ["S", "T", "Q", "Q", "S", "S", "D"];
    let chart_w = content_w - 220.0;
    let chart_h = 110.0;
    let chart_x = content_start + 20.0;
    let chart_y = destacado_y + 50.0;

    let max_val = 100.0;
    let bar_w = chart_w / chart_dados.len() as f32 * 0.65;
    let bar_spacing = chart_w / chart_dados.len() as f32;

    for (i, &val) in chart_dados.iter().enumerate() {
        let altura = (val as f32 / max_val) * chart_h;
        let bar_x = chart_x + i as f32 * bar_spacing + (bar_spacing - bar_w) / 2.0;
        let bar_y = chart_y + chart_h - altura;

        // Gradiente da barra
        let intensidade = 0.4 + (val as f32 / max_val) * 0.6;
        c.set_fill_rgb(
            secondary[0] * intensidade,
            secondary[1] * intensidade,
            secondary[2] * intensidade,
        );
        rounded_rect_path(&mut c, bar_x, bar_y, bar_w, altura, 4.0);
        c.fill_nonzero();

        show_text(
            &mut c,
            chart_labels[i].as_bytes(),
            Name(b"F1"),
            7.0,
            bar_x + 2.0,
            chart_y + chart_h + 5.0,
            [0.5, 0.5, 0.6],
        );

        let val_str = format!("{}", val);
        show_text(
            &mut c,
            val_str.as_bytes(),
            Name(b"F2"),
            7.0,
            bar_x + 2.0,
            bar_y - 8.0,
            secondary,
        );
    }

    // Linha de base
    c.set_stroke_rgb(0.85, 0.85, 0.9);
    c.set_line_width(0.5);
    c.move_to(chart_x, chart_y + chart_h);
    c.line_to(chart_x + chart_w, chart_y + chart_h);
    c.stroke();

    // Callout estatístico (lado direito do gráfico)
    let callout_x = content_start + content_w - 140.0;
    c.set_fill_rgb(primary[0] * 0.95, primary[1] * 0.95, primary[2] * 0.98);
    rounded_rect_path(&mut c, callout_x, destacado_y + 45.0, 120.0, 115.0, 12.0);
    c.fill_nonzero();

    show_text(
        &mut c,
        b"MEDIA GERAL",
        Name(b"F1"),
        8.0,
        callout_x + 15.0,
        destacado_y + 70.0,
        [0.6, 0.6, 0.7],
    );

    show_text(
        &mut c,
        b"87.7%",
        Name(b"F2"),
        28.0,
        callout_x + 15.0,
        destacado_y + 115.0,
        primary,
    );

    show_text(
        &mut c,
        b"+12% vs periodo anterior",
        Name(b"F1"),
        7.0,
        callout_x + 15.0,
        destacado_y + 140.0,
        [0.2, 0.7, 0.3],
    );

    current_y -= destacado_h + 30.0;

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. TABELA DE DADOS (ESTILO NOTION/MODERNO)
    // ═══════════════════════════════════════════════════════════════════════════
    show_text(
        &mut c,
        b"DETALHAMENTO POR CATEGORIA",
        Name(b"F2"),
        13.0,
        content_start,
        current_y - 15.0,
        primary,
    );

    current_y -= 45.0;

    let tabela_cols = [
        ("CATEGORIA", 0.25),
        ("VALOR", 0.20),
        ("VAR", 0.15),
        ("SHARE", 0.20),
        ("TREND", 0.20),
    ];
    let tabela_h = 250.0;
    let tabela_y = current_y - tabela_h;

    // Cabeçalho da tabela
    c.set_fill_rgb(primary[0], primary[1], primary[2]);
    rounded_rect_path(&mut c, content_start, tabela_y, content_w, 30.0, 8.0);
    c.fill_nonzero();

    let mut x_offset = 0.0;
    for (col, width) in tabela_cols.iter() {
        show_text(
            &mut c,
            col.as_bytes(),
            Name(b"F2"),
            8.0,
            content_start + x_offset + 12.0,
            tabela_y + 18.0,
            [1.0, 1.0, 1.0],
        );
        x_offset += content_w * width;
    }

    // Dados da tabela
    let dados_tabela = [
        ("E-commerce", "R$ 458.200", "+23%", "38%", "▲"),
        ("Marketplace", "R$ 312.500", "+15%", "26%", "▲"),
        ("Loja Fisica", "R$ 178.300", "+8%", "15%", "→"),
        ("B2B", "R$ 156.800", "+32%", "13%", "▲"),
        ("International", "R$ 96.400", "-2%", "8%", "▼"),
    ];

    for (i, (cat, valor, var, share, trend)) in dados_tabela.iter().enumerate() {
        let row_y = tabela_y - 28.0 - i as f32 * 28.0;

        if i % 2 == 0 {
            c.set_fill_rgb(0.98, 0.98, 1.0);
            c.rect(content_start, row_y - 24.0, content_w, 28.0);
            c.fill_nonzero();
        }

        let mut x_offset = 0.0;
        show_text(
            &mut c,
            cat.as_bytes(),
            Name(b"F1"),
            8.5,
            content_start + x_offset + 12.0,
            row_y - 8.0,
            [0.25, 0.25, 0.35],
        );
        x_offset += content_w * 0.25;

        show_text(
            &mut c,
            valor.as_bytes(),
            Name(b"F1"),
            8.5,
            content_start + x_offset + 12.0,
            row_y - 8.0,
            [0.3, 0.3, 0.4],
        );
        x_offset += content_w * 0.20;

        let cor_var = if var.starts_with('+') {
            [0.2, 0.7, 0.3]
        } else {
            [0.9, 0.3, 0.2]
        };
        show_text(
            &mut c,
            var.as_bytes(),
            Name(b"F1"),
            8.5,
            content_start + x_offset + 12.0,
            row_y - 8.0,
            cor_var,
        );
        x_offset += content_w * 0.15;

        show_text(
            &mut c,
            share.as_bytes(),
            Name(b"F1"),
            8.5,
            content_start + x_offset + 12.0,
            row_y - 8.0,
            [0.3, 0.3, 0.4],
        );
        x_offset += content_w * 0.20;

        let cor_trend = if trend == &"▲" {
            [0.2, 0.7, 0.3]
        } else if trend == &"▼" {
            [0.9, 0.3, 0.2]
        } else {
            [0.6, 0.6, 0.6]
        };
        show_text(
            &mut c,
            trend.as_bytes(),
            Name(b"F2"),
            10.0,
            content_start + x_offset + 12.0,
            row_y - 8.0,
            cor_trend,
        );
    }

    current_y = tabela_y - (dados_tabela.len() as f32 * 28.0) - 50.0;

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. RODAPÉ ESTILIZADO
    // ═══════════════════════════════════════════════════════════════════════════
    let footer_y = 35.0;

    c.set_stroke_rgb(0.88, 0.88, 0.92);
    c.set_line_width(0.8);
    c.move_to(content_start, footer_y + 20.0);
    c.line_to(PAGE_W - MARGIN, footer_y + 20.0);
    c.stroke();

    show_text(
        &mut c,
        &to_win_ansi(empresa, 30),
        Name(b"F1"),
        7.0,
        content_start,
        footer_y + 5.0,
        [0.55, 0.55, 0.65],
    );

    show_text(
        &mut c,
        b"CONFIDENCIAL",
        Name(b"F1"),
        7.0,
        PAGE_W - 130.0,
        footer_y + 5.0,
        [0.55, 0.55, 0.65],
    );

    show_text(
        &mut c,
        b"Pagina 1 de 1",
        Name(b"F1"),
        7.0,
        PAGE_W - 80.0,
        footer_y + 5.0,
        [0.55, 0.55, 0.65],
    );

    // Círculo decorativo no rodapé
    draw_circle(
        &mut c,
        PAGE_W - 35.0,
        footer_y + 12.0,
        4.0,
        accent[0],
        accent[1],
        accent[2],
        true,
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // FINALIZA
    // ═══════════════════════════════════════════════════════════════════════════
    let content_bytes = c.finish();

    let mut page = pdf.page(page_id);
    page.parent(pages_id);
    page.media_box(Rect::new(0.0, 0.0, PAGE_W, PAGE_H));
    {
        let mut res = page.resources();
        let mut fonts = res.fonts();
        fonts.pair(Name(b"F1"), font_light_id);
        fonts.pair(Name(b"F2"), font_bold_id);
        fonts.pair(Name(b"F3"), font_black_id);
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

fn draw_small_circle(c: &mut Content, cx: f32, cy: f32, r: f32, cr: f32, cg: f32, cb: f32) {
    let k = KAPPA * r;
    c.set_fill_rgb(cr, cg, cb);
    c.move_to(cx + r, cy);
    c.cubic_to(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
    c.cubic_to(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
    c.cubic_to(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
    c.cubic_to(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
    c.close_path();
    c.fill_nonzero();
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
