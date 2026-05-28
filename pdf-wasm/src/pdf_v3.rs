// ═══════════════════════════════════════════════════════════════════════════════
// pdf_v3.rs  —  Motor de relatório V3: layout flexível com cards, fluid layout,
//                horizontal stack, stack layout, tabelas, gráficos e formatação
//                avançada de máscaras (CNPJ, CPF, CEP, telefone, data, moeda).
// ═══════════════════════════════════════════════════════════════════════════════

use std::collections::HashMap;

use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use pdf_writer::{Content, Filter, Finish, Name, Pdf, Rect, Ref};
use serde::Deserialize;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

use crate::charts::{
    draw_bar_chart, draw_bar_chart_with_colors, draw_heatmap_chart, draw_heatmap_details,
    draw_line_chart, draw_pie_chart, ChartData,
};
use crate::encoding::to_win_ansi as to_utf8_winansi;
use crate::{hex_to_rgb, show_text, PAGE_H, PAGE_W};

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

pub(crate) const V3_PAGE_W: f32 = PAGE_W;
pub(crate) const V3_PAGE_H: f32 = PAGE_H;
const FONT_SIZE: f32 = 10.0;
const DEFAULT_MARGIN: f32 = 40.0;
const PAGE_COUNT_PLACEHOLDER: &str = "9999";
const PAGE_NUMBER_PLACEHOLDER: &str = "8888";
const RESERVED_PAGE_COUNT_TOKEN: &str = "$pages";
const RESERVED_PAGE_NUMBER_TOKEN: &str = "$page";
const RESERVED_PAGE_COUNT_QUOTED: &str = "'$pages'";
const RESERVED_PAGE_NUMBER_QUOTED: &str = "'$page'";

// ═══════════════════════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReportV3 {
    pub page_configuration: PageConfigV3,
    pub header: Option<SectionV3>,
    pub footer: Option<SectionV3>,
    pub content: Vec<ComponentV3>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PageConfigV3 {
    pub background_color: Option<String>,
    pub margin: Option<EdgeValues>,
    pub orientation: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SectionV3 {
    pub repeat: Option<bool>,
    pub background_color: Option<String>,
    pub height: Option<f32>,
    pub min_height: Option<f32>,
    pub box_shadow: Option<BoxShadowDef>,
    pub gradient: Option<GradientDef>,
    pub border: Option<EdgeValues>,
    pub border_color: Option<String>,
    pub border_style: Option<String>,
    pub content: Vec<ComponentV3>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BoxShadowDef {
    pub color: Option<String>,
    pub offset_x: Option<f32>,
    pub offset_y: Option<f32>,
    pub blur: Option<f32>,
    pub spread: Option<f32>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GradientDef {
    pub start_color: String,
    pub end_color: String,
    pub direction: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ComponentV3 {
    Card(CardComponent),
    Text(TextComponent),
    FluidLayout(FluidLayoutComponent),
    HorizontalStack(HorizontalStackComponent),
    StackLayout(StackLayoutComponent),
    Table(TableComponent),
    Chart(ChartComponent),
    #[serde(alias = "image-box")]
    ImageBox(ImageBoxComponent),
    PriceList(PriceListComponent),
    #[serde(alias = "tableMultiData")]
    TableMultiData(TableMultiDataComponent),
}

#[derive(Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum V3Size {
    Pixels(f32),
    Percent(String),
    Auto(String),
}

#[derive(Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum EdgeValues {
    Number(f32),
    Array2([f32; 2]),
    Array4([f32; 4]),
    Object(EdgeValueObj),
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EdgeValueObj {
    pub all: Option<f32>,
    pub four: Option<[f32; 4]>,
}

impl EdgeValues {
    pub fn resolve(&self) -> (f32, f32, f32, f32) {
        match self {
            EdgeValues::Number(v) => (*v, *v, *v, *v),
            EdgeValues::Array2(a) => (a[0], a[1], a[0], a[1]),
            EdgeValues::Array4(a) => (a[0], a[1], a[2], a[3]),
            EdgeValues::Object(obj) => {
                if let Some(v) = obj.all {
                    (v, v, v, v)
                } else if let Some(a) = obj.four {
                    (a[0], a[1], a[2], a[3])
                } else {
                    (0.0, 0.0, 0.0, 0.0)
                }
            }
        }
    }
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CardComponent {
    #[serde(alias = "children")]
    pub content: Vec<ComponentV3>,
    pub height: Option<V3Size>,
    pub width: Option<V3Size>,
    pub margin: Option<EdgeValues>,
    pub padding: Option<EdgeValues>,
    pub corner_radius: Option<f32>,
    pub background_color: Option<String>,
    pub border_color: Option<String>,
    pub icon: Option<String>,
    pub icon_color: Option<String>,
    pub flex: Option<f32>,
    pub pre_style: Option<String>,
    pub top_accent_height: Option<V3Size>,
    pub top_accent_width: Option<V3Size>,
    pub top_accent_radius: Option<V3Size>,
    pub left_accent_width: Option<V3Size>,
    pub left_accent_height: Option<V3Size>,
    pub left_accent_radius: Option<V3Size>,
    pub accent_border_color: Option<String>,
    pub accent_border_width: Option<f32>,
    pub show_top_accent: Option<bool>,
    pub show_left_accent: Option<bool>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TextComponent {
    pub value: String,
    #[serde(alias = "font", alias = "fontSize")]
    pub font_size: Option<f32>,
    pub line_height: Option<f32>,
    pub align: Option<String>,
    pub bold: Option<bool>,
    pub color: Option<String>,
    pub margin: Option<EdgeValues>,
    #[serde(alias = "marginBottom")]
    pub margin_bottom: Option<f32>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FluidLayoutComponent {
    pub sizes: Vec<V3Size>,
    #[serde(alias = "children")]
    pub content: Vec<ComponentV3>,
    pub gap: Option<f32>,
    pub margin: Option<EdgeValues>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HorizontalStackComponent {
    #[serde(alias = "children", alias = "stacks")]
    pub content: Vec<ComponentV3>,
    pub gap: Option<f32>,
    pub margin: Option<EdgeValues>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StackLayoutComponent {
    #[serde(alias = "children")]
    pub content: Vec<ComponentV3>,
    pub gap: Option<f32>,
    pub margin: Option<EdgeValues>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableFieldMapping {
    pub key: String,
    pub source_key: String,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableRowExpansion {
    pub path: String,
    pub description_key: Option<String>,
    pub description_template: Option<String>,
    pub field_mappings: Option<Vec<TableFieldMapping>>,
    pub table_header: Option<Vec<TableHeaderDef>>,
    pub widths: Option<Vec<TableWidth>>,
    pub subtotal: Option<bool>,
    pub indent: Option<f32>,
    pub gap: Option<f32>,
    pub gap_top: Option<f32>,
    pub pre_header: Option<PreHeaderDef>,
    pub header_background_color: Option<String>,
    pub header_text_color: Option<String>,
    pub border_color: Option<String>,
    pub border_width: Option<f32>,
    pub border_style: Option<String>,
    pub text_color: Option<String>,
    pub zebra_text_color: Option<String>,
    pub zebra_background_color: Option<String>,
    pub children: Option<Vec<TableRowExpansion>>,
    /// SummaryBox exibido após os itens desta seção
    pub summary_box: Option<SummaryBoxDef>,
    /// Campos que identificam unicidade do agregado dos itens
    pub aggregate: Option<Vec<String>>,
    /// Campos numéricos somados no agregado dos itens
    pub aggregate_sum: Option<Vec<String>>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SummaryBoxRow {
    pub label: String,
    pub key: Option<String>,
    pub value: Option<String>,
    pub mask: Option<String>,
    pub bold: Option<bool>,
    pub divider_before: Option<bool>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SummaryBoxDef {
    pub rows: Vec<SummaryBoxRow>,
    pub width: Option<f32>,
    pub align: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableComponent {
    pub dataset_name: String,
    pub table_header: Vec<TableHeaderDef>,
    pub widths: Vec<TableWidth>,
    pub grouping: Option<GroupingConfig>,
    pub grand_total: Option<bool>,
    pub summary_box: Option<SummaryBoxDef>,
    pub margin: Option<EdgeValues>,
    pub pre_header: Option<PreHeaderDef>,
    #[serde(alias = "items")]
    pub row_expansion: Option<TableRowExpansion>,
    pub header_background_color: Option<String>,
    pub header_text_color: Option<String>,
    pub border_color: Option<String>,
    pub border_width: Option<f32>,
    pub border_style: Option<String>,
    pub text_color: Option<String>,
    pub zebra_text_color: Option<String>,
    pub zebra_background_color: Option<String>,
    /// Campos que identificam unicidade do agregado das linhas da tabela
    pub aggregate: Option<Vec<String>>,
    /// Campos numéricos somados no agregado das linhas da tabela
    pub aggregate_sum: Option<Vec<String>>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableHeaderDef {
    pub key: String,
    pub prefix: Option<String>,
    pub mask: Option<String>,
    pub align: Option<String>,
    #[serde(default)]
    pub sum: bool,
    #[serde(default)]
    pub pill: bool,
    pub pill_cases: Option<Vec<PillCase>>,
    pub pill_width: Option<f32>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PillCase {
    pub case: String,
    pub color: String,
    pub transform: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum TableWidth {
    Pixels(f32),
    Auto(String),
    Expand(String),
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GroupingConfig {
    pub group_by: String,
    pub group_header: Option<String>,
    pub group_header_mask: Option<String>,
    pub prefix: Option<String>,
    pub subtotal: Option<bool>,
    pub gap: Option<f32>,
    pub group_header_background_color: Option<String>,
    pub group_header_text_color: Option<String>,
    pub group_header_border_color: Option<String>,
    pub group_header_border_width: Option<f32>,
    pub group_header_border_style: Option<String>,
    /// Campos que identificam unicidade do agregado (ex: ["fornecedor"])
    pub aggregate: Option<Vec<String>>,
    /// Campos numéricos somados no agregado (ex: ["vlr", "taxa"])
    pub aggregate_sum: Option<Vec<String>>,
    /// SummaryBox exibido após cada grupo
    pub summary_box: Option<SummaryBoxDef>,
    /// Campo para sub-agrupamento dentro de cada grupo
    pub sub_group_by: Option<String>,
    /// Prefixo exibido no cabeçalho do sub-grupo (ex: "Funcionário: ")
    pub sub_group_prefix: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PreHeaderDef {
    pub variable: String,
    #[serde(alias = "font", alias = "fontSize")]
    pub font_size: Option<f32>,
    pub align: Option<String>,
    pub color: Option<String>,
    pub background_color: Option<String>,
    pub mask: Option<String>,
    pub margin: Option<EdgeValues>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChartHeader {
    pub value: String,
    #[serde(alias = "fontSize")]
    pub font_size: Option<f32>,
    pub color: Option<String>,
    pub background_color: Option<String>,
    pub height: Option<f32>,
    pub align: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChartComponent {
    pub chart_model: String,
    #[serde(alias = "dataset")]
    pub dataset_name: Option<String>,
    pub top_count: Option<usize>,
    pub header: Option<ChartHeader>,
    #[serde(alias = "keySum")]
    pub key_sum: Option<String>,
    #[serde(alias = "keyPresent")]
    pub key_present: Option<String>,
    #[serde(alias = "keyGroup")]
    pub key_group: Option<String>,
    #[serde(alias = "labelKey")]
    pub label_key: Option<String>,
    #[serde(alias = "valueKey")]
    pub value_key: Option<String>,
    pub width: Option<V3Size>,
    pub align: Option<String>,
    pub colors: Option<Vec<String>>,
    pub color_from: Option<String>,
    pub color_to: Option<String>,
    pub title: Option<String>,
    pub labels: Option<Vec<String>>,
    pub values: Option<Vec<f64>>,
    pub value_suffix: Option<String>,
    pub label_font_size: Option<f32>,
    pub label_color: Option<String>,
    pub grid_color: Option<String>,
    pub label_max_chars: Option<usize>,
    pub margin: Option<EdgeValues>,
    pub show_details: Option<bool>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImageBoxComponent {
    /// Nome da variável que contém o base64 da imagem (ex: "logoBase64")
    pub variable: String,
    /// Largura de renderização em pontos PDF
    pub width: Option<f32>,
    /// Altura de renderização em pontos PDF. Se omitida, mantém proporção.
    pub height: Option<f32>,
    /// Alinhamento horizontal: "left" | "center" | "right"
    pub align: Option<String>,
    pub margin: Option<EdgeValues>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PriceListComponent {
    pub dataset_name: String,
    pub name_key: String,
    pub price_key: String,
    pub group_key: Option<String>,
    pub item_font_size: Option<f32>,
    pub group_header_font_size: Option<f32>,
    pub group_header_color: Option<String>,
    pub group_header_text_color: Option<String>,
    pub item_color: Option<String>,
    pub price_color: Option<String>,
    pub dot_color: Option<String>,
    pub margin: Option<EdgeValues>,
}

// ─── TableMultiData ─────────────────────────────────────────────────────────

/// Um campo individual dentro de um bloco de registro tableMultiData.
#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableMultiDataField {
    pub key: String,
    pub prefix: Option<String>,
    pub mask: Option<String>,
    pub align: Option<String>,
    pub bold: Option<bool>,
    /// Quantas colunas este campo ocupa (colspan). Padrão: 1
    pub span: Option<u32>,
}

/// Tabela multi-linha por registro: cada item do dataset é exibido como um
/// bloco com barra de título + grade de N colunas com label + valor.
#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableMultiDataComponent {
    pub dataset_name: String,
    pub fields: Vec<TableMultiDataField>,
    /// Agrupamento dos registros (igual ao table normal)
    pub grouping: Option<GroupingConfig>,
    /// Cor de fundo do cabeçalho de grupo. Padrão: #404040
    pub group_header_background_color: Option<String>,
    /// Cor do texto do cabeçalho de grupo. Padrão: #ffffff
    pub group_header_text_color: Option<String>,
    /// Número de colunas por linha dentro do bloco. Padrão: 4
    pub columns: Option<u32>,
    /// Campo do dataset usado como título do bloco
    pub title_field: Option<String>,
    /// Prefixo antes do valor do título
    pub title_prefix: Option<String>,
    /// Cor de fundo da barra de título. Padrão: #20435C
    pub title_background_color: Option<String>,
    /// Cor do texto do título. Padrão: #ffffff
    pub title_text_color: Option<String>,
    /// Cor de fundo da linha de labels. Padrão: #EEF1F6
    pub label_background_color: Option<String>,
    /// Cor dos textos de label. Padrão: #555e74
    pub label_color: Option<String>,
    /// Cor dos textos de valor. Padrão: #1e222b
    pub value_color: Option<String>,
    /// Cor das bordas da grade. Padrão: #c8cdd8
    pub border_color: Option<String>,
    /// Espessura da borda. Padrão: 0.4
    pub border_width: Option<f32>,
    /// Espaço entre blocos. Padrão: 8
    pub gap: Option<f32>,
    /// Cor de fundo zebra (registros pares). Padrão: #f9fafc
    pub zebra_background_color: Option<String>,
    pub margin: Option<EdgeValues>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT STRUCTS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Clone)]
pub struct V3DataContext {
    pub datasets: HashMap<String, Vec<HashMap<String, serde_json::Value>>>,
    pub variables: HashMap<String, String>,
}

#[derive(Clone, Copy)]
pub(crate) struct V3RenderContext {
    pub pw: f32,
    pub ph: f32,
    pub margin: f32,
    pub content_w: f32,
    pub bottom_reserved: f32,
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE SUPPORT
// ═══════════════════════════════════════════════════════════════════════════════

/// Metadados de um XObject de imagem já adicionado ao PDF.
pub(crate) struct ImageInfo {
    pub ref_id: Ref,
    /// Nome usado no stream de conteúdo, ex: b"Im0"
    pub xobj_name: Vec<u8>,
    /// Largura natural em pixels
    pub nat_w: u32,
    /// Altura natural em pixels
    pub nat_h: u32,
    /// true = JPEG (DCTDecode), false = raw RGB (sem filtro)
    pub is_jpeg: bool,
    /// Número de componentes de cor: 1=gray, 3=RGB/YCbCr, 4=CMYK
    pub num_components: u32,
    /// Quando Some, a imagem falhou. O PDF não a embute e renderiza esse texto no lugar.
    pub error: Option<String>,
}

/// Detecta dimensões e número de componentes de JPEG parseando marcadores SOF.
/// Retorna (width, height, num_components). num_components: 1=gray, 3=RGB/YCbCr, 4=CMYK
fn jpeg_info(data: &[u8]) -> Option<(u32, u32, u32)> {
    let mut i = 0;
    while i + 1 < data.len() {
        if data[i] != 0xFF {
            break;
        }
        let marker = data[i + 1];
        i += 2;
        // SOF0–SOF3, SOF5–SOF7, SOF9–SOF11, SOF13–SOF15
        let is_sof = matches!(marker,
            0xC0..=0xC3 | 0xC5..=0xC7 | 0xC9..=0xCB | 0xCD..=0xCF
        );
        // SOF segment layout (after marker+length bytes):
        //   [0..2] = segment length (big-endian, includes these 2 bytes)
        //   [2]    = precision (bits per sample)
        //   [3..5] = height
        //   [5..7] = width
        //   [7]    = num_components
        if is_sof && i + 8 <= data.len() {
            let h = u16::from_be_bytes([data[i + 3], data[i + 4]]) as u32;
            let w = u16::from_be_bytes([data[i + 5], data[i + 6]]) as u32;
            let nc = data[i + 7] as u32;
            return Some((w, h, nc));
        }
        // Marcadores sem comprimento: SOI, EOI, RST*
        if matches!(marker, 0xD8 | 0xD9 | 0xD0..=0xD7) {
            continue;
        }
        if i + 2 > data.len() {
            break;
        }
        let seg_len = u16::from_be_bytes([data[i], data[i + 1]]) as usize;
        if seg_len < 2 {
            break;
        }
        i += seg_len;
    }
    None
}

/// Detecta dimensões de PNG lendo o chunk IHDR.
fn png_dims(data: &[u8]) -> Option<(u32, u32)> {
    if data.len() < 24 {
        return None;
    }
    if &data[0..8] != b"\x89PNG\r\n\x1a\n" {
        return None;
    }
    if &data[12..16] != b"IHDR" {
        return None;
    }
    let w = u32::from_be_bytes([data[16], data[17], data[18], data[19]]);
    let h = u32::from_be_bytes([data[20], data[21], data[22], data[23]]);
    Some((w, h))
}

/// Coleta todos os nomes de variáveis usados por ImageBox no report.
fn collect_image_vars(comps: &[ComponentV3], out: &mut Vec<String>) {
    for comp in comps {
        match comp {
            ComponentV3::ImageBox(img) => {
                if !out.contains(&img.variable) {
                    out.push(img.variable.clone());
                }
            }
            ComponentV3::Card(c) => collect_image_vars(&c.content, out),
            ComponentV3::StackLayout(s) => collect_image_vars(&s.content, out),
            ComponentV3::HorizontalStack(h) => collect_image_vars(&h.content, out),
            ComponentV3::FluidLayout(f) => collect_image_vars(&f.content, out),
            _ => {}
        }
    }
}

/// Largura aproximada de caractere em Helvetica (em unidades de 1 em = font_size).
fn hv_char_w(ch: char) -> f32 {
    match ch {
        ' ' => 0.278,
        '.' | ',' | ':' | ';' | '!' => 0.278,
        '-' => 0.333,
        '\'' | '(' | ')' => 0.333,
        '0'..='9' => 0.556,
        '$' | '%' | '&' => 0.556,
        '+' | '=' => 0.584,
        // uppercase
        'A' | 'V' => 0.667,
        'B' | 'E' | 'K' | 'P' | 'R' | 'S' | 'X' | 'Y' => 0.667,
        'C' | 'D' | 'G' | 'H' | 'N' | 'O' | 'Q' | 'U' => 0.722,
        'F' | 'I' | 'J' | 'L' | 'T' | 'Z' => 0.611,
        'M' | 'W' => 0.833,
        // lowercase
        'f' | 'i' | 'j' | 'l' | 't' | 'r' => 0.278,
        'c' | 's' | 'z' => 0.500,
        'm' => 0.833,
        'w' => 0.722,
        _ => 0.556,
    }
}

fn hv_text_w(s: &str, fs: f32) -> f32 {
    s.chars().map(|c| hv_char_w(c) * fs).sum()
}

fn format_price_brl(value: f64) -> String {
    let whole = value.abs().floor() as i64;
    let frac = ((value.abs() - whole as f64) * 100.0).round() as i64;
    let whole_str = format!("{}", whole);
    let chars: Vec<char> = whole_str.chars().rev().collect();
    let mut fi = String::new();
    for (i, c) in chars.iter().enumerate() {
        if i > 0 && i % 3 == 0 {
            fi.push('.');
        }
        fi.push(*c);
    }
    let formatted: String = fi.chars().rev().collect();
    let sign = if value < 0.0 { "-" } else { "" };
    format!("R$ {}{},{:02}", sign, formatted, frac)
}

fn render_price_list(
    c: &mut Content,
    pl: &PriceListComponent,
    ctx: &mut V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
    page_break: &mut dyn FnMut(&mut Content, &mut f32),
) {
    let raw_rows = match dctx.datasets.get(&pl.dataset_name) {
        Some(d) => d,
        None => return,
    };

    let m = pl
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((0.0, 0.0, 0.0, 0.0));

    let item_fs = pl.item_font_size.unwrap_or(12.0);
    let item_lh = item_fs * 1.45;
    let group_fs = pl.group_header_font_size.unwrap_or(14.0);
    let group_lh = group_fs * 1.8;

    let gh_bg = pl
        .group_header_color
        .as_ref()
        .map(|c| hex_to_rgb(c))
        .unwrap_or([0.125, 0.263, 0.361]); // #20435C
    let gh_text = pl
        .group_header_text_color
        .as_ref()
        .map(|c| hex_to_rgb(c))
        .unwrap_or([1.0, 1.0, 1.0]);
    let item_col = pl
        .item_color
        .as_ref()
        .map(|c| hex_to_rgb(c))
        .unwrap_or([0.0, 0.0, 0.0]);
    let price_col = pl
        .price_color
        .as_ref()
        .map(|c| hex_to_rgb(c))
        .unwrap_or([0.0, 0.0, 0.0]);
    let dot_col = pl
        .dot_color
        .as_ref()
        .map(|c| hex_to_rgb(c))
        .unwrap_or([0.5, 0.5, 0.5]);

    *curs -= m.0;
    let tx = ctx.margin + m.3;
    let iw = ctx.content_w - m.1 - m.3;

    // Group products preserving insertion order
    let group_key = pl.group_key.as_deref().unwrap_or("");
    let mut groups: Vec<(String, Vec<&HashMap<String, serde_json::Value>>)> = Vec::new();
    for row in raw_rows.iter() {
        let gname = if group_key.is_empty() {
            String::from("Produtos")
        } else {
            match row.get(group_key) {
                Some(serde_json::Value::String(s)) => s.clone(),
                Some(v) => v.to_string(),
                None => String::from("Produtos"),
            }
        };
        if let Some(entry) = groups.iter_mut().find(|(k, _)| k == &gname) {
            entry.1.push(row);
        } else {
            groups.push((gname, vec![row]));
        }
    }

    for (group_name, products) in &groups {
        // Page-break check before group header
        if *curs - group_lh - (products.len() as f32 * item_lh).min(item_lh * 3.0)
            < ctx.bottom_reserved + 30.0
        {
            page_break(c, curs);
        }

        // Group header background
        *curs -= 6.0; // top gap
        let gh = group_lh;
        *curs -= gh;
        c.set_fill_rgb(gh_bg[0], gh_bg[1], gh_bg[2]);
        c.rect(tx, *curs, iw, gh);
        c.fill_nonzero();

        // Group header text (centered)
        let enc = to_utf8_winansi(group_name, group_name.len());
        let gtext_w = hv_text_w(group_name, group_fs);
        let gtext_x = tx + (iw - gtext_w) / 2.0;
        let gtext_y = *curs + gh / 2.0 - group_fs / 3.0;
        show_text(c, &enc, fb, group_fs, gtext_x, gtext_y, gh_text);

        *curs -= 5.0; // gap below header

        for row in products.iter() {
            // Page break check
            if *curs - item_lh < ctx.bottom_reserved + 10.0 {
                page_break(c, curs);
            }

            // Get name
            let name = match row.get(&pl.name_key) {
                Some(serde_json::Value::String(s)) => s.clone(),
                Some(v) => v.to_string(),
                None => String::from("—"),
            };

            // Get price
            let price_val = match row.get(&pl.price_key) {
                Some(serde_json::Value::Number(n)) => n.as_f64().unwrap_or(0.0),
                Some(serde_json::Value::String(s)) => s.parse::<f64>().unwrap_or(0.0),
                _ => 0.0,
            };
            let price_str = format_price_brl(price_val);

            // Measure widths
            let name_w = hv_text_w(&name, item_fs);
            let price_w = hv_text_w(&price_str, item_fs);

            // Text Y position (baseline)
            let text_y = *curs - item_fs;

            // Render name (left)
            let name_enc = to_utf8_winansi(&name, name.len());
            show_text(c, &name_enc, fr, item_fs, tx, text_y, item_col);

            // Render price (right-aligned)
            let price_x = tx + iw - price_w;
            let price_enc = to_utf8_winansi(&price_str, price_str.len());
            show_text(c, &price_enc, fr, item_fs, price_x, text_y, price_col);

            // Draw dashed leader line between name and price
            let line_pad = 6.0;
            let line_x1 = tx + name_w + line_pad;
            let line_x2 = tx + iw - price_w - line_pad;
            if line_x2 > line_x1 + 5.0 {
                let line_y = text_y + item_fs * 0.1;
                c.set_line_width(1.5);
                c.set_stroke_rgb(dot_col[0], dot_col[1], dot_col[2]);
                c.set_dash_pattern(vec![6.0, 4.0], 0.0);
                c.move_to(line_x1, line_y);
                c.line_to(line_x2, line_y);
                c.stroke();
                c.set_dash_pattern(vec![], 0.0);
            }

            *curs -= item_lh;
        }

        *curs -= 8.0; // gap after group
    }

    *curs -= m.2;
}

/// Renderiza um ImageBox usando o XObject já criado.
/// Se a imagem tiver erro registrado, renderiza o texto do erro no lugar.
fn render_image_box(
    c: &mut Content,
    img: &ImageBoxComponent,
    ctx: &V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    image_map: &HashMap<String, ImageInfo>,
    fr: Name<'_>,
) {
    let m = img
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((4.0, 0.0, 4.0, 0.0));

    let info = image_map.get(&img.variable);

    // Se há erro registrado, renderiza texto vermelho no lugar da imagem
    if let Some(err_msg) = info.and_then(|i| i.error.as_deref()) {
        let fs = 9.0_f32;
        let line_h = fs * 1.4;
        let tx = ctx.margin + m.3;
        let max_w = ctx.content_w - m.1 - m.3;
        let label = format!("[Imagem indisponível: {}]", err_msg);
        // Quebra em linhas de ~80 chars
        let chars_per_line = (max_w / (fs * 0.55)).floor() as usize;
        let chars_per_line = chars_per_line.max(20);
        let mut lines: Vec<String> = Vec::new();
        let mut remaining = label.as_str();
        while !remaining.is_empty() {
            if remaining.len() <= chars_per_line {
                lines.push(remaining.to_string());
                break;
            }
            let split = remaining[..chars_per_line].rfind(' ').unwrap_or(chars_per_line);
            lines.push(remaining[..split].to_string());
            remaining = remaining[split..].trim_start();
        }
        *curs -= m.0;
        for line in &lines {
            let enc = crate::encoding::to_win_ansi(line, 256);
            show_text(c, &enc, fr, fs, tx, *curs - fs, [0.8, 0.15, 0.15]);
            *curs -= line_h;
        }
        *curs -= m.2;
        return;
    }

    let info = match info {
        Some(i) if i.nat_w > 0 && i.nat_h > 0 && i.error.is_none() => i,
        _ => return,
    };

    *curs -= m.0;

    let max_w = ctx.content_w - m.1 - m.3;
    let aspect = info.nat_h as f32 / info.nat_w as f32;

    let render_w = img.width.unwrap_or(max_w).min(max_w);
    let render_h = img.height.unwrap_or(render_w * aspect);

    let tx = ctx.margin + m.3;
    let render_x = match img.align.as_deref().unwrap_or("left") {
        "center" => tx + (max_w - render_w) / 2.0,
        "right" => tx + max_w - render_w,
        _ => tx,
    };
    let render_y = *curs - render_h;

    // Emite: save_state, transform, Do, restore_state
    let name = Name(info.xobj_name.as_slice());
    c.save_state();
    c.transform([render_w, 0.0, 0.0, render_h, render_x, render_y]);
    c.x_object(name);
    c.restore_state();

    *curs -= render_h + m.2;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MASK FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

fn apply_mask(raw: &str, mask: &str) -> String {
    let mut r = String::with_capacity(mask.len());
    let mut rc = raw.chars();
    for m in mask.chars() {
        if m == '#' {
            match rc.next() {
                Some(c) => r.push(c),
                None => break,
            }
        } else {
            r.push(m);
        }
    }
    r
}

// formatadores

pub(crate) fn format_mask(value: &serde_json::Value, mask: Option<&str>) -> String {
    let s = match value {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Number(n) => n.to_string(),
        _ => return String::new(),
    };
    match mask {
        Some("number") => fmt_number(&s),
        Some(m) if m.starts_with("number-") => {
            let decimals = m[7..].parse::<usize>().unwrap_or(2);
            fmt_number_with_precision(&s, decimals)
        }
        Some("currency") => format!("R$ {}", fmt_number(&s)),
        Some(m) if m.starts_with("currency-") => {
            let decimals = m[9..].parse::<usize>().unwrap_or(2);
            format!("R$ {}", fmt_number_with_precision(&s, decimals))
        }
        Some("percentage") => {
            let v: f64 = s.parse().unwrap_or(0.0);
            format!("{:.2}%", (v * 100.0)).replace('.', ",")
        }
        Some("cnpj") => apply_mask(&clean_d(&s), "##.###.###/####-##"),
        Some("cpf") => apply_mask(&clean_d(&s), "###.###.###-##"),
        Some("cnpjCpf") => {
            let d = clean_d(&s);
            if d.len() <= 11 {
                apply_mask(&d, "###.###.###-##")
            } else {
                apply_mask(&d, "##.###.###/####-##")
            }
        }
        Some("cep") => apply_mask(&clean_d(&s), "#####-###"),
        Some("phone") => {
            let d = clean_d(&s);
            if d.len() > 10 {
                apply_mask(&d, "(##) #####-####")
            } else {
                apply_mask(&d, "(##) ####-####")
            }
        }
        Some("date") => {
            // suporta "2026-04-04" e "2026-04-04T12:31:00.000Z"
            let date_part = s.split('T').next().unwrap_or(&s);
            let p: Vec<&str> = date_part.split('-').collect();
            if p.len() == 3 && !p.iter().any(|seg| seg.is_empty()) {
                format!("{}/{}/{}", p[2], p[1], p[0])
            } else {
                String::new()
            }
        }
        Some("date-time") => {
            let parts: Vec<&str> = s.splitn(2, 'T').collect();
            if parts.len() == 2 {
                let d = {
                    let q: Vec<&str> = parts[0].split('-').collect();
                    if q.len() == 3 && !q.iter().any(|seg| seg.is_empty()) {
                        format!("{}/{}/{}", q[2], q[1], q[0])
                    } else {
                        return String::new();
                    }
                };
                // "12:31:00.000Z" → "12:31"
                let time_raw = parts[1].trim_end_matches('Z');
                let time_no_ms = if let Some(dot) = time_raw.find('.') {
                    &time_raw[..dot]
                } else {
                    time_raw
                };
                // pega só HH:MM (primeiros 5 chars)
                let time_clean = if time_no_ms.len() >= 5 {
                    &time_no_ms[..5]
                } else {
                    time_no_ms
                };
                format!("{} {}", d, time_clean)
            } else {
                String::new()
            }
        }
        Some(m) if m.contains('#') => apply_mask(&s, m),
        _ => s,
    }
}

fn is_numeric_mask(mask: &str) -> bool {
    matches!(mask, "number" | "currency" | "percentage") || mask.starts_with("number-") || mask.starts_with("currency-")
}

fn parse_number_from_string(raw: &str) -> Option<f64> {
    let cleaned: String = raw
        .chars()
        .filter(|c| c.is_ascii_digit() || *c == '.' || *c == ',' || *c == '-')
        .collect();
    if cleaned.is_empty() {
        return None;
    }
    if cleaned.contains('.') && cleaned.contains(',') {
        let normalized = cleaned.replace('.', "").replace(',', ".");
        normalized.parse::<f64>().ok()
    } else if cleaned.contains(',') {
        let normalized = cleaned.replace(',', ".");
        normalized.parse::<f64>().ok()
    } else {
        cleaned.parse::<f64>().ok()
    }
}

fn format_value_with_mask(value: &str, mask: Option<&str>) -> String {
    match mask {
        Some(mask) if is_numeric_mask(mask) => {
            if let Some(num) = parse_number_from_string(value) {
                format_numeric_value(num, Some(mask))
            } else {
                format_mask(&serde_json::Value::String(value.to_string()), Some(mask))
            }
        }
        Some(mask) => format_mask(&serde_json::Value::String(value.to_string()), Some(mask)),
        None => value.to_string(),
    }
}

fn fmt_number(raw: &str) -> String {
    if let Some(dot) = raw.rfind('.') {
        let int_p = &raw[..dot];
        let dec_p = &raw[dot + 1..];
        let neg = int_p.starts_with('-');
        let t = int_p.trim_start_matches('-');
        let chars: Vec<char> = t.chars().rev().collect();
        let mut fi = String::new();
        for (i, c) in chars.iter().enumerate() {
            if i > 0 && i % 3 == 0 {
                fi.push('.');
            }
            fi.push(*c);
        }
        let fi: String = fi.chars().rev().collect();
        if neg {
            format!("-{},{}", fi, dec_p)
        } else {
            format!("{},{}", fi, dec_p)
        }
    } else {
        let neg = raw.starts_with('-');
        let t = raw.trim_start_matches('-');
        let chars: Vec<char> = t.chars().rev().collect();
        let mut fi = String::new();
        for (i, c) in chars.iter().enumerate() {
            if i > 0 && i % 3 == 0 {
                fi.push('.');
            }
            fi.push(*c);
        }
        let fi: String = fi.chars().rev().collect();
        if neg {
            format!("-{},00", fi)
        } else {
            format!("{},00", fi)
        }
    }
}

fn fmt_number_with_precision(raw: &str, decimals: usize) -> String {
    let value: f64 = raw.parse().unwrap_or(0.0);
    fmt_number(&format!("{:.*}", decimals, value))
}

fn fmt_number_from_f64(value: f64, decimals: Option<usize>) -> String {
    if let Some(dec) = decimals {
        fmt_number(&format!("{:.*}", dec, value))
    } else {
        let mut raw = format!("{:.6}", value);
        while raw.contains('.') && raw.ends_with('0') {
            raw.pop();
        }
        if raw.ends_with('.') {
            raw.pop();
        }
        if raw.is_empty() {
            raw = "0".to_string();
        }
        fmt_number(&raw)
    }
}

fn format_numeric_value(value: f64, mask: Option<&str>) -> String {
    match mask {
        Some(m) if m.starts_with("currency-") => {
            let decimals = m[9..].parse::<usize>().unwrap_or(2);
            format!("R$ {}", fmt_number_from_f64(value, Some(decimals)))
        }
        Some("currency") => format!("R$ {}", fmt_number_from_f64(value, Some(2))),
        Some(m) if m.starts_with("number-") => {
            let decimals = m[7..].parse::<usize>().unwrap_or(2);
            fmt_number_from_f64(value, Some(decimals))
        }
        Some("number") => fmt_number_from_f64(value, None),
        Some("percentage") => format!("{:.2}%", value * 100.0).replace('.', ","),
        _ => fmt_number_from_f64(value, Some(2)),
    }
}

fn clean_d(raw: &str) -> String {
    raw.chars().filter(|c| c.is_ascii_digit()).collect()
}

fn interpolate(text: &str, vars: &HashMap<String, String>) -> String {
    let mut r = text.to_string();
    for (k, v) in vars {
        r = r.replace(&format!("{{{}}}", k), v);
    }
    for (k, v) in vars {
        r = r.replace(&format!("'${}'", k), v);
        r = r.replace(&format!("'{{{}}}'", k), v);
    }
    for (k, v) in vars {
        r = r.replace(&format!("${}", k), v);
    }
    if r.contains(RESERVED_PAGE_COUNT_QUOTED) {
        r = r.replace(RESERVED_PAGE_COUNT_QUOTED, PAGE_COUNT_PLACEHOLDER);
    }
    if r.contains(RESERVED_PAGE_NUMBER_QUOTED) {
        r = r.replace(RESERVED_PAGE_NUMBER_QUOTED, PAGE_NUMBER_PLACEHOLDER);
    }
    r
}

fn replace_bytes(buffer: &[u8], from: &[u8], to: &[u8]) -> Vec<u8> {
    if from.is_empty() {
        return buffer.to_vec();
    }
    let mut result = Vec::with_capacity(buffer.len());
    let mut i = 0;
    while i + from.len() <= buffer.len() {
        if &buffer[i..i + from.len()] == from {
            result.extend_from_slice(to);
            i += from.len();
        } else {
            result.push(buffer[i]);
            i += 1;
        }
    }
    result.extend_from_slice(&buffer[i..]);
    result
}

fn bytes_to_hex(bytes: &[u8]) -> Vec<u8> {
    const HEX_DIGITS: &[u8; 16] = b"0123456789ABCDEF";
    let mut hex = Vec::with_capacity(bytes.len() * 2);
    for &byte in bytes {
        hex.push(HEX_DIGITS[(byte >> 4) as usize]);
        hex.push(HEX_DIGITS[(byte & 0x0F) as usize]);
    }
    hex
}

fn replace_page_placeholders(contents: &mut Vec<Vec<u8>>, page_count: usize) {
    let page_placeholder = PAGE_NUMBER_PLACEHOLDER.as_bytes();
    let count_placeholder = PAGE_COUNT_PLACEHOLDER.as_bytes();
    let page_hex = bytes_to_hex(page_placeholder);
    let count_hex = bytes_to_hex(count_placeholder);
    let total_pages = page_count.to_string().into_bytes();
    let total_pages_hex = bytes_to_hex(&total_pages);

    for (idx, content) in contents.iter_mut().enumerate() {
        let page_number = (idx + 1).to_string().into_bytes();
        let page_number_hex = bytes_to_hex(&page_number);

        if content
            .windows(page_placeholder.len())
            .any(|window| window == page_placeholder)
        {
            *content = replace_bytes(content, page_placeholder, &page_number);
        }
        if content
            .windows(count_placeholder.len())
            .any(|window| window == count_placeholder)
        {
            *content = replace_bytes(content, count_placeholder, &total_pages);
        }
        if content
            .windows(page_hex.len())
            .any(|window| window == page_hex)
        {
            *content = replace_bytes(content, &page_hex, &page_number_hex);
        }
        if content
            .windows(count_hex.len())
            .any(|window| window == count_hex)
        {
            *content = replace_bytes(content, &count_hex, &total_pages_hex);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDERING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

fn resolve_size(size: &Option<V3Size>, parent: f32) -> f32 {
    match size {
        Some(V3Size::Pixels(v)) => v.max(0.0),
        Some(V3Size::Percent(p)) => {
            let pct = p.trim_end_matches('%').parse::<f32>().unwrap_or(100.0);
            parent * pct / 100.0
        }
        _ => parent,
    }
}

fn resolve_fluid(sizes: &[V3Size], total: f32, gap: f32) -> Vec<f32> {
    let count = sizes.len().max(1);
    let avail = (total - gap * (count - 1) as f32).max(0.0);
    let mut r = vec![0.0; count];
    let mut fixed = 0usize;
    let mut flex = 0usize;
    for s in sizes {
        match s {
            V3Size::Pixels(v) => {
                r[fixed] = v.max(0.0);
                fixed += 1;
            }
            V3Size::Percent(p) => {
                let pct = p.trim_end_matches('%').parse::<f32>().unwrap_or(0.0);
                r[fixed] = avail * pct / 100.0;
                fixed += 1;
            }
            _ => flex += 1,
        }
    }
    let used: f32 = r.iter().sum();
    let rem = (avail - used).max(0.0);
    if flex > 0 {
        let share = rem / flex as f32;
        for v in r.iter_mut().skip(fixed) {
            *v = share;
        }
    } else if rem > 0.0 && !r.is_empty() {
        let last = r.len() - 1;
        r[last] += rem;
    }
    r
}

fn resolve_twidths(widths: &[TableWidth], total: f32, count: usize) -> Vec<f32> {
    let mut r = vec![0.0; count];
    let mut ft = 0.0;
    let mut an = 0;
    for (i, w) in widths.iter().enumerate().take(count) {
        match w {
            TableWidth::Pixels(v) => {
                r[i] = v.max(0.0);
                ft += v.max(0.0);
            }
            _ => an += 1,
        }
    }
    let rem = (total - ft).max(0.0);
    if an > 0 {
        let s = rem / an as f32;
        for v in r.iter_mut() {
            if *v == 0.0 {
                *v = s;
            }
        }
    } else if rem > 0.0 && !r.is_empty() {
        // All columns have fixed width, but there is still remaining space.
        // Extend the last column so the table fills the available width.
        let last = r.len() - 1;
        r[last] += rem;
    }
    r
}

fn format_template(
    template: &str,
    child: &serde_json::Map<String, serde_json::Value>,
    parent: &HashMap<String, serde_json::Value>,
) -> String {
    let mut rendered = template.to_string();
    for (key, value) in child {
        let token = format!("{{{}}}", key);
        let replacement = match value {
            serde_json::Value::String(s) => s.clone(),
            _ => value.to_string(),
        };
        rendered = rendered.replace(&token, &replacement);
    }
    for (key, value) in parent {
        let token = format!("{{{}}}", key);
        let replacement = match value {
            serde_json::Value::String(s) => s.clone(),
            _ => value.to_string(),
        };
        rendered = rendered.replace(&token, &replacement);
    }
    rendered
}

fn merge_expanded_row(
    parent_row: &HashMap<String, serde_json::Value>,
    child_obj: &serde_json::Map<String, serde_json::Value>,
    expansion: &TableRowExpansion,
    table: &TableComponent,
) -> HashMap<String, serde_json::Value> {
    let desc_key = expansion.description_key.as_deref().unwrap_or("descricao");
    let mut child_row = HashMap::new();

    for header in &table.table_header {
        let key = &header.key;
        if key == desc_key {
            let desc_value = if let Some(template) = expansion.description_template.as_deref() {
                format_template(template, child_obj, parent_row)
            } else if let Some(value) = child_obj.get(desc_key) {
                match value {
                    serde_json::Value::String(s) => s.clone(),
                    _ => value.to_string(),
                }
            } else {
                String::new()
            };
            child_row.insert(key.clone(), serde_json::Value::String(desc_value));
            continue;
        }

        if let Some(mappings) = expansion.field_mappings.as_ref() {
            if let Some(mapping) = mappings.iter().find(|m| &m.key == key) {
                if let Some(value) = child_obj.get(&mapping.source_key) {
                    child_row.insert(key.clone(), value.clone());
                    continue;
                }
            }
        }

        if let Some(value) = child_obj.get(key) {
            child_row.insert(key.clone(), value.clone());
        } else if let Some(parent_value) = parent_row.get(key) {
            child_row.insert(key.clone(), parent_value.clone());
        } else {
            child_row.insert(key.clone(), serde_json::Value::String(String::new()));
        }
    }

    child_row
}

fn expand_child_rows(
    expanded: &mut Vec<HashMap<String, serde_json::Value>>,
    parent_row: &HashMap<String, serde_json::Value>,
    expansion: &TableRowExpansion,
    table: &TableComponent,
) {
    if let Some(child_values) = parent_row.get(&expansion.path) {
        if let serde_json::Value::Array(children) = child_values {
            for child in children {
                if let serde_json::Value::Object(child_obj) = child {
                    let child_row = merge_expanded_row(parent_row, child_obj, expansion, table);
                    expanded.push(child_row.clone());

                    if let Some(children) = expansion.children.as_ref() {
                        for nested in children {
                            expand_child_rows(expanded, &child_row, nested, table);
                        }
                    }
                }
            }
        }
    }
}

fn expand_table_rows(
    rows: &[HashMap<String, serde_json::Value>],
    table: &TableComponent,
) -> Vec<HashMap<String, serde_json::Value>> {
    if table.row_expansion.is_none() {
        return rows.to_vec();
    }

    let expansion = table.row_expansion.as_ref().unwrap();
    let mut expanded = Vec::new();

    for row in rows {
        expanded.push(row.clone());
        expand_child_rows(&mut expanded, row, expansion, table);
    }

    expanded
}

fn hash_from_map(
    obj: &serde_json::Map<String, serde_json::Value>,
) -> HashMap<String, serde_json::Value> {
    obj.iter().map(|(k, v)| (k.clone(), v.clone())).collect()
}

fn format_template_hash(
    template: &str,
    child: &HashMap<String, serde_json::Value>,
    parent: &HashMap<String, serde_json::Value>,
) -> String {
    let mut rendered = template.to_string();
    for (key, value) in child {
        let token = format!("{{{}}}", key);
        let replacement = match value {
            serde_json::Value::String(s) => s.clone(),
            _ => value.to_string(),
        };
        rendered = rendered.replace(&token, &replacement);
    }
    for (key, value) in parent {
        let token = format!("{{{}}}", key);
        let replacement = match value {
            serde_json::Value::String(s) => s.clone(),
            _ => value.to_string(),
        };
        rendered = rendered.replace(&token, &replacement);
    }
    if rendered.contains(RESERVED_PAGE_COUNT_QUOTED) {
        rendered = rendered.replace(RESERVED_PAGE_COUNT_QUOTED, PAGE_COUNT_PLACEHOLDER);
    }
    if rendered.contains(RESERVED_PAGE_NUMBER_QUOTED) {
        rendered = rendered.replace(RESERVED_PAGE_NUMBER_QUOTED, PAGE_NUMBER_PLACEHOLDER);
    }
    rendered
}

fn child_cell_value(
    header: &TableHeaderDef,
    child_row: &HashMap<String, serde_json::Value>,
    parent_row: &HashMap<String, serde_json::Value>,
    expansion: &TableRowExpansion,
) -> String {
    let desc_key = expansion.description_key.as_deref().unwrap_or("descricao");

    if header.key == desc_key {
        if let Some(template) = expansion.description_template.as_deref() {
            return format_template_hash(template, child_row, parent_row);
        }
    }

    if let Some(mappings) = expansion.field_mappings.as_ref() {
        if let Some(mapping) = mappings.iter().find(|m| &m.key == &header.key) {
            if let Some(value) = child_row.get(&mapping.source_key) {
                return format_mask(value, header.mask.as_deref());
            }
        }
    }

    if let Some(value) = child_row.get(&header.key) {
        return format_mask(value, header.mask.as_deref());
    }
    if let Some(value) = parent_row.get(&header.key) {
        return format_mask(value, header.mask.as_deref());
    }
    String::new()
}

fn child_numeric_value(
    hdr: &TableHeaderDef,
    obj: &serde_json::Map<String, serde_json::Value>,
    expansion: &TableRowExpansion,
) -> Option<f64> {
    if let Some(mappings) = expansion.field_mappings.as_ref() {
        if let Some(mapping) = mappings.iter().find(|m| &m.key == &hdr.key) {
            if let Some(value) = obj.get(&mapping.source_key) {
                return value.as_f64();
            }
        }
    }
    obj.get(&hdr.key).and_then(|v| v.as_f64())
}

fn render_child_section(
    c: &mut Content,
    parent_row: &HashMap<String, serde_json::Value>,
    expansion: &TableRowExpansion,
    table: &TableComponent,
    dctx: &V3DataContext,
    ctx: &V3RenderContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
    page_break: &mut dyn FnMut(&mut Content, &mut f32),
    tx: f32,
    iw: f32,
    fs: f32,
    hh: f32,
    render_header: &dyn Fn(&mut Content, f32),
) -> bool {
    let raw_child_items = match parent_row.get(&expansion.path) {
        Some(serde_json::Value::Array(items)) => items,
        _ => return false,
    };
    if raw_child_items.is_empty() {
        return false;
    }

    // Agrega os itens se configurado
    let aggregated_items_owned: Vec<serde_json::Value>;
    let child_items: &[serde_json::Value] = if let (Some(agg_keys), Some(sum_keys)) = (
        expansion.aggregate.as_ref(),
        expansion.aggregate_sum.as_ref(),
    ) {
        let maps: Vec<HashMap<String, serde_json::Value>> = raw_child_items
            .iter()
            .filter_map(|v| {
                if let serde_json::Value::Object(obj) = v {
                    Some(hash_from_map(obj))
                } else {
                    None
                }
            })
            .collect();
        let refs: Vec<&HashMap<_, _>> = maps.iter().collect();
        let agg = aggregate_rows(&refs, agg_keys, sum_keys);
        aggregated_items_owned = agg
            .into_iter()
            .map(|m| serde_json::Value::Object(serde_json::Map::from_iter(m)))
            .collect();
        &aggregated_items_owned
    } else {
        aggregated_items_owned = Vec::new();
        raw_child_items.as_slice()
    };

    if child_items.is_empty() {
        return false;
    }

    let child_headers = expansion
        .table_header
        .as_ref()
        .unwrap_or(&table.table_header);
    let child_cc = child_headers.len().min(
        expansion
            .widths
            .as_ref()
            .map(|w| w.len())
            .unwrap_or(child_headers.len()),
    );
    if child_cc == 0 {
        return false;
    }

    let child_indent = expansion.indent.unwrap_or(18.0);
    let child_tx = tx + child_indent;
    let child_iw = (iw - child_indent).max(0.0);
    let child_cw = resolve_twidths(
        expansion.widths.as_ref().unwrap_or(&table.widths),
        child_iw,
        child_cc,
    );
    let child_al: Vec<&str> = child_headers
        .iter()
        .map(|h| h.align.as_deref().unwrap_or("left"))
        .collect();
    let child_hh = fs * 1.8 + 6.0;
    let child_rh = fs * 1.6 + 5.0;
    let child_gap = expansion.gap.unwrap_or(10.0);
    let child_gap_top = expansion.gap_top.unwrap_or(0.0);
    let child_pre_header = expansion.pre_header.as_ref();
    let child_pre_header_height = if let Some(pre) = child_pre_header {
        let pm = pre
            .margin
            .as_ref()
            .map(|m| m.resolve())
            .unwrap_or((0.0, 0.0, 0.0, 0.0));
        let pfs = pre.font_size.unwrap_or(12.0);
        pfs * 1.5 + 4.0 + pm.0 + pm.2
    } else {
        0.0
    };
    let page_bottom = ctx.bottom_reserved;

    let parent_header_bg = table
        .header_background_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.15, 0.22, 0.37]);
    let parent_header_text = table
        .header_text_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([1.0, 1.0, 1.0]);
    let parent_text = table
        .text_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.20, 0.22, 0.26]);
    let parent_zebra_text = table
        .zebra_text_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or(parent_text);
    let parent_zebra_bg = table
        .zebra_background_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.96, 0.97, 0.99]);
    let parent_border_color = table
        .border_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.25, 0.32, 0.47]);
    let parent_border_width = table.border_width.unwrap_or(0.3);
    let parent_border_style = table.border_style.as_deref().unwrap_or("none");

    let child_header_bg = expansion
        .header_background_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or(parent_header_bg);
    let child_header_text = expansion
        .header_text_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or(parent_header_text);
    let child_text = expansion
        .text_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or(parent_text);
    let child_zebra_text = expansion
        .zebra_text_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or(parent_zebra_text);
    let child_zebra_bg = expansion
        .zebra_background_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or(parent_zebra_bg);
    let child_border_color = expansion
        .border_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or(parent_border_color);
    let child_border_width = expansion.border_width.unwrap_or(parent_border_width);
    let child_border_style = expansion
        .border_style
        .as_deref()
        .unwrap_or(parent_border_style);
    let draw_child_borders = child_border_style != "none" && child_border_width > 0.0;

    fn render_child_header(
        content: &mut Content,
        y: f32,
        child_tx: f32,
        child_iw: f32,
        child_hh: f32,
        child_headers: &[TableHeaderDef],
        child_cw: &[f32],
        child_al: &[&str],
        child_cc: usize,
        fs: f32,
        fb: Name<'static>,
        header_bg: [f32; 3],
        header_text: [f32; 3],
        border_color: [f32; 3],
        border_width: f32,
        draw_borders: bool,
    ) {
        content.set_fill_rgb(header_bg[0], header_bg[1], header_bg[2]);
        content.rect(child_tx, y - child_hh, child_iw, child_hh);
        content.fill_nonzero();

        let mut hx = child_tx;
        for (ci, hdr) in child_headers.iter().enumerate().take(child_cc) {
            let lbl = hdr.prefix.as_deref().unwrap_or(&hdr.key);
            let enc = to_utf8_winansi(lbl, lbl.len());
            let al2 = child_al[ci];
            let tw = enc.len() as f32 * fs * 0.55;
            let dx = match al2 {
                "center" => hx + (child_cw[ci] - tw) / 2.0,
                "right" => hx + child_cw[ci] - tw - 5.0,
                _ => hx + 5.0,
            };
            show_text(
                content,
                &enc,
                fb,
                fs,
                dx,
                y - child_hh / 2.0 - fs / 3.0,
                header_text,
            );
            hx += child_cw[ci];
        }

        if draw_borders {
            content.set_stroke_rgb(border_color[0], border_color[1], border_color[2]);
            content.set_line_width(border_width);
            content.move_to(child_tx, y - child_hh);
            content.line_to(child_tx + child_iw, y - child_hh);
            content.stroke();
            content.move_to(child_tx, y);
            content.line_to(child_tx + child_iw, y);
            content.stroke();
        }
    }

    let mut section_started = false;
    let mut item_index = 0;

    for item_value in child_items {
        if let serde_json::Value::Object(child_obj) = item_value {
            if !section_started {
                let required_space = child_gap_top + child_pre_header_height + child_hh + child_rh;
                if *curs - required_space < page_bottom + 15.0 {
                    page_break(c, curs);
                    render_header(c, *curs);
                    *curs -= hh;
                }
                if child_gap_top > 0.0 {
                    *curs -= child_gap_top;
                }
                if let Some(pre) = child_pre_header {
                    let pm = pre
                        .margin
                        .as_ref()
                        .map(|m| m.resolve())
                        .unwrap_or((0.0, 0.0, 0.0, 0.0));
                    *curs -= pm.0;
                    let pfs = pre.font_size.unwrap_or(12.0);
                    let prh = pfs * 1.5 + 4.0;
                    let mut value = pre.variable.clone().replace('{', "").replace('}', "");
                    if value.starts_with('$') {
                        let key = value.trim_start_matches('$');
                        if key == "pages" {
                            value = PAGE_COUNT_PLACEHOLDER.to_string();
                        } else if let Some(v) = dctx.variables.get(key) {
                            value = v.clone();
                        }
                    } else if let Some(v) = dctx.variables.get(&value) {
                        value = v.clone();
                    }
                    if let Some(ref mask) = pre.mask {
                        value = format_mask(&serde_json::Value::String(value.clone()), Some(mask));
                    }
                    if let Some(ref bg) = pre.background_color {
                        let rgb = hex_to_rgb(bg);
                        c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
                        c.rect(child_tx, *curs - prh, child_iw, prh);
                        c.fill_nonzero();
                    }
                    let color = pre
                        .color
                        .as_deref()
                        .map(hex_to_rgb)
                        .unwrap_or([0.12, 0.12, 0.12]);
                    let align = pre.align.as_deref().unwrap_or("left");
                    let enc = to_utf8_winansi(&value, value.len());
                    let tw = enc.len() as f32 * pfs * 0.55;
                    let dx = match align {
                        "center" => child_tx + (child_iw - tw) / 2.0,
                        "right" => child_tx + child_iw - tw - 4.0,
                        _ => child_tx,
                    };
                    show_text(c, &enc, fb, pfs, dx, *curs - prh / 2.0 - pfs / 3.0, color);
                    *curs -= prh + pm.2;
                }
                render_child_header(
                    c,
                    *curs,
                    child_tx,
                    child_iw,
                    child_hh,
                    child_headers,
                    &child_cw,
                    &child_al,
                    child_cc,
                    fs,
                    fb,
                    child_header_bg,
                    child_header_text,
                    child_border_color,
                    child_border_width,
                    draw_child_borders,
                );
                *curs -= child_hh;
                section_started = true;
            }

            if *curs - child_rh < page_bottom + 15.0 {
                page_break(c, curs);
                render_header(c, *curs);
                *curs -= hh;
                render_child_header(
                    c,
                    *curs,
                    child_tx,
                    child_iw,
                    child_hh,
                    child_headers,
                    &child_cw,
                    &child_al,
                    child_cc,
                    fs,
                    fb,
                    child_header_bg,
                    child_header_text,
                    child_border_color,
                    child_border_width,
                    draw_child_borders,
                );
                *curs -= child_hh;
            }

            let child_row = hash_from_map(child_obj);
            let ry = *curs;
            if (item_index % 2) == 0 {
                c.set_fill_rgb(child_zebra_bg[0], child_zebra_bg[1], child_zebra_bg[2]);
            } else {
                c.set_fill_rgb(1.0, 1.0, 1.0);
            }
            c.rect(child_tx, ry - child_rh, child_iw, child_rh);
            c.fill_nonzero();

            let mut hx = child_tx;
            for ci in 0..child_cc {
                let hdr = &child_headers[ci];
                let val = child_cell_value(hdr, &child_row, parent_row, expansion);
                let enc = to_utf8_winansi(&val, val.len());
                let al2 = child_al[ci];
                let tw = enc.len() as f32 * fs * 0.55;
                let dx = match al2 {
                    "center" => hx + (child_cw[ci] - tw) / 2.0,
                    "right" => hx + child_cw[ci] - tw - 5.0,
                    _ => hx + 5.0,
                };
                show_text(
                    c,
                    &enc,
                    fr,
                    fs,
                    dx,
                    ry - child_rh / 2.0 - fs / 3.0,
                    if (item_index % 2) == 0 {
                        child_zebra_text
                    } else {
                        child_text
                    },
                );
                if draw_child_borders {
                    c.set_stroke_rgb(
                        child_border_color[0],
                        child_border_color[1],
                        child_border_color[2],
                    );
                    c.set_line_width(child_border_width);
                    c.move_to(hx + child_cw[ci], ry);
                    c.line_to(hx + child_cw[ci], ry - child_rh);
                    c.stroke();
                }
                hx += child_cw[ci];
            }

            if draw_child_borders {
                c.set_stroke_rgb(
                    child_border_color[0],
                    child_border_color[1],
                    child_border_color[2],
                );
                c.set_line_width(child_border_width);
                c.move_to(child_tx, ry - child_rh);
                c.line_to(child_tx + child_iw, ry - child_rh);
                c.stroke();
            }
            *curs -= child_rh;
            item_index += 1;

            if let Some(children) = expansion.children.as_ref() {
                for nested in children {
                    let _ = render_child_section(
                        c,
                        &child_row,
                        nested,
                        table,
                        dctx,
                        ctx,
                        curs,
                        fr,
                        fb,
                        page_break,
                        child_tx,
                        child_iw,
                        fs,
                        hh,
                        render_header,
                    );
                }
            }
        }
    }

    if expansion.subtotal.unwrap_or(true) && item_index > 0 {
        if *curs - child_rh < page_bottom + 15.0 {
            page_break(c, curs);
            render_header(c, *curs);
            *curs -= hh;
            // Do not repeat the child header row immediately above the subtotal line.
            // The subtotal belongs to the item section, but the header should only
            // repeat for actual child rows, not the subtotal summary.
        }

        *curs -= 2.0;
        let sy = *curs;
        c.set_stroke_rgb(0.75, 0.78, 0.82);
        c.set_line_width(2.0);
        c.set_dash_pattern(vec![3.0, 2.0], 0.0);
        c.move_to(child_tx, sy);
        c.line_to(child_tx + child_iw, sy);
        c.stroke();
        c.set_dash_pattern(vec![], 0.0);
        let mut hx = child_tx;
        for (ci, hdr) in child_headers.iter().enumerate().take(child_cc) {
            let val = if hdr.sum {
                let total: f64 = child_items
                    .iter()
                    .filter_map(|item| {
                        if let serde_json::Value::Object(obj) = item {
                            child_numeric_value(hdr, obj, expansion)
                        } else {
                            None
                        }
                    })
                    .sum();
                    format_numeric_value(total, hdr.mask.as_deref())
                } else {
                String::new()
            };
            let enc = to_utf8_winansi(&val, val.len());
            let al2 = child_al[ci];
            let tw = enc.len() as f32 * fs * 0.55;
            let dx = match al2 {
                "center" => hx + (child_cw[ci] - tw) / 2.0,
                "right" => hx + child_cw[ci] - tw - 5.0,
                _ => hx + 5.0,
            };
            show_text(
                c,
                &enc,
                fb,
                fs,
                dx,
                sy - child_rh / 2.0 - fs / 3.0,
                [0.12, 0.14, 0.20],
            );
            hx += child_cw[ci];
        }

        if draw_child_borders {
            c.set_stroke_rgb(
                child_border_color[0],
                child_border_color[1],
                child_border_color[2],
            );
            c.set_line_width(child_border_width);
            c.move_to(child_tx, sy);
            c.line_to(child_tx + child_iw, sy);
            c.stroke();
        }
        *curs -= child_rh;
    }

    // summaryBox por seção de itens
    if let Some(sb) = expansion.summary_box.as_ref() {
        if item_index > 0 && !sb.rows.is_empty() {
            let line_h = fs * 2.2;
            let pad_x = 14.0_f32;
            let pad_y = 10.0_f32;
            let box_w = sb.width.unwrap_or(200.0_f32).min(child_iw);
            let box_h = sb.rows.len() as f32 * line_h + pad_y * 2.0;
            let gap_top = 8.0_f32;

            *curs -= gap_top;

            if *curs - box_h < page_bottom + 15.0 {
                page_break(c, curs);
                *curs -= gap_top;
            }

            let box_x = match sb.align.as_deref().unwrap_or("center") {
                "left" => child_tx,
                "right" => child_tx + child_iw - box_w,
                _ => child_tx + (child_iw - box_w) / 2.0,
            };
            let box_y = *curs - box_h;

            c.set_fill_rgb(1.0, 1.0, 1.0);
            c.rect(box_x, box_y, box_w, box_h);
            c.fill_nonzero();

            c.set_stroke_rgb(0.20, 0.22, 0.28);
            c.set_line_width(0.7);
            c.rect(box_x, box_y, box_w, box_h);
            c.stroke();

            let mut ry = *curs - pad_y - line_h * 0.25;

            for sbr in &sb.rows {
                if sbr.divider_before.unwrap_or(false) {
                    let div_y = ry + line_h * 0.55;
                    c.set_stroke_rgb(0.35, 0.38, 0.44);
                    c.set_line_width(0.6);
                    c.set_dash_pattern(vec![3.0, 2.0], 0.0);
                    c.move_to(box_x + pad_x, div_y);
                    c.line_to(box_x + box_w - pad_x, div_y);
                    c.stroke();
                    c.set_dash_pattern(vec![], 0.0);
                    ry -= 2.0;
                }

                let val_str = if let Some(v) = sbr.value.as_deref() {
                    let interpolated = interpolate(v, &dctx.variables);
                    format_value_with_mask(&interpolated, sbr.mask.as_deref())
                } else if let Some(key) = sbr.key.as_deref() {
                    let t: f64 = child_items
                        .iter()
                        .filter_map(|item| {
                            if let serde_json::Value::Object(obj) = item {
                                let hdr_opt = child_headers.iter().find(|h| h.key == key);
                                hdr_opt.and_then(|hdr| child_numeric_value(hdr, obj, expansion))
                            } else {
                                None
                            }
                        })
                        .sum();
                    format_numeric_value(t, sbr.mask.as_deref())
                } else {
                    String::new()
                };

                let font = if sbr.bold.unwrap_or(false) { fb } else { fr };
                let color = if sbr.bold.unwrap_or(false) {
                    [0.08_f32, 0.12, 0.20]
                } else {
                    [0.20, 0.24, 0.30]
                };

                let label_enc = to_utf8_winansi(&sbr.label, sbr.label.len());
                show_text(c, &label_enc, font, fs, box_x + pad_x, ry, color);

                let val_enc = to_utf8_winansi(&val_str, val_str.len());
                let val_tw = val_str.len() as f32 * fs * 0.55;
                show_text(
                    c,
                    &val_enc,
                    font,
                    fs,
                    box_x + box_w - val_tw - pad_x,
                    ry,
                    color,
                );

                ry -= line_h;
            }

            *curs -= box_h + gap_top;
        }
    }

    *curs -= child_gap;
    item_index > 0
}

fn group_rows<'a>(
    rows: &'a [HashMap<String, serde_json::Value>],
    by: &str,
) -> Vec<(String, Vec<&'a HashMap<String, serde_json::Value>>)> {
    let mut groups: Vec<(String, Vec<_>)> = Vec::new();
    let mut indexes: HashMap<String, usize> = HashMap::new();

    for row in rows {
        let key = row
            .get(by)
            .map(|v| match v {
                serde_json::Value::String(s) => s.clone(),
                _ => v.to_string(),
            })
            .unwrap_or_default();

        let index = *indexes.entry(key.clone()).or_insert_with(|| {
            groups.push((key.clone(), Vec::new()));
            groups.len() - 1
        });
        groups[index].1.push(row);
    }
    groups
}

/// Agrega linhas de um grupo: colapsa linhas com mesma combinação de `aggregate_keys`
/// somando os campos em `sum_keys`. Retorna Vec owned de HashMaps.
fn aggregate_rows(
    grp: &[&HashMap<String, serde_json::Value>],
    aggregate_keys: &[String],
    sum_keys: &[String],
) -> Vec<HashMap<String, serde_json::Value>> {
    let mut order: Vec<String> = Vec::new(); // ordem de inserção
    let mut map: HashMap<String, HashMap<String, serde_json::Value>> = HashMap::new();

    for row in grp {
        // chave composta pelos campos de identidade
        let compound: String = aggregate_keys
            .iter()
            .map(|k| {
                row.get(k)
                    .map(|v| match v {
                        serde_json::Value::String(s) => s.clone(),
                        _ => v.to_string(),
                    })
                    .unwrap_or_default()
            })
            .collect::<Vec<_>>()
            .join("\x00");

        if !map.contains_key(&compound) {
            order.push(compound.clone());
            // copia todos os campos da primeira linha como base
            let mut base: HashMap<String, serde_json::Value> = (*row).clone();
            // inicializa campos de soma como 0
            for k in sum_keys {
                base.insert(k.clone(), serde_json::Value::from(0.0_f64));
            }
            map.insert(compound.clone(), base);
        }

        // acumula campos de soma
        let acc = map.get_mut(&compound).unwrap();
        for k in sum_keys {
            let cur = acc.get(k).and_then(|v| v.as_f64()).unwrap_or(0.0);
            let add = row.get(k).and_then(|v| v.as_f64()).unwrap_or(0.0);
            let sum = ((cur + add) * 1e10_f64).round() / 1e10_f64;
            acc.insert(k.clone(), serde_json::Value::from(sum));
        }
    }

    order.into_iter().filter_map(|k| map.remove(&k)).collect()
}

fn rounded_rect(c: &mut Content, x: f32, y: f32, w: f32, h: f32, r: f32) {
    if r <= 0.0 {
        c.rect(x, y, w, h);
        return;
    }
    let k = 0.5522847498 * r;
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

fn rounded_rect_left(c: &mut Content, x: f32, y: f32, w: f32, h: f32, r: f32) {
    if r <= 0.0 {
        c.rect(x, y, w, h);
        return;
    }
    let k = 0.5522847498 * r;
    c.move_to(x + w, y);
    c.line_to(x + r, y);
    c.cubic_to(x + r - k, y, x, y + r - k, x, y + r);
    c.line_to(x, y + h - r);
    c.cubic_to(x, y + h - r + k, x + r - k, y + h, x + r, y + h);
    c.line_to(x + w, y + h);
    c.line_to(x + w, y);
    c.close_path();
}

fn draw_pill(
    c: &mut Content,
    text: &str,
    cell_x: f32,  // left edge of the column cell
    cell_w: f32,  // width of the column
    cell_y: f32,  // top of cell (ry)
    cell_h: f32,  // row height
    align: &str,
    pill_width_override: Option<f32>,
    bg: [f32; 3],
    fb: Name<'static>,
    fs: f32,
) {
    let enc = to_utf8_winansi(text, text.len());
    let text_w = enc.len() as f32 * fs * 0.55;
    let pad_x = fs * 0.7;
    let pill_w = pill_width_override
        .unwrap_or_else(|| (text_w + pad_x * 2.0).max(fs * 2.0));
    let pill_h = fs * 1.35;
    let pill_x = match align {
        "right"  => cell_x + cell_w - pill_w - 5.0,
        "center" => cell_x + (cell_w - pill_w) / 2.0,
        _        => cell_x + 5.0,
    };
    let pill_y = cell_y - (cell_h - pill_h) / 2.0;

    rounded_rect(c, pill_x, pill_y - pill_h, pill_w, pill_h, pill_h / 2.0);
    c.set_fill_rgb(bg[0], bg[1], bg[2]);
    c.fill_nonzero();

    let text_x = pill_x + (pill_w - text_w) / 2.0;
    let text_y = pill_y - pill_h / 2.0 - fs / 3.0;
    show_text(c, &enc, fb, fs, text_x, text_y, [1.0, 1.0, 1.0]);
}

fn draw_card_icon(
    c: &mut Content,
    icon: &str,
    x: f32,
    y: f32,
    size: f32,
    color: [f32; 3],
    fi: Name<'static>,
) {
    // SVG paths are from Lucide (viewBox 0 0 24 24, stroke-only, stroke-width=2).
    // PDF Y axis is inverted vs SVG: pdf_y = ib + (24 - svg_y) * s
    // 'ib' is the visual bottom of the icon in PDF space.
    let ib = y - size * 0.8;
    let s = size / 24.0; // scale: 1 SVG unit → s PDF units
    let lw = (2.0 * s).max(0.4);

    // Helper: convert SVG (sx,sy) to PDF (px,py)
    // px = x + sx*s,  py = ib + (24-sy)*s
    macro_rules! p {
        ($sx:expr, $sy:expr) => {
            (x + ($sx as f32) * s, ib + (24.0 - ($sy as f32)) * s)
        };
    }

    match icon {
        "calendar" => {
            // Lucide calendar paths (viewBox 0 0 24 24):
            //   <path d="M8 2v4" />
            //   <path d="M16 2v4" />
            //   <rect width="18" height="18" x="3" y="4" rx="2" />
            //   <path d="M3 10h18" />
            c.set_stroke_rgb(color[0], color[1], color[2]);
            c.set_line_width(lw);

            // rect x=3 y=4 w=18 h=18 rx=2
            // PDF bottom = ib+(24-22)*s, height=18*s
            rounded_rect(c, x + 3.0 * s, ib + 2.0 * s, 18.0 * s, 18.0 * s, 2.0 * s);
            c.stroke();

            // M8 2v4 → (8,2)→(8,6)
            let (x1, y1) = p!(8, 2);
            let (x2, y2) = p!(8, 6);
            c.move_to(x1, y1);
            c.line_to(x2, y2);
            c.stroke();

            // M16 2v4 → (16,2)→(16,6)
            let (x1, y1) = p!(16, 2);
            let (x2, y2) = p!(16, 6);
            c.move_to(x1, y1);
            c.line_to(x2, y2);
            c.stroke();

            // M3 10h18 → (3,10)→(21,10)
            let (x1, y1) = p!(3, 10);
            let (x2, y2) = p!(21, 10);
            c.move_to(x1, y1);
            c.line_to(x2, y2);
            c.stroke();
        }
        "ticket" => {
            // Lucide ticket (viewBox 0 0 24 24):
            //   Outer body: rounded rect ~x=2..22, y=5..19
            //   Notch arcs at left (x=2) and right (x=22) at y=9..15 (r=3)
            //   Perforations: M13 5v2, M13 11v2, M13 17v2
            c.set_stroke_rgb(color[0], color[1], color[2]);
            c.set_line_width(lw);

            // Ticket outline: rounded rect
            rounded_rect(c, x + 2.0 * s, ib + 5.0 * s, 20.0 * s, 14.0 * s, 2.0 * s);
            c.stroke();

            // Notch circles (filled white) at left and right midpoints y=12
            let notch_r = 3.0 * s;
            let mid_y_pdf = ib + 12.0 * s;
            crate::draw_circle(c, x + 2.0 * s, mid_y_pdf, notch_r, 1.0, 1.0, 1.0, true);
            crate::draw_circle(c, x + 22.0 * s, mid_y_pdf, notch_r, 1.0, 1.0, 1.0, true);

            // Re-stroke outline (notch circles may have overdrawn it)
            c.set_stroke_rgb(color[0], color[1], color[2]);
            c.set_line_width(lw);
            rounded_rect(c, x + 2.0 * s, ib + 5.0 * s, 20.0 * s, 14.0 * s, 2.0 * s);
            c.stroke();

            // Perforations: M13 5v2, M13 11v2, M13 17v2
            let px = x + 13.0 * s;
            c.move_to(px, ib + 19.0 * s);
            c.line_to(px, ib + 17.0 * s);
            c.stroke();
            c.move_to(px, ib + 13.0 * s);
            c.line_to(px, ib + 11.0 * s);
            c.stroke();
            c.move_to(px, ib + 7.0 * s);
            c.line_to(px, ib + 5.0 * s);
            c.stroke();
        }
        "dollar" => {
            // Lucide dollar-sign (viewBox 0 0 24 24):
            //   <line x1="12" x2="12" y1="2" y2="22" />
            //   <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            // S-curve arcs are semicircles (diameter = 7 = 2*3.5).
            // Arc1: (9.5,5)→(9.5,12), center=(9.5,8.5), sweep=0 → curves LEFT in PDF
            // Arc2: (14.5,12)→(14.5,19), center=(14.5,15.5), sweep=1 → curves RIGHT in PDF
            c.set_stroke_rgb(color[0], color[1], color[2]);
            c.set_line_width(lw);

            // Vertical line M12 2 V22
            let (x1, y1) = p!(12, 2);
            let (x2, y2) = p!(12, 22);
            c.move_to(x1, y1);
            c.line_to(x2, y2);
            c.stroke();

            // S-curve
            let k = 0.5523_f32;
            let r = 3.5 * s;
            // M17 5
            let (sx, sy) = p!(17.0, 5.0);
            c.move_to(sx, sy);
            // H9.5
            let (ax, ay) = p!(9.5, 5.0);
            c.line_to(ax, ay);
            // Arc left: from (9.5,5)→(9.5,12) curves LEFT (CW in PDF)
            // Tangent at start (ib+19s) points left; tangent at end (ib+12s) points left
            let (ex, ey) = p!(9.5, 12.0);
            c.cubic_to(ax - k * r, ay, ex - k * r, ey, ex, ey);
            // h5 → to (14.5,12)
            let (bx, by) = p!(14.5, 12.0);
            c.line_to(bx, by);
            // Arc right: from (14.5,12)→(14.5,19) curves RIGHT (CCW in PDF)
            let (ex2, ey2) = p!(14.5, 19.0);
            c.cubic_to(bx + k * r, by, ex2 + k * r, ey2, ex2, ey2);
            // H6
            let (fx, fy) = p!(6.0, 19.0);
            c.line_to(fx, fy);
            c.stroke();
        }
        "money" => {
            // Lucide banknote (viewBox 0 0 24 24):
            //   <rect width="20" height="12" x="2" y="6" rx="2" />
            //   <circle cx="12" cy="12" r="2" />
            //   <path d="M6 12h.01M18 12h.01" />
            c.set_stroke_rgb(color[0], color[1], color[2]);
            c.set_line_width(lw);

            // Rect x=2 y=6 w=20 h=12 rx=2 → PDF bottom = ib+6s, height=12s
            rounded_rect(c, x + 2.0 * s, ib + 6.0 * s, 20.0 * s, 12.0 * s, 2.0 * s);
            c.stroke();

            // Circle at (12,12) r=2 — 4-bezier approximation
            let k = 0.5523_f32;
            let cr = 2.0 * s;
            let ccx = x + 12.0 * s;
            let ccy = ib + 12.0 * s;
            c.move_to(ccx + cr, ccy);
            c.cubic_to(
                ccx + cr,
                ccy + k * cr,
                ccx + k * cr,
                ccy + cr,
                ccx,
                ccy + cr,
            );
            c.cubic_to(
                ccx - k * cr,
                ccy + cr,
                ccx - cr,
                ccy + k * cr,
                ccx - cr,
                ccy,
            );
            c.cubic_to(
                ccx - cr,
                ccy - k * cr,
                ccx - k * cr,
                ccy - cr,
                ccx,
                ccy - cr,
            );
            c.cubic_to(
                ccx + k * cr,
                ccy - cr,
                ccx + cr,
                ccy - k * cr,
                ccx + cr,
                ccy,
            );
            c.close_path();
            c.stroke();

            // Dots: M6 12h.01 and M18 12h.01 — small lines (dot size)
            let dot = (lw * 1.5).max(s * 0.5);
            let dy = ib + 12.0 * s;
            c.move_to(x + 6.0 * s, dy);
            c.line_to(x + 6.0 * s + dot, dy);
            c.stroke();
            c.move_to(x + 18.0 * s, dy);
            c.line_to(x + 18.0 * s + dot, dy);
            c.stroke();
        }
        "wallet" => {
            // Lucide wallet — simplified to main recognizable shapes:
            //   Main body:     rect (3,5)..(21,21)
            //   Top flap line: y=7 from x=5..20
            //   Coin pocket:   rect (17,8)..(22,16)
            //   Coin circle:   (19.5, 12) r=1.5
            c.set_stroke_rgb(color[0], color[1], color[2]);
            c.set_line_width(lw);

            // Main body: SVG x=3..21, y=5..21
            rounded_rect(c, x + 3.0 * s, ib + 3.0 * s, 18.0 * s, 16.0 * s, 2.0 * s);
            c.stroke();

            // Flap line at SVG y=7
            let (x1, y1) = p!(5, 7);
            let (x2, y2) = p!(20, 7);
            c.move_to(x1, y1);
            c.line_to(x2, y2);
            c.stroke();

            // Coin pocket: SVG x=17..22, y=8..16
            rounded_rect(c, x + 17.0 * s, ib + 8.0 * s, 5.0 * s, 8.0 * s, 1.0 * s);
            c.stroke();

            // Coin circle at SVG (19.5, 12) r=1.5
            let k = 0.5523_f32;
            let cr = 1.5 * s;
            let ccx = x + 19.5 * s;
            let ccy = ib + 12.0 * s;
            c.move_to(ccx + cr, ccy);
            c.cubic_to(
                ccx + cr,
                ccy + k * cr,
                ccx + k * cr,
                ccy + cr,
                ccx,
                ccy + cr,
            );
            c.cubic_to(
                ccx - k * cr,
                ccy + cr,
                ccx - cr,
                ccy + k * cr,
                ccx - cr,
                ccy,
            );
            c.cubic_to(
                ccx - cr,
                ccy - k * cr,
                ccx - k * cr,
                ccy - cr,
                ccx,
                ccy - cr,
            );
            c.cubic_to(
                ccx + k * cr,
                ccy - cr,
                ccx + cr,
                ccy - k * cr,
                ccx + cr,
                ccy,
            );
            c.close_path();
            c.stroke();
        }
        "film" => {
            // Lucide film (viewBox 0 0 24 24) — fita de cinema
            // <rect width="18" height="18" x="3" y="3" rx="2" />
            // <path d="M7 3v18" /> <path d="M17 3v18" />
            // <path d="M3 12h18" />
            // <path d="M3 7.5h4" /> <path d="M3 16.5h4" />
            // <path d="M17 7.5h4" /> <path d="M17 16.5h4" />
            c.set_stroke_rgb(color[0], color[1], color[2]);
            c.set_line_width(lw);

            // Outer rect x=3 y=3 w=18 h=18 rx=2
            rounded_rect(c, x + 3.0 * s, ib + 3.0 * s, 18.0 * s, 18.0 * s, 2.0 * s);
            c.stroke();

            // Left strip line x=7
            let (x1, y1) = p!(7, 3);
            let (x2, y2) = p!(7, 21);
            c.move_to(x1, y1); c.line_to(x2, y2); c.stroke();

            // Right strip line x=17
            let (x1, y1) = p!(17, 3);
            let (x2, y2) = p!(17, 21);
            c.move_to(x1, y1); c.line_to(x2, y2); c.stroke();

            // Middle horizontal y=12
            let (x1, y1) = p!(3, 12);
            let (x2, y2) = p!(21, 12);
            c.move_to(x1, y1); c.line_to(x2, y2); c.stroke();

            // Left notches
            let (x1, y1) = p!(3, 7.5); let (x2, y2) = p!(7, 7.5);
            c.move_to(x1, y1); c.line_to(x2, y2); c.stroke();
            let (x1, y1) = p!(3, 16.5); let (x2, y2) = p!(7, 16.5);
            c.move_to(x1, y1); c.line_to(x2, y2); c.stroke();

            // Right notches
            let (x1, y1) = p!(17, 7.5); let (x2, y2) = p!(21, 7.5);
            c.move_to(x1, y1); c.line_to(x2, y2); c.stroke();
            let (x1, y1) = p!(17, 16.5); let (x2, y2) = p!(21, 16.5);
            c.move_to(x1, y1); c.line_to(x2, y2); c.stroke();
        }
        "megaphone" => {
            // Lucide megaphone (viewBox 0 0 24 24) — megafone/corneta
            // Body cone: M(3,11) → L(21,6) → L(21,18) → L(3,13)
            // Handle arc (approx bezier): M(11.6,16.8) curving to (5.8,15.2)
            c.set_stroke_rgb(color[0], color[1], color[2]);
            c.set_line_width(lw);

            // Cone body (4 sides)
            let (ax, ay) = p!(3, 11);
            let (bx, by) = p!(21, 6);
            let (ex, ey) = p!(21, 18);
            let (dx, dy) = p!(3, 13);
            c.move_to(ax, ay);
            c.line_to(bx, by);
            c.line_to(ex, ey);
            c.line_to(dx, dy);
            c.close_path();
            c.stroke();

            // Handle/grip: cubic bezier approx of arc from (11.6,16.8)→(5.8,15.2)
            // bulging downward (toward SVG y=21)
            let (sx, sy) = p!(11.6, 16.8);
            let (ex2, ey2) = p!(5.8, 15.2);
            let (cp1x, cp1y) = p!(10.0, 21.0);
            let (cp2x, cp2y) = p!(6.5, 20.5);
            c.move_to(sx, sy);
            c.cubic_to(cp1x, cp1y, cp2x, cp2y, ex2, ey2);
            c.stroke();

            // Sound waves on the right (wide) end: two arcs at x≈22-23
            // Small arc: center (21,12) r=2
            let r1 = 2.0 * s;
            let ccx = x + 22.0 * s;
            let ccy = ib + 12.0 * s;
            // Arc from top to bottom (quarter circle each side)
            let (top_x, top_y)    = p!(22.0, 10.0);
            let (bot_x, bot_y)    = p!(22.0, 14.0);
            let (cp1x2, cp1y2)   = p!(24.0, 10.0);
            let (cp2x2, cp2y2)   = p!(24.0, 14.0);
            let _ = (r1, ccx, ccy);
            c.move_to(top_x, top_y);
            c.cubic_to(cp1x2, cp1y2, cp2x2, cp2y2, bot_x, bot_y);
            c.stroke();
        }
        "filter" => {
    // Lucide filter (viewBox 0 0 24 24):
    //   <polygon points="3,3 21,3 14,12 14,21 10,21 10,12" />
    c.set_stroke_rgb(color[0], color[1], color[2]);
    c.set_line_width(lw);

    let pts: &[(f32, f32)] = &[
        (3.0, 3.0), (21.0, 3.0), (14.0, 12.0),
        (14.0, 21.0), (10.0, 21.0), (10.0, 12.0),
    ];
    let (sx, sy) = p!(pts[0].0, pts[0].1);
    c.move_to(sx, sy);
    for &(px, py) in &pts[1..] {
        let (qx, qy) = p!(px, py);
        c.line_to(qx, qy);
    }
    c.close_path();
    c.stroke();
}
"chart" => {
    // Lucide chart-bar (viewBox 0 0 24 24):
    //   <line x1="3" y1="3" x2="3" y2="21"/>
    //   <line x1="3" y1="21" x2="21" y2="21"/>
    //   <rect x="7" y="13" width="4" height="8" rx="1"/>
    //   <rect x="13" y="8" width="4" height="13" rx="1"/>
    c.set_stroke_rgb(color[0], color[1], color[2]);
    c.set_line_width(lw);

    // Eixo Y: (3,3)→(3,21)
    let (x1, y1) = p!(3, 3);
    let (x2, y2) = p!(3, 21);
    c.move_to(x1, y1); c.line_to(x2, y2); c.stroke();

    // Eixo X: (3,21)→(21,21)
    let (x1, y1) = p!(3, 21);
    let (x2, y2) = p!(21, 21);
    c.move_to(x1, y1); c.line_to(x2, y2); c.stroke();

    // Barra 1: SVG x=7 y=13 w=4 h=8 → PDF bottom = ib+(24-21)*s = ib+3s, h=8s
    rounded_rect(c, x + 7.0*s, ib + 3.0*s, 4.0*s, 8.0*s, 1.0*s);
    c.stroke();

    // Barra 2: SVG x=13 y=8 w=4 h=13 → PDF bottom = ib+(24-21)*s = ib+3s, h=13s
    rounded_rect(c, x + 13.0*s, ib + 3.0*s, 4.0*s, 13.0*s, 1.0*s);
    c.stroke();
}
"user" => {
    // Lucide user (viewBox 0 0 24 24):
    //   <circle cx="12" cy="8" r="4"/>
    //   <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    c.set_stroke_rgb(color[0], color[1], color[2]);
    c.set_line_width(lw);

    // Cabeça: circle cx=12 cy=8 r=4
    // PDF center: (x+12s, ib+(24-8)s) = (x+12s, ib+16s)
    let k = 0.5523_f32;
    let cr = 4.0*s;
    let ccx = x + 12.0*s;
    let ccy = ib + 16.0*s;
    c.move_to(ccx + cr, ccy);
    c.cubic_to(ccx+cr, ccy+k*cr, ccx+k*cr, ccy+cr, ccx,      ccy+cr);
    c.cubic_to(ccx-k*cr, ccy+cr, ccx-cr, ccy+k*cr, ccx-cr,   ccy);
    c.cubic_to(ccx-cr, ccy-k*cr, ccx-k*cr, ccy-cr, ccx,      ccy-cr);
    c.cubic_to(ccx+k*cr, ccy-cr, ccx+cr, ccy-k*cr, ccx+cr,   ccy);
    c.close_path(); c.stroke();

    // Ombros: M4 20 → curva → M20 20
    // p!(4,20) e p!(20,20) funcionam direto
    let (sx, sy)     = p!(4,  20);
    let (cp1x, cp1y) = p!(4,  16);
    let (cp2x, cp2y) = p!(7.6,13);
    let (ex,   ey)   = p!(12, 13);
    c.move_to(sx, sy);
    c.cubic_to(cp1x, cp1y, cp2x, cp2y, ex, ey);
    let (cp3x, cp3y) = p!(16.4, 13);
    let (cp4x, cp4y) = p!(20,   16);
    let (ex2,  ey2)  = p!(20,   20);
    c.cubic_to(cp3x, cp3y, cp4x, cp4y, ex2, ey2);
    c.stroke();
}
"box" => {
    // Lucide box (viewBox 0 0 24 24):
    //   <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
    //   <path d="m3.3 7 8.7 5 8.7-5"/>
    //   <line x1="12" y1="22" x2="12" y2="12"/>
    c.set_stroke_rgb(color[0], color[1], color[2]);
    c.set_line_width(lw);

    // Hexágono da caixa
    let (x1, y1) = p!(12, 2);
    let (x2, y2) = p!(21, 7);
    let (x3, y3) = p!(21, 17);
    let (x4, y4) = p!(12, 22);
    let (x5, y5) = p!(3,  17);
    let (x6, y6) = p!(3,  7);
    c.move_to(x1, y1);
    c.line_to(x2, y2); c.line_to(x3, y3); c.line_to(x4, y4);
    c.line_to(x5, y5); c.line_to(x6, y6);
    c.close_path(); c.stroke();

    // Aresta do topo: (3.3,7)→(12,12)→(20.7,7)
    let (ax, ay) = p!(3.3, 7);
    let (bx, by) = p!(12,  12);
    let (cx_, cy_) = p!(20.7, 7);
    c.move_to(ax, ay); c.line_to(bx, by); c.line_to(cx_, cy_); c.stroke();

    // Aresta vertical: (12,22)→(12,12)
    let (vx,  vy1) = p!(12, 22);
    let (_,   vy2) = p!(12, 12);
    c.move_to(vx, vy1); c.line_to(vx, vy2); c.stroke();
}
"bottle" => {
    // Garrafa (viewBox 0 0 24 24)
    c.set_stroke_rgb(color[0], color[1], color[2]);
    c.set_line_width(lw);

    // Tampa: SVG x=9 y=2 w=6 h=3 → PDF bottom = ib+(24-5)*s = ib+19s
    rounded_rect(c, x + 9.0*s, ib + 19.0*s, 6.0*s, 3.0*s, 1.0*s);
    c.stroke();

    // Corpo: começa em SVG (9,5), desce gargalo, alarga, base
    let (sx, sy)     = p!(9,  5);
    let (g1x, g1y)   = p!(9,  7);
    let (cp1x, cp1y) = p!(6,  8.5);
    let (cp2x, cp2y) = p!(6,  9.5);
    let (e1x, e1y)   = p!(6,  12);
    let (e2x, e2y)   = p!(6,  20);
    let (b1x, b1y)   = p!(8,  22);
    let (b2x, b2y)   = p!(16, 22);
    let (b3x, b3y)   = p!(18, 20);
    let (e3x, e3y)   = p!(18, 12);
    let (cp3x, cp3y) = p!(18, 9.5);
    let (cp4x, cp4y) = p!(15, 8.5);
    let (e4x, e4y)   = p!(15, 7);
    let (tx,  ty)    = p!(15, 5);

    c.move_to(sx, sy);
    c.line_to(g1x, g1y);
    c.cubic_to(cp1x, cp1y, cp2x, cp2y, e1x, e1y);
    c.line_to(e2x, e2y);
    // canto base esq
    let (cl1x, cl1y) = p!(6, 22);
    c.cubic_to(cl1x, cl1y, cl1x, cl1y, b1x, b1y);
    c.line_to(b2x, b2y);
    // canto base dir
    let (cr1x, cr1y) = p!(18, 22);
    c.cubic_to(cr1x, cr1y, cr1x, cr1y, b3x, b3y);
    c.line_to(e3x, e3y);
    c.cubic_to(cp3x, cp3y, cp4x, cp4y, e4x, e4y);
    c.line_to(tx, ty);
    c.close_path(); c.stroke();

    // Linha de nível: SVG y=15
    let (lx1, ly1) = p!(6.2,  15);
    let (lx2, ly2) = p!(17.8, 15);
    c.move_to(lx1, ly1); c.line_to(lx2, ly2); c.stroke();
}
"bag" => {
    // Lucide shopping-bag (viewBox 0 0 24 24):
    //   <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
    //   <line x1="3" y1="6" x2="21" y2="6"/>
    //   <path d="M16 10a4 4 0 0 1-8 0"/>
    c.set_stroke_rgb(color[0], color[1], color[2]);
    c.set_line_width(lw);

    // Corpo da sacola
    let (sx,  sy)  = p!(6,  2);
    let (ax,  ay)  = p!(3,  6);
    let (bx,  by)  = p!(3,  20);
    let (c1x, c1y) = p!(5,  22);
    let (dx,  dy)  = p!(19, 22);
    let (c2x, c2y) = p!(21, 20);
    let (ex,  ey)  = p!(21, 6);
    let (fx,  fy)  = p!(18, 2);
    // cantos rx=2
    let (bl1x, bl1y) = p!(3,  22);
    let (br1x, br1y) = p!(21, 22);
    c.move_to(sx, sy);
    c.line_to(ax, ay);
    c.line_to(bx, by);
    c.cubic_to(bl1x, bl1y, bl1x, bl1y, c1x, c1y);
    c.line_to(dx, dy);
    c.cubic_to(br1x, br1y, br1x, br1y, c2x, c2y);
    c.line_to(ex, ey);
    c.line_to(fx, fy);
    c.close_path(); c.stroke();

    // Linha divisória topo: (3,6)→(21,6)
    let (lx1, ly1) = p!(3,  6);
    let (lx2, ly2) = p!(21, 6);
    c.move_to(lx1, ly1); c.line_to(lx2, ly2); c.stroke();

    // Alça: arco superior de círculo cx=12 cy=10 r=4
    // SVG: M16 10 a4 4 0 0 1-8 0  → semicírculo superior
    // PDF center: (x+12s, ib+(24-10)s) = (x+12s, ib+14s)
    let k    = 0.5523_f32;
    let hr   = 4.0*s;
    let hcx  = x   + 12.0*s;
    let hcy  = ib  + 14.0*s;
    let (hsx, hsy) = p!(16, 10);
    let (hex, hey) = p!(8,  10);
    c.move_to(hsx, hsy);
    c.cubic_to(hcx+hr, hcy-k*hr, hcx+k*hr, hcy-hr, hcx,    hcy-hr);
    c.cubic_to(hcx-k*hr, hcy-hr, hcx-hr, hcy-k*hr, hex, hey);
    c.stroke();
}
"pencil" => {
    // Lucide pencil (viewBox 0 0 24 24):
    //   <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    //   <path d="m15 5 4 4" />
    c.set_stroke_rgb(color[0], color[1], color[2]);
    c.set_line_width(lw);

    // Corpo do lápis — approximado com bezier
    // Ponta do lápis: (2,22) → canto inferior esquerdo
    // Cabeça: rotação ~45°, arco rx=2.85 ry=2.83
    // Simplificamos como path poligonal + curva na ponta superior
    let k = 0.5523_f32;
    let r = 2.0 * s; // aprox raio da ponta

    // Ponta superior direita (curva arredondada)
    let (ax, ay) = p!(17.0, 3.0);  // início do arco
    let (bx, by) = p!(21.0, 7.0);  // fim do arco
    let cp1x = ax + k * r * 2.0;
    let cp2x = bx;
    let cp2y = by - k * r * 2.0;

    c.move_to(ax, ay);
    c.cubic_to(cp1x, ay, cp2x, cp2y, bx, by);

    // Corpo diagonal até base
    let (cx_, cy_) = p!(7.5, 20.5);
    c.line_to(cx_, cy_);

    // Base triangular (serrilha + ponta)
    let (dx, dy) = p!(2.0, 22.0);
    c.line_to(dx, dy);
    let (ex, ey) = p!(3.5, 16.5);
    c.line_to(ex, ey);

    // Fecha de volta ao início
    c.close_path();
    c.stroke();

    // Linha diagonal da dobra: m15 5 l4 4
    let (lx1, ly1) = p!(15.0, 5.0);
    let (lx2, ly2) = p!(19.0, 9.0);
    c.move_to(lx1, ly1);
    c.line_to(lx2, ly2);
    c.stroke();
}
        "building" => {
            // Simplified building icon (prédio)
            // Main body: rect x=5 y=2 w=14 h=20 rx=1
            // Door: rect x=9 y=14 w=6 h=8
            // Windows (horizontal lines): y=6, y=10 — two windows per row
            c.set_stroke_rgb(color[0], color[1], color[2]);
            c.set_line_width(lw);

            // Main building rect
            rounded_rect(c, x + 5.0 * s, ib + 2.0 * s, 14.0 * s, 20.0 * s, 1.0 * s);
            c.stroke();

            // Door (rect, no rounding)
            let (dx, dy) = p!(9, 22);
            c.rect(dx, dy, 6.0 * s, 8.0 * s);
            c.stroke();

            // Window row 1 (SVG y=6): left x=7→9, right x=13→15 (small squares as lines)
            let win_w = 2.5 * s;
            let win_rows = [6.0_f32, 10.0, 14.0];
            for &wy in &win_rows {
                if wy >= 14.0 { break; } // skip window area where door is
                let (lx, ly) = p!(7.0, wy);
                let (rx2, _) = p!(13.0, wy);
                c.rect(lx, ly - win_w, win_w, win_w);
                c.stroke();
                c.rect(rx2, ly - win_w, win_w, win_w);
                c.stroke();
            }
        }
        _ => {
            // outros ícones: fallback texto
            let enc = to_utf8_winansi(icon, 4);
            show_text(c, &enc, fi, size, x, y, color);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEIGHT ESTIMATORS
// ═══════════════════════════════════════════════════════════════════════════════

fn est_h(comp: &ComponentV3, pw: f32, ctx: &V3DataContext) -> f32 {
    match comp {
        ComponentV3::Text(t) => t.font_size.unwrap_or(FONT_SIZE) * 1.4 + 2.0,
        ComponentV3::StackLayout(s) => {
            let gap = s.gap.unwrap_or(4.0);
            s.content.iter().map(|c| est_h(c, pw, ctx)).sum::<f32>()
                + gap * s.content.len().saturating_sub(1) as f32
        }
        ComponentV3::Card(c) => {
            let p = c
                .padding
                .as_ref()
                .map(|p| p.resolve())
                .unwrap_or((6.0, 6.0, 6.0, 6.0));
            let cw = resolve_size(&c.width, pw);
            let iw = cw - p.1 - p.3;
            let ch: f32 = c.content.iter().map(|x| est_h(x, iw, ctx)).sum::<f32>()
                + c.content.len().saturating_sub(1) as f32 * 4.0;
            let nat = ch + p.0 + p.2;
            match &c.height {
                Some(V3Size::Pixels(v)) => v.max(nat),
                _ => nat,
            }
        }
        ComponentV3::HorizontalStack(h) => {
            let count = h.content.len().max(1);
            let gap = h.gap.unwrap_or(4.0);
            let cw = (pw - gap * (count - 1) as f32) / count as f32;
            h.content
                .iter()
                .map(|x| est_h(x, cw, ctx))
                .fold(0.0, f32::max)
        }
        ComponentV3::FluidLayout(f) => {
            let widths = resolve_fluid(&f.sizes, pw, f.gap.unwrap_or(4.0));
            f.content
                .iter()
                .enumerate()
                .map(|(i, x)| est_h(x, widths[i.min(widths.len() - 1)], ctx))
                .fold(0.0, f32::max)
        }
        ComponentV3::Table(_t) => {
            // Tables can break across pages, so estimate only a minimal start height
            // instead of the full dataset height. The table renderer itself handles
            // row-level page breaks internally.
            34.0
        }
        ComponentV3::Chart(_) => 160.0,
        ComponentV3::ImageBox(img) => {
            let render_w = img.width.unwrap_or(pw);
            let render_h = img.height.unwrap_or(render_w); // conservador sem aspect ratio
            let m = img
                .margin
                .as_ref()
                .map(|m| m.resolve())
                .unwrap_or((4.0, 0.0, 4.0, 0.0));
            render_h + m.0 + m.2
        }
        ComponentV3::PriceList(_) => 34.0, // minimal estimate, expands with dataset
        ComponentV3::TableMultiData(_) => 34.0, // minimal estimate, expands with dataset
    }
}

fn est_h_with_margin(comp: &ComponentV3, pw: f32, ctx: &V3DataContext) -> f32 {
    match comp {
        ComponentV3::Text(t) => {
            let m = t
                .margin
                .as_ref()
                .map(|m| m.resolve())
                .unwrap_or((0.0, 0.0, 0.0, 0.0));
            est_h(comp, pw, ctx) + m.0 + m.2
        }
        ComponentV3::StackLayout(s) => {
            let gap = s.gap.unwrap_or(4.0);
            let inner = s
                .content
                .iter()
                .map(|c| est_h_with_margin(c, pw, ctx))
                .sum::<f32>()
                + gap * s.content.len().saturating_sub(1) as f32;
            let m = s
                .margin
                .as_ref()
                .map(|m| m.resolve())
                .unwrap_or((0.0, 0.0, 0.0, 0.0));
            inner + m.0 + m.2
        }
        ComponentV3::Card(c) => {
            let m = c
                .margin
                .as_ref()
                .map(|m| m.resolve())
                .unwrap_or((0.0, 0.0, 0.0, 0.0));
            est_h(comp, pw, ctx) + m.0 + m.2
        }
        ComponentV3::HorizontalStack(h) => {
            let count = h.content.len().max(1);
            let gap = h.gap.unwrap_or(4.0);
            let cw = (pw - gap * (count - 1) as f32) / count as f32;
            let inner = h
                .content
                .iter()
                .map(|x| est_h_with_margin(x, cw, ctx))
                .fold(0.0, f32::max);
            let m = h
                .margin
                .as_ref()
                .map(|m| m.resolve())
                .unwrap_or((0.0, 0.0, 0.0, 0.0));
            inner + m.0 + m.2
        }
        ComponentV3::FluidLayout(f) => {
            let m = f
                .margin
                .as_ref()
                .map(|m| m.resolve())
                .unwrap_or((0.0, 0.0, 0.0, 0.0));
            let gap = f.gap.unwrap_or(4.0);
            let widths = resolve_fluid(&f.sizes, pw, gap);
            let count = f.content.len().min(widths.len());
            let inner = f
                .content
                .iter()
                .enumerate()
                .map(|(i, x)| est_h_with_margin(x, widths[i.min(widths.len() - 1)], ctx))
                .fold(0.0, f32::max);
            inner + m.0 + m.2
        }
        ComponentV3::Table(t) => {
            let m = t
                .margin
                .as_ref()
                .map(|m| m.resolve())
                .unwrap_or((0.0, 0.0, 0.0, 0.0));
            est_h(comp, pw, ctx) + m.0 + m.2
        }
        ComponentV3::Chart(c) => {
            let m = c
                .margin
                .as_ref()
                .map(|m| m.resolve())
                .unwrap_or((0.0, 0.0, 0.0, 0.0));
            est_h(comp, pw, ctx) + m.0 + m.2
        }
        ComponentV3::ImageBox(_) => est_h(comp, pw, ctx),
        ComponentV3::PriceList(_) => est_h(comp, pw, ctx),
        ComponentV3::TableMultiData(_) => est_h(comp, pw, ctx),
    }
}

fn fill_gradient(
    c: &mut Content,
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    start: [f32; 3],
    end: [f32; 3],
    direction: &str,
) {
    let steps = 64;
    if steps == 0 || w <= 0.0 || h <= 0.0 {
        return;
    }

    for i in 0..steps {
        let t = i as f32 / (steps - 1) as f32;
        let color = [
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t,
            start[2] + (end[2] - start[2]) * t,
        ];
        c.set_fill_rgb(color[0], color[1], color[2]);

        match direction {
            "horizontal" => {
                let step = w / steps as f32;
                let cx = x + i as f32 * step;
                let width = step + 0.6; // overlap to reduce seam lines
                c.rect(cx, y, width.min(w - (cx - x)), h);
            }
            _ => {
                let step = h / steps as f32;
                let cy = y + (steps - 1 - i) as f32 * step;
                let height = step + 0.6;
                c.rect(x, cy - height.min(h - (y + h - cy)), w, height);
            }
        }
        c.fill_nonzero();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

fn text_wrap_lines(text: &str, avail: f32, fs: f32) -> Vec<String> {
    if avail <= 0.0 {
        return text.lines().map(|line| line.to_string()).collect();
    }
    let char_w = fs * 0.55;
    let max_chars = ((avail / char_w).floor() as usize).max(1);
    let mut lines: Vec<String> = Vec::new();

    for paragraph in text.split('\n') {
        if paragraph.is_empty() {
            lines.push(String::new());
            continue;
        }

        let mut current = String::new();
        let mut current_width = 0.0;
        let mut chars_iter = paragraph.chars().peekable();

        while chars_iter.peek().is_some() {
            // Collect a run of spaces (preserving every space)
            let mut spaces = String::new();
            while chars_iter.peek().map(|c| *c == ' ').unwrap_or(false) {
                spaces.push(' ');
                chars_iter.next();
            }

            // Collect a word (non-space chars)
            let mut word = String::new();
            while chars_iter.peek().map(|c| *c != ' ').unwrap_or(false) {
                word.push(chars_iter.next().unwrap());
            }

            // Add the spaces
            if !spaces.is_empty() {
                let space_w = spaces.len() as f32 * char_w;
                if current_width + space_w <= avail {
                    current.push_str(&spaces);
                    current_width += space_w;
                } else if !current.trim_end().is_empty() {
                    lines.push(current.trim_end().to_string());
                    current = String::new();
                    current_width = 0.0;
                }
            }

            // Add the word
            if !word.is_empty() {
                let word_w = word.chars().count() as f32 * char_w;
                if current_width + word_w <= avail {
                    current.push_str(&word);
                    current_width += word_w;
                } else if current.trim_end().is_empty() {
                    // Word alone is too long: hard-break it
                    let mut buf = String::new();
                    for ch in word.chars() {
                        buf.push(ch);
                        if buf.chars().count() >= max_chars {
                            lines.push(buf);
                            buf = String::new();
                        }
                    }
                    if !buf.is_empty() {
                        current = buf;
                        current_width = current.chars().count() as f32 * char_w;
                    }
                } else {
                    lines.push(current.trim_end().to_string());
                    current = word;
                    current_width = word_w;
                }
            }
        }

        if !current.is_empty() {
            lines.push(current);
        }
    }

    if lines.is_empty() {
        lines.push(String::new());
    }
    lines
}

fn emoji_to_icon_name(ch: char) -> Option<&'static str> {
    match ch {
        '📅' => Some("calendar"),
        '🎫' => Some("ticket"),
        '💲' => Some("dollar"),
        '💰' => Some("money"),
        '👛' => Some("wallet"),
        '🎬' => Some("film"),
        '📢' => Some("megaphone"),
        '🏢' => Some("building"),
        _ => None,
    }
}

fn split_line_by_icon_emojis(text: &str) -> Vec<(String, bool)> {
    let icon_chars: [char; 20] = [
        '💰', '🎯', '✅', '📦', '📊', '📉', '📈', '💎', '⭐', '✨', '📄', '🚀', '🔒', '📅', '🎫',
        '💲', '👛', '🎬', '📢', '🏢',
    ];
    // Nomes válidos para a sintaxe /iconname/
    const SLASH_ICONS: [&str; 15] = [
        "calendar", "ticket", "dollar", "money", "wallet",
        "film", "megaphone", "building", "chart", "box", 
        "user", "bag", "pencil", "bottle", "filter",
    ];

    let mut parts: Vec<(String, bool)> = Vec::new();
    let mut current = String::new();
    let chars: Vec<char> = text.chars().collect();
    let mut i = 0;

    while i < chars.len() {
        let ch = chars[i];
        if icon_chars.contains(&ch) {
            if !current.is_empty() {
                parts.push((current.clone(), false));
                current.clear();
            }
            parts.push((ch.to_string(), true));
            i += 1;
        } else if ch == '/' {
            // Tenta ler /iconname/
            let mut j = i + 1;
            let mut name = String::new();
            while j < chars.len() && chars[j] != '/' {
                name.push(chars[j]);
                j += 1;
            }
            if j < chars.len() && SLASH_ICONS.contains(&name.as_str()) {
                // sintaxe /iconname/ válida
                if !current.is_empty() {
                    parts.push((current.clone(), false));
                    current.clear();
                }
                parts.push((name, true));
                i = j + 1; // pula o '/' de fechamento
            } else {
                // não é ícone, trata como texto normal
                current.push(ch);
                i += 1;
            }
        } else {
            current.push(ch);
            i += 1;
        }
    }

    if !current.is_empty() {
        parts.push((current, false));
    }

    if parts.is_empty() {
        parts.push((String::new(), false));
    }

    parts
}

fn render_text(
    c: &mut Content,
    text: &TextComponent,
    ctx: &mut V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
    fi: Name<'static>,
) {
    let m = text
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((0.0, 0.0, 0.0, 0.0));
    let fs = text.font_size.unwrap_or(FONT_SIZE);
    let mb = text.margin_bottom.unwrap_or(0.0);
    let lh = text.line_height.unwrap_or(fs * 1.2);
    *curs -= m.0;
    let raw = interpolate(&text.value, &dctx.variables);
    let cx = ctx.margin + m.3;
    let avail = ctx.content_w - m.1 - m.3;
    let lines = text_wrap_lines(&raw, avail, fs);
    let font = if text.bold.unwrap_or(false) { fb } else { fr };
    let rgb = text
        .color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.0, 0.0, 0.0]);

    let icon_draw_size = fs * 1.0;

    for line in lines.iter() {
        let segments = split_line_by_icon_emojis(line);
        let tw: f32 = segments
            .iter()
            .map(|(seg, is_icon)| {
                if *is_icon {
                    let is_known = if seg.chars().count() == 1 {
                        seg.chars().next().map(|ch| emoji_to_icon_name(ch).is_some()).unwrap_or(false)
                    } else {
                        true // /name/ sempre válido se chegou aqui
                    };
                    if is_known {
                        return icon_draw_size + 3.0;
                    }
                }
                seg.chars().count() as f32 * fs * 0.55
            })
            .sum();
        let mut x = match text.align.as_deref().unwrap_or("left") {
            "center" => cx + (avail - tw) / 2.0,
            "right" => cx + avail - tw - 4.0,
            _ => cx,
        };

        for (segment, is_icon) in segments.iter() {
            if *is_icon {
                // /name/ syntax → segment é direto o nome; emoji → lookup
                let icon_name_opt: Option<&str> = if segment.chars().count() == 1 {
                    segment.chars().next().and_then(emoji_to_icon_name)
                } else {
                    Some(segment.as_str())
                };

                if let Some(icon_name) = icon_name_opt {
                    let icon_y = *curs + fs * 0.65;
                    draw_card_icon(c, icon_name, x, icon_y, icon_draw_size, rgb, fi);
                    x += icon_draw_size + 3.0;
                    continue;
                }
                // fallback: emoji desconhecido
                let enc = to_utf8_winansi(segment, segment.chars().count());
                show_text(c, &enc, fi, fs, x, *curs, rgb);
                x += segment.chars().count() as f32 * fs * 0.55;
            } else {
                let enc = to_utf8_winansi(segment, segment.chars().count());
                show_text(c, &enc, font, fs, x, *curs, rgb);
                x += segment.chars().count() as f32 * fs * 0.55;
            }
        }

        *curs -= lh;
    }

    *curs -= m.2 + mb;
}

fn render_stack(
    c: &mut Content,
    stack: &StackLayoutComponent,
    ctx: &mut V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
    fi: Name<'static>,
    image_map: &HashMap<String, ImageInfo>,
    page_break: &mut dyn FnMut(&mut Content, &mut f32),
) {
    let m = stack
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((0.0, 0.0, 0.0, 0.0));
    let gap = stack.gap.unwrap_or(4.0);
    *curs -= m.0;
    for (i, child) in stack.content.iter().enumerate() {
        render_comp(c, child, ctx, dctx, curs, fr, fb, fi, image_map, page_break);
        if i + 1 < stack.content.len() {
            *curs -= gap;
        }
    }
    *curs -= m.2;
}

fn render_card(
    c: &mut Content,
    card: &CardComponent,
    ctx: &mut V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
    fi: Name<'static>,
    image_map: &HashMap<String, ImageInfo>,
    page_break: &mut dyn FnMut(&mut Content, &mut f32),
) {
    struct CardPreset {
        bg: Option<[f32; 3]>,
        border: Option<[f32; 3]>,
        radius: f32,
        padding: (f32, f32, f32, f32),
        accent: Option<[f32; 3]>,
        accent2: Option<[f32; 3]>,
        style: &'static str,
    }

    let preset = match card.pre_style.as_deref().unwrap_or("") {
        "dashboard" => CardPreset {
            bg: Some([0.98, 1.0, 0.97]),
            border: Some([0.25, 0.90, 0.75]),
            radius: 22.0,
            padding: (16.0, 16.0, 16.0, 16.0),
            accent: Some([0.0, 0.85, 0.65]),
            accent2: Some([0.1, 0.92, 0.80]),
            style: "dashboard",
        },
        "elegant" => CardPreset {
            bg: Some([1.0, 0.99, 0.96]),
            border: Some([0.88, 0.82, 0.72]),
            radius: 24.0,
            padding: (20.0, 20.0, 20.0, 20.0),
            accent: Some([0.95, 0.85, 0.35]),
            accent2: Some([0.25, 0.18, 0.10]),
            style: "elegant",
        },
        "info" => CardPreset {
            bg: Some([0.95, 0.98, 1.0]),
            border: Some([0.25, 0.75, 1.0]),
            radius: 18.0,
            padding: (16.0, 16.0, 16.0, 16.0),
            accent: Some([0.0, 0.60, 1.0]),
            accent2: Some([0.0, 0.45, 0.95]),
            style: "info",
        },
        "premium" => CardPreset {
            bg: Some([1.0, 0.97, 0.98]),
            border: Some([0.85, 0.45, 0.90]),
            radius: 20.0,
            padding: (18.0, 18.0, 18.0, 18.0),
            accent: Some([0.85, 0.20, 0.70]),
            accent2: Some([1.0, 0.40, 0.80]),
            style: "premium",
        },
        _ => CardPreset {
            bg: None,
            border: None,
            radius: 4.0,
            padding: (8.0, 8.0, 8.0, 8.0),
            accent: None,
            accent2: None,
            style: "default",
        },
    };

    let m = card
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((0.0, 0.0, 0.0, 0.0));
    let p = card
        .padding
        .as_ref()
        .map(|p| p.resolve())
        .unwrap_or(preset.padding);
    let rad = card.corner_radius.unwrap_or(preset.radius);
    let cw = resolve_size(&card.width, ctx.content_w);
    let iw = cw - p.1 - p.3;
    let show_top_accent = card.show_top_accent.unwrap_or(true);
    let show_left_accent = card.show_left_accent.unwrap_or(true);
    let default_top_accent_height = match preset.style {
        "dashboard" => 12.0,
        "elegant" => 6.0,
        "info" => 10.0,
        "premium" => 14.0,
        _ => 4.0,
    };
    let top_accent_height = card
        .top_accent_height
        .as_ref()
        .map(|s| resolve_size(&Some(s.clone()), cw))
        .unwrap_or(default_top_accent_height);
    let top_accent_width = card
        .top_accent_width
        .as_ref()
        .map(|s| resolve_size(&Some(s.clone()), cw))
        .unwrap_or(cw);
    let left_accent_width = card
        .left_accent_width
        .as_ref()
        .map(|s| resolve_size(&Some(s.clone()), cw))
        .unwrap_or(4.0);
    let top_accent_radius = card
        .top_accent_radius
        .as_ref()
        .map(|s| resolve_size(&Some(s.clone()), cw))
        .unwrap_or(0.0);
    let left_accent_radius = card
        .left_accent_radius
        .as_ref()
        .map(|s| resolve_size(&Some(s.clone()), cw))
        .unwrap_or(0.0);
    let accent_border_color = card.accent_border_color.as_ref().map(|c| hex_to_rgb(c));
    let accent_border_width = card.accent_border_width.unwrap_or(0.0);
    let ch_est: f32 = card.content.iter().map(|x| est_h(x, iw, dctx)).sum::<f32>()
        + card.content.len().saturating_sub(1) as f32 * 3.0;
    let left_accent_height = card
        .left_accent_height
        .as_ref()
        .map(|s| resolve_size(&Some(s.clone()), ch_est + p.0 + p.2))
        .unwrap_or((ch_est + p.0 + p.2 - 8.0).max(0.0))
        .max(0.0);
    let ch = match &card.height {
        Some(V3Size::Pixels(v)) => v.max(ch_est + p.0 + p.2),
        _ => ch_est + p.0 + p.2,
    };
    *curs -= m.0;
    let cx = ctx.margin + m.3;
    let bg_color = card
        .background_color
        .as_ref()
        .map(|c| hex_to_rgb(c))
        .or(preset.bg);
    let border_color = card
        .border_color
        .as_ref()
        .map(|c| hex_to_rgb(c))
        .or(preset.border);
    let draw_bg = bg_color.is_some();
    let draw_border = border_color.is_some();

    if draw_bg {
        let rgb = bg_color.unwrap();

        // sombra suave
        c.set_fill_rgb(0.88, 0.90, 0.95);
        rounded_rect(c, cx + 4.0, *curs - ch - 4.0, cw, ch, rad);
        c.fill_nonzero();

        if let Some(brgb) = border_color {
            c.set_fill_rgb(brgb[0], brgb[1], brgb[2]);
            rounded_rect(c, cx - 0.5, *curs - ch - 0.5, cw + 1.0, ch + 1.0, rad + 0.5);
            c.fill_nonzero();
        }

        c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
        rounded_rect(c, cx, *curs - ch, cw, ch, rad);
        c.fill_nonzero();

        if let Some(accent) = preset.accent {
            match preset.style {
                "dashboard" => {
                    if show_top_accent {
                        let bar_x = cx;
                        let bar_y = *curs - top_accent_height;
                        let bar_w = top_accent_width.min(cw);
                        let bar_h = top_accent_height;
                        let bar_radius = bar_h.min(rad);
                        let top_radius = if top_accent_radius > 0.0 {
                            top_accent_radius.min(bar_h).min(rad)
                        } else {
                            bar_radius
                        };

                        c.set_fill_rgb(accent[0], accent[1], accent[2]);
                        rounded_rect(c, bar_x, bar_y, bar_w, bar_h, top_radius);
                        c.fill_nonzero();

                        if let Some(accent2) = preset.accent2 {
                            let inner_w = (bar_w - top_radius * 2.0).max(0.0);
                            fill_gradient(
                                c,
                                bar_x + top_radius,
                                bar_y,
                                inner_w,
                                bar_h,
                                accent,
                                accent2,
                                "horizontal",
                            );
                        }
                    }

                    if show_left_accent {
                        let inner_margin = 4.0;
                        let stripe_offset = if show_top_accent {
                            top_accent_height + inner_margin
                        } else {
                            inner_margin
                        };
                        let inner_h = ch - stripe_offset - inner_margin;
                        let stripe_h = left_accent_height;
                        let stripe_y = *curs - ch + inner_margin + (inner_h - stripe_h) / 2.0;
                        let accent_radius = if left_accent_radius > 0.0 {
                            left_accent_radius.min(left_accent_width).min(stripe_h)
                        } else {
                            3.0
                        };
                        let stripe_color = preset.accent2.unwrap_or(accent);

                        c.set_fill_rgb(stripe_color[0], stripe_color[1], stripe_color[2]);
                        rounded_rect(
                            c,
                            cx + 4.0,
                            stripe_y,
                            left_accent_width,
                            stripe_h,
                            accent_radius,
                        );
                        c.fill_nonzero();
                        if accent_border_width > 0.0 {
                            if let Some(border_color) = accent_border_color {
                                c.set_line_width(accent_border_width);
                                c.set_stroke_rgb(border_color[0], border_color[1], border_color[2]);
                                rounded_rect(
                                    c,
                                    cx + 4.0,
                                    stripe_y,
                                    left_accent_width,
                                    stripe_h,
                                    accent_radius,
                                );
                                c.stroke();
                            }
                        }
                    }
                }
                "elegant" => {
                    if show_top_accent {
                        let bar_x = cx;
                        let bar_y = *curs - top_accent_height;
                        let bar_w = top_accent_width.min(cw);
                        let bar_h = top_accent_height;
                        let bar_radius = bar_h.min(rad);
                        let top_radius = if top_accent_radius > 0.0 {
                            top_accent_radius.min(bar_h).min(rad)
                        } else {
                            bar_radius
                        };

                        c.set_fill_rgb(accent[0], accent[1], accent[2]);
                        rounded_rect(c, bar_x, bar_y, bar_w, bar_h, top_radius);
                        c.fill_nonzero();

                        if let Some(accent2) = preset.accent2 {
                            let inner_w = (bar_w - top_radius * 2.0).max(0.0);
                            fill_gradient(
                                c,
                                bar_x + top_radius,
                                bar_y,
                                inner_w,
                                bar_h,
                                accent,
                                accent2,
                                "horizontal",
                            );
                        }
                    }

                    if show_left_accent {
                        let inner_margin = 4.0;
                        let stripe_offset = if show_top_accent {
                            top_accent_height + inner_margin
                        } else {
                            inner_margin
                        };
                        let inner_h = ch - stripe_offset - inner_margin;
                        let stripe_h = left_accent_height;
                        let stripe_y = *curs - ch + inner_margin + (inner_h - stripe_h) / 2.0;
                        let accent_radius = if left_accent_radius > 0.0 {
                            left_accent_radius.min(left_accent_width).min(stripe_h)
                        } else {
                            2.0
                        };
                        let stripe_color = preset.accent2.unwrap_or(accent);

                        c.set_fill_rgb(stripe_color[0], stripe_color[1], stripe_color[2]);
                        rounded_rect(
                            c,
                            cx + 4.0,
                            stripe_y,
                            left_accent_width,
                            stripe_h,
                            accent_radius,
                        );
                        c.fill_nonzero();
                        if accent_border_width > 0.0 {
                            if let Some(border_color) = accent_border_color {
                                c.set_line_width(accent_border_width);
                                c.set_stroke_rgb(border_color[0], border_color[1], border_color[2]);
                                rounded_rect(
                                    c,
                                    cx + 4.0,
                                    stripe_y,
                                    left_accent_width,
                                    stripe_h,
                                    accent_radius,
                                );
                                c.stroke();
                            }
                        }
                    }
                }
                "info" => {
                    if show_top_accent {
                        let bar_x = cx;
                        let bar_y = *curs - top_accent_height;
                        let bar_w = top_accent_width.min(cw);
                        let bar_h = top_accent_height;
                        let bar_radius = bar_h.min(rad);
                        let top_radius = if top_accent_radius > 0.0 {
                            top_accent_radius.min(bar_h).min(rad)
                        } else {
                            bar_radius
                        };

                        c.set_fill_rgb(accent[0], accent[1], accent[2]);
                        rounded_rect(c, bar_x, bar_y, bar_w, bar_h, top_radius);
                        c.fill_nonzero();
                        if let Some(accent2) = preset.accent2 {
                            let inner_w = (bar_w - top_radius * 2.0).max(0.0);
                            fill_gradient(
                                c,
                                bar_x + top_radius,
                                bar_y,
                                inner_w,
                                bar_h,
                                accent,
                                accent2,
                                "horizontal",
                            );
                        }
                    }

                    if show_left_accent {
                        let inner_margin = 4.0;
                        let stripe_offset = if show_top_accent {
                            top_accent_height + inner_margin
                        } else {
                            inner_margin
                        };
                        let inner_h = ch - stripe_offset - inner_margin;
                        let stripe_h = left_accent_height;
                        let stripe_y = *curs - ch + inner_margin + (inner_h - stripe_h) / 2.0;
                        let accent_radius = if left_accent_radius > 0.0 {
                            left_accent_radius.min(left_accent_width).min(stripe_h)
                        } else {
                            2.5
                        };
                        let stripe_color = preset.accent2.unwrap_or(accent);

                        c.set_fill_rgb(stripe_color[0], stripe_color[1], stripe_color[2]);
                        rounded_rect(
                            c,
                            cx + 4.0,
                            stripe_y,
                            left_accent_width,
                            stripe_h,
                            accent_radius,
                        );
                        c.fill_nonzero();
                        if accent_border_width > 0.0 {
                            if let Some(border_color) = accent_border_color {
                                c.set_line_width(accent_border_width);
                                c.set_stroke_rgb(border_color[0], border_color[1], border_color[2]);
                                rounded_rect(
                                    c,
                                    cx + 4.0,
                                    stripe_y,
                                    left_accent_width,
                                    stripe_h,
                                    accent_radius,
                                );
                                c.stroke();
                            }
                        }
                    }
                }
                "premium" => {
                    if show_left_accent {
                        let stripe_x = cx;
                        let inner_margin = 4.0;
                        let stripe_offset = if show_top_accent {
                            top_accent_height + inner_margin
                        } else {
                            inner_margin
                        };
                        let stripe_w = left_accent_width.min(cw);
                        let stripe_h = left_accent_height;
                        let inner_h = ch - stripe_offset - inner_margin;
                        let stripe_y = *curs - ch + inner_margin + (inner_h - stripe_h) / 2.0;
                        let stripe_radius = if left_accent_radius > 0.0 {
                            left_accent_radius.min(left_accent_width).min(stripe_h)
                        } else {
                            left_accent_width.min(4.0)
                        };

                        c.set_fill_rgb(accent[0], accent[1], accent[2]);
                        rounded_rect_left(c, stripe_x, stripe_y, stripe_w, stripe_h, stripe_radius);
                        c.fill_nonzero();
                        if accent_border_width > 0.0 {
                            if let Some(border_color) = accent_border_color {
                                c.set_line_width(accent_border_width);
                                c.set_stroke_rgb(border_color[0], border_color[1], border_color[2]);
                                rounded_rect_left(
                                    c,
                                    stripe_x,
                                    stripe_y,
                                    stripe_w,
                                    stripe_h,
                                    stripe_radius,
                                );
                                c.stroke();
                            }
                        }
                    }
                }
                _ => {
                    c.set_fill_rgb(accent[0], accent[1], accent[2]);
                    rounded_rect(c, cx, *curs - 4.0, cw, 4.0, 2.0);
                    c.fill_nonzero();
                }
            }
        }
    } else if let Some(brgb) = border_color {
        c.set_fill_rgb(1.0, 1.0, 1.0);
        rounded_rect(c, cx, *curs - ch, cw, ch, rad);
        c.fill_nonzero();
        c.set_stroke_rgb(brgb[0], brgb[1], brgb[2]);
        c.set_line_width(0.8);
        rounded_rect(c, cx, *curs - ch, cw, ch, rad);
        c.stroke();
    }
    *curs -= p.0;

    if let Some(ref icon) = &card.icon {
        let icon_size = 14.0;
        let icon_x = cx + p.3 + 6.0;
        let icon_y = *curs;
        let icon_rgb = card
            .icon_color
            .as_deref()
            .map(hex_to_rgb)
            .unwrap_or([0.16, 0.22, 0.35]);
        draw_card_icon(
            c,
            icon.as_str(),
            icon_x,
            icon_y,
            icon_size,
            icon_rgb,
            fi,
        );
    }

    *curs -= 2.0; // gap após top padding

    // Salvar e modificar contexto para aplicar padding do card
    let orig_margin = ctx.margin;
    let orig_content_w = ctx.content_w;
    ctx.margin = cx + p.3;
    ctx.content_w = iw;

    for child in &card.content {
        render_comp(c, child, ctx, dctx, curs, fr, fb, fi, image_map, page_break);
    }

    // Restaurar contexto
    ctx.margin = orig_margin;
    ctx.content_w = orig_content_w;

    *curs -= 2.0; // gap antes do bottom padding
    *curs -= p.2 + m.2;
}

fn render_hstack(
    c: &mut Content,
    h: &HorizontalStackComponent,
    ctx: &mut V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
    fi: Name<'static>,
    image_map: &HashMap<String, ImageInfo>,
    page_break: &mut dyn FnMut(&mut Content, &mut f32),
) {
    let m = h
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((0.0, 0.0, 0.0, 0.0));
    let gap = h.gap.unwrap_or(4.0);
    let iw = ctx.content_w - m.1 - m.3;
    let count = h.content.len().max(1);

    // Calcula larguras por flex (se todos forem 1, divide igual)
    let total_flex: f32 = h
        .content
        .iter()
        .map(|x| match x {
            ComponentV3::Card(c) => c.flex.unwrap_or(1.0),
            _ => 1.0,
        })
        .sum();
    let total_gaps = gap * (count - 1) as f32;
    let col_widths: Vec<f32> = h
        .content
        .iter()
        .map(|x| {
            let f = match x {
                ComponentV3::Card(c) => c.flex.unwrap_or(1.0),
                _ => 1.0,
            };
            ((iw - total_gaps) * f / total_flex).max(50.0)
        })
        .collect();

    let max_h: f32 = h
        .content
        .iter()
        .enumerate()
        .map(|(i, x)| est_h(x, col_widths[i], dctx))
        .fold(0.0, f32::max);
    *curs -= m.0;
    let sy = *curs;
    let sx = ctx.margin + m.3;
    let mut cx = sx;
    for (i, child) in h.content.iter().enumerate() {
        *curs = sy;
        let saved_margin = ctx.margin;
        let saved_content_w = ctx.content_w;
        ctx.margin = cx;
        ctx.content_w = col_widths[i];
        render_comp(c, child, ctx, dctx, curs, fr, fb, fi, image_map, page_break);
        ctx.margin = saved_margin;
        ctx.content_w = saved_content_w;
        cx += col_widths[i] + gap;
    }
    *curs = sy - max_h - m.2;
}

fn render_fluid(
    c: &mut Content,
    f: &FluidLayoutComponent,
    ctx: &mut V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
    fi: Name<'static>,
    image_map: &HashMap<String, ImageInfo>,
    page_break: &mut dyn FnMut(&mut Content, &mut f32),
) {
    let m = f
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((0.0, 0.0, 0.0, 0.0));
    let gap = f.gap.unwrap_or(4.0);
    let iw = ctx.content_w - m.1 - m.3;
    let widths = resolve_fluid(&f.sizes, iw, gap);
    let count = f.content.len().min(widths.len());
    if count == 0 {
        return;
    }
    let max_h: f32 = f
        .content
        .iter()
        .enumerate()
        .map(|(i, x)| est_h(x, widths[i.min(widths.len() - 1)], dctx))
        .fold(0.0, f32::max);
    *curs -= m.0;
    let sy = *curs;
    let sx = ctx.margin + m.3;
    let saved_margin = ctx.margin;
    let saved_content_w = ctx.content_w;
    for i in 0..count {
        *curs = sy;
        ctx.margin = sx + widths[..i].iter().sum::<f32>() + i as f32 * gap;
        ctx.content_w = widths[i];
        render_comp(
            c,
            &f.content[i],
            ctx,
            dctx,
            curs,
            fr,
            fb,
            fi,
            image_map,
            page_break,
        );
    }
    ctx.margin = saved_margin;
    ctx.content_w = saved_content_w;
    *curs = sy - max_h - m.2;
}

fn render_table(
    c: &mut Content,
    table: &TableComponent,
    ctx: &mut V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
    page_break: &mut dyn FnMut(&mut Content, &mut f32),
) {
    // ============================================================
    // DEBUG: VERSÃO CORRIGIDA - BUILD: 2026-04-25 14:30
    // FIX: Quebra de página preserva linhas restantes
    // ============================================================
    let m = table
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((4.0, 0.0, 4.0, 0.0));
    let iw = ctx.content_w - m.1 - m.3;
    let raw_rows = match dctx.datasets.get(&table.dataset_name) {
        Some(d) => d,
        None => return,
    };
    // Agrega as linhas da tabela inteira se configurado
    let aggregated_table_owned: Vec<HashMap<String, serde_json::Value>>;
    let rows: &[HashMap<String, serde_json::Value>] = if let (Some(agg_keys), Some(sum_keys)) =
        (table.aggregate.as_ref(), table.aggregate_sum.as_ref())
    {
        let refs: Vec<&HashMap<_, _>> = raw_rows.iter().collect();
        aggregated_table_owned = aggregate_rows(&refs, agg_keys, sum_keys);
        &aggregated_table_owned
    } else {
        aggregated_table_owned = Vec::new();
        raw_rows.as_slice()
    };
    let row_expansion = table.row_expansion.as_ref();
    let cc = table.table_header.len().min(table.widths.len());
    if cc == 0 {
        return;
    }
    let cw = resolve_twidths(&table.widths, iw, cc);
    let fs = 9.0;
    let rh = fs * 1.6 + 5.0;
    let hh = fs * 1.8 + 6.0;
    let al: Vec<&str> = table
        .table_header
        .iter()
        .map(|h| h.align.as_deref().unwrap_or("left"))
        .collect();

    let tx = ctx.margin + m.3;
    let page_bottom = ctx.bottom_reserved;
    let has_grand_total = table.grand_total.unwrap_or(false);
    let header_bg = table
        .header_background_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.15, 0.22, 0.37]);
    let header_text = table
        .header_text_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([1.0, 1.0, 1.0]);
    let body_text = table
        .text_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.20, 0.22, 0.26]);
    let zebra_text = table
        .zebra_text_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or(body_text);
    let zebra_bg = table
        .zebra_background_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.96, 0.97, 0.99]);
    let border_color = table
        .border_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.25, 0.32, 0.47]);
    let border_width = table.border_width.unwrap_or(0.3);
    let border_style = table.border_style.as_deref().unwrap_or("none");
    let draw_borders = border_style != "none" && border_width > 0.0;

    // Aplica margem superior da tabela
    *curs -= m.0;

    if let Some(ref pre) = table.pre_header {
        let pm = pre
            .margin
            .as_ref()
            .map(|m| m.resolve())
            .unwrap_or((0.0, 0.0, 0.0, 0.0));
        *curs -= pm.0;
        let pfs = pre.font_size.unwrap_or(12.0);
        let prh = pfs * 1.5 + 4.0;
        let mut value = pre.variable.clone().replace('{', "").replace('}', "");
        if value.starts_with('$') {
            let key = value.trim_start_matches('$');
            if key == "pages" {
                value = PAGE_COUNT_PLACEHOLDER.to_string();
            } else if let Some(v) = dctx.variables.get(key) {
                value = v.clone();
            }
        } else if let Some(v) = dctx.variables.get(&value) {
            value = v.clone();
        }
        if let Some(ref mask) = pre.mask {
            value = format_mask(&serde_json::Value::String(value.clone()), Some(mask));
        }
        if let Some(ref bg) = pre.background_color {
            let rgb = hex_to_rgb(bg);
            c.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
            c.rect(tx, *curs - prh, iw, prh);
            c.fill_nonzero();
        }
        let color = pre
            .color
            .as_deref()
            .map(hex_to_rgb)
            .unwrap_or([0.12, 0.12, 0.12]);
        let align = pre.align.as_deref().unwrap_or("left");
        let enc = to_utf8_winansi(&value, value.len());
        let tw = enc.len() as f32 * pfs * 0.55;
        let dx = match align {
            "center" => tx + (iw - tw) / 2.0,
            "right" => tx + iw - tw - 4.0,
            _ => tx,
        };
        show_text(c, &enc, fb, pfs, dx, *curs - prh / 2.0 - pfs / 3.0, color);
        *curs -= prh + pm.2;
    }

    // ============================================================
    // DEBUG TEXT - Mostra a versão no PDF
    // ============================================================
    let debug_text = ""; //format!("[v3.1-fixed] 2026-04-25 14:30:00 - linhas: {}", rows.len());
    let debug_enc = to_utf8_winansi(&debug_text, debug_text.len());
    show_text(c, &debug_enc, fb, 6.0, tx, *curs + 4.0, [0.8, 0.2, 0.2]);
    *curs -= 12.0;
    // ============================================================

    // Helper para renderizar cabeçalho
    let render_header = |c: &mut Content, y: f32| {
        c.set_fill_rgb(header_bg[0], header_bg[1], header_bg[2]);
        c.rect(tx, y - hh, iw, hh);
        c.fill_nonzero();
        let mut hx = tx;
        for (ci, hdr) in table.table_header.iter().enumerate().take(cc) {
            let lbl = hdr.prefix.as_deref().unwrap_or(&hdr.key);
            let enc = to_utf8_winansi(lbl, lbl.len());
            let al2 = al[ci];
            let tw = enc.len() as f32 * fs * 0.55;
            let dx = match al2 {
                "center" => hx + (cw[ci] - tw) / 2.0,
                "right" => hx + cw[ci] - tw - 5.0,
                _ => hx + 5.0,
            };
            show_text(c, &enc, fb, fs, dx, y - hh / 2.0 - fs / 3.0, header_text);
            if draw_borders {
                c.set_stroke_rgb(border_color[0], border_color[1], border_color[2]);
                c.set_line_width(border_width);
                c.move_to(hx + cw[ci], y);
                c.line_to(hx + cw[ci], y - hh);
                c.stroke();
            }
            hx += cw[ci];
        }
        if draw_borders {
            c.set_stroke_rgb(border_color[0], border_color[1], border_color[2]);
            c.set_line_width(border_width);
            c.move_to(tx, y - hh);
            c.line_to(tx + iw, y - hh);
            c.stroke();
        }
    };

    // Verifica se cabe o cabeçalho
    if *curs - hh < page_bottom + 20.0 {
        page_break(c, curs);
    }

    // Renderiza cabeçalho
    render_header(c, *curs);
    *curs -= hh;

    let page_bottom = ctx.bottom_reserved;
    if let Some(ref grouping) = table.grouping {
        let groups = group_rows(&rows, &grouping.group_by);
        let mut row_idx = 0;

        for (gi, (key, grp)) in groups.iter().enumerate() {
            // Agrega as linhas do grupo se configurado
            let aggregated_owned: Vec<HashMap<String, serde_json::Value>>;
            let grp_rows: Vec<&HashMap<String, serde_json::Value>> =
                if let (Some(agg_keys), Some(sum_keys)) =
                    (grouping.aggregate.as_ref(), grouping.aggregate_sum.as_ref())
                {
                    aggregated_owned = aggregate_rows(grp, agg_keys, sum_keys);
                    aggregated_owned.iter().collect()
                } else {
                    aggregated_owned = Vec::new();
                    grp.iter().copied().collect()
                };
            let grp = &grp_rows;

            let mut render_group_header = false;
            let mut current_sub_group_key: Option<String> = None;
            if !grp.is_empty() {
                if *curs - 16.0 < page_bottom + 10.0 {
                    page_break(c, curs);
                    render_header(c, *curs);
                    *curs -= hh;
                }
                render_group_header = true;
            }

            for row in grp.iter() {
                if *curs - rh < page_bottom + 15.0 {
                    page_break(c, curs);
                    render_header(c, *curs);
                    *curs -= hh;
                    render_group_header = true;
                    current_sub_group_key = None; // força re-render do sub-grupo na nova página
                }

                if render_group_header {
                    let formatted_key = format_value_with_mask(&key, grouping.group_header_mask.as_deref());
                    let group_title = if let Some(ref template) = grouping.group_header {
                        interpolate(template, &dctx.variables)
                            .replace("{group}", &formatted_key)
                            .replace("{key}", &formatted_key)
                    } else if let Some(ref prefix) = grouping.prefix {
                        format!("{}{}", prefix, formatted_key)
                    } else {
                        formatted_key
                    };

                    let group_header_bg = grouping
                        .group_header_background_color
                        .as_deref()
                        .map(hex_to_rgb)
                        .unwrap_or([0.90, 0.93, 0.97]);
                    let group_header_text = grouping
                        .group_header_text_color
                        .as_deref()
                        .map(hex_to_rgb)
                        .unwrap_or([0.15, 0.22, 0.37]);
                    let group_header_border_color = grouping
                        .group_header_border_color
                        .as_deref()
                        .map(hex_to_rgb)
                        .unwrap_or([0.70, 0.75, 0.82]);
                    let group_header_border_width =
                        grouping.group_header_border_width.unwrap_or(0.5);
                    let group_header_border_style = grouping
                        .group_header_border_style
                        .as_deref()
                        .unwrap_or("solid");
                    let draw_group_header_border =
                        group_header_border_style != "none" && group_header_border_width > 0.0;
                    let gh = 16.0;

                    *curs -= gh;
                    c.set_fill_rgb(group_header_bg[0], group_header_bg[1], group_header_bg[2]);
                    c.rect(tx, *curs, iw, gh);
                    c.fill_nonzero();
                    let enc = to_utf8_winansi(&group_title, group_title.len());
                    let text_y = *curs + gh / 2.0 - 9.0 / 3.0;
                    show_text(c, &enc, fb, 9.0, tx + 5.0, text_y, group_header_text);
                    if draw_group_header_border {
                        c.set_stroke_rgb(
                            group_header_border_color[0],
                            group_header_border_color[1],
                            group_header_border_color[2],
                        );
                        c.set_line_width(group_header_border_width);
                        c.rect(tx, *curs, iw, gh);
                        c.stroke();
                    }
                    render_group_header = false;
                }

                // ── Sub-group header ──────────────────────────────────────────
                if let Some(ref sgb) = grouping.sub_group_by {
                    let sg_val = row
                        .get(sgb)
                        .map(|v| match v {
                            serde_json::Value::String(s) => s.clone(),
                            _ => v.to_string(),
                        })
                        .unwrap_or_default();

                    if current_sub_group_key.as_deref() != Some(sg_val.as_str()) {
                        current_sub_group_key = Some(sg_val.clone());

                        if *curs - 14.0 < page_bottom + 10.0 {
                            page_break(c, curs);
                            render_header(c, *curs);
                            *curs -= hh;
                        }

                        let sg_title = if let Some(ref prefix) = grouping.sub_group_prefix {
                            format!("{}{}", prefix, sg_val)
                        } else {
                            sg_val.clone()
                        };

                        let sgh = 14.0;
                        let indent = 12.0_f32;
                        *curs -= sgh;
                        c.set_fill_rgb(0.94, 0.96, 0.99);
                        c.rect(tx + indent, *curs, iw - indent, sgh);
                        c.fill_nonzero();
                        let enc = to_utf8_winansi(&sg_title, sg_title.len());
                        let text_y = *curs + sgh / 2.0 - 8.0 / 3.0;
                        show_text(c, &enc, fb, 8.0, tx + indent + 5.0, text_y, [0.20, 0.32, 0.52]);
                        c.set_stroke_rgb(0.78, 0.84, 0.92);
                        c.set_line_width(0.3);
                        c.rect(tx + indent, *curs, iw - indent, sgh);
                        c.stroke();
                    }
                }
                // ─────────────────────────────────────────────────────────────

                let ry = *curs;
                let alt = (row_idx % 2) == 0;
                if alt {
                    c.set_fill_rgb(zebra_bg[0], zebra_bg[1], zebra_bg[2]);
                } else {
                    c.set_fill_rgb(1.0, 1.0, 1.0);
                }
                c.rect(tx, ry - rh, iw, rh);
                c.fill_nonzero();

                let mut hx = tx;
                for ci in 0..cc {
                    let hdr = &table.table_header[ci];
                    let val = row
                        .get(&hdr.key)
                        .map(|v| format_mask(v, hdr.mask.as_deref()))
                        .unwrap_or_default();
                    if hdr.pill {
                        let matched_case = hdr
                            .pill_cases
                            .as_ref()
                            .and_then(|cases| cases.iter().find(|pc| pc.case == val));
                        let pill_bg = matched_case
                            .map(|pc| hex_to_rgb(&pc.color))
                            .unwrap_or([0.45, 0.50, 0.58]);
                        let pill_label = matched_case
                            .and_then(|pc| pc.transform.as_deref())
                            .unwrap_or(&val);
                        draw_pill(c, pill_label, hx, cw[ci], ry, rh, al[ci], hdr.pill_width, pill_bg, fb, fs);
                    } else {
                        let enc = to_utf8_winansi(&val, val.len());
                        let al2 = al[ci];
                        let tw = enc.len() as f32 * fs * 0.55;
                        let dx = match al2 {
                            "center" => hx + (cw[ci] - tw) / 2.0,
                            "right" => hx + cw[ci] - tw - 5.0,
                            _ => hx + 5.0,
                        };
                        show_text(
                            c,
                            &enc,
                            fr,
                            fs,
                            dx,
                            ry - rh / 2.0 - fs / 3.0,
                            if alt { zebra_text } else { body_text },
                        );
                    }
                    c.set_stroke_rgb(0.88, 0.90, 0.93);
                    c.set_line_width(0.3);
                    c.move_to(hx + cw[ci], ry);
                    c.line_to(hx + cw[ci], ry - rh);
                    c.stroke();
                    hx += cw[ci];
                }

                if draw_borders {
                    c.set_stroke_rgb(border_color[0], border_color[1], border_color[2]);
                    c.set_line_width(border_width);
                    c.move_to(tx, ry - rh);
                    c.line_to(tx + iw, ry - rh);
                    c.stroke();
                }
                *curs -= rh;
                row_idx += 1;
                let rendered_items = if let Some(expansion) = row_expansion {
                    render_child_section(
                        c,
                        row,
                        expansion,
                        table,
                        dctx,
                        ctx,
                        curs,
                        fr,
                        fb,
                        page_break,
                        tx,
                        iw,
                        fs,
                        hh,
                        &render_header,
                    )
                } else {
                    false
                };
                let more_content = row_idx < grp.len();
                if rendered_items && more_content {
                    if *curs - hh < page_bottom + 20.0 {
                        page_break(c, curs);
                    }
                    render_header(c, *curs);
                    *curs -= hh;
                }
            }

            if grouping.subtotal.unwrap_or(false) && !grp.is_empty() {
                if *curs - (rh + 2.0) < page_bottom + 15.0 {
                    page_break(c, curs);
                    render_header(c, *curs);
                    *curs -= hh;
                }

                *curs -= 2.0;
                let sy = *curs;
                c.set_fill_rgb(0.85, 0.88, 0.92);
                c.rect(tx, sy - rh, iw, rh);
                c.fill_nonzero();
                c.set_stroke_rgb(0.75, 0.78, 0.82);
                c.set_line_width(2.0);
                c.set_dash_pattern(vec![3.0, 2.0], 0.0);
                c.move_to(tx, sy);
                c.line_to(tx + iw, sy);
                c.stroke();
                c.set_dash_pattern(vec![], 0.0);

                let mut hx = tx;
                for ci in 0..cc {
                    let val = if ci == 0 {
                        "Subtotal".to_string()
                    } else {
                        let k = &table.table_header[ci].key;
                        let hdr = &table.table_header[ci];
                        if !hdr.sum {
                            String::new()
                        } else {
                            let t: f64 = grp
                                .iter()
                                .filter_map(|r| r.get(k))
                                .filter_map(|v| v.as_f64())
                                .sum();
                            format_numeric_value(t, hdr.mask.as_deref())
                        }
                    };
                    let enc = to_utf8_winansi(&val, val.len());
                    let al2 = al[ci];
                    let tw = enc.len() as f32 * fs * 0.55;
                    let dx = match al2 {
                        "center" => hx + (cw[ci] - tw) / 2.0,
                        "right" => hx + cw[ci] - tw - 5.0,
                        _ => hx + 5.0,
                    };
                    show_text(
                        c,
                        &enc,
                        fb,
                        fs,
                        dx,
                        sy - rh / 2.0 - fs / 3.0,
                        [0.15, 0.18, 0.22],
                    );
                    hx += cw[ci];
                }

                c.set_stroke_rgb(0.65, 0.70, 0.78);
                c.set_line_width(0.8);
                c.move_to(tx, sy);
                c.line_to(tx + iw, sy);
                c.stroke();
                *curs -= rh;
            }

            // summaryBox por grupo (usa grouping.summary_box, NÃO table.summary_box)
            if let Some(sb) = grouping.summary_box.as_ref() {
                if !grp.is_empty() && !sb.rows.is_empty() {
                    let line_h = fs * 2.2;
                    let pad_x = 14.0_f32;
                    let pad_y = 10.0_f32;
                    let box_w = sb.width.unwrap_or(200.0_f32).min(iw);
                    let box_h = sb.rows.len() as f32 * line_h + pad_y * 2.0;
                    let gap_top = 8.0_f32;

                    *curs -= gap_top;

                    if *curs - box_h < page_bottom + 15.0 {
                        page_break(c, curs);
                        *curs -= gap_top;
                    }

                    let box_x = match sb.align.as_deref().unwrap_or("center") {
                        "left" => tx,
                        "right" => tx + iw - box_w,
                        _ => tx + (iw - box_w) / 2.0,
                    };
                    let box_y = *curs - box_h;

                    c.set_fill_rgb(1.0, 1.0, 1.0);
                    c.rect(box_x, box_y, box_w, box_h);
                    c.fill_nonzero();

                    c.set_stroke_rgb(0.20, 0.22, 0.28);
                    c.set_line_width(0.7);
                    c.rect(box_x, box_y, box_w, box_h);
                    c.stroke();

                    let mut ry = *curs - pad_y - line_h * 0.25;

                    for sbr in &sb.rows {
                        if sbr.divider_before.unwrap_or(false) {
                            let div_y = ry + line_h * 0.55;
                            c.set_stroke_rgb(0.35, 0.38, 0.44);
                            c.set_line_width(0.6);
                            c.set_dash_pattern(vec![3.0, 2.0], 0.0);
                            c.move_to(box_x + pad_x, div_y);
                            c.line_to(box_x + box_w - pad_x, div_y);
                            c.stroke();
                            c.set_dash_pattern(vec![], 0.0);
                            ry -= 2.0;
                        }

                        let val_str = if let Some(v) = sbr.value.as_deref() {
                            let interpolated = interpolate(v, &dctx.variables);
                            format_value_with_mask(&interpolated, sbr.mask.as_deref())
                        } else if let Some(key) = sbr.key.as_deref() {
                            let t: f64 = grp
                                .iter()
                                .filter_map(|r| r.get(key))
                                .filter_map(|v| v.as_f64())
                                .sum();
                            format_numeric_value(t, sbr.mask.as_deref())
                        } else {
                            String::new()
                        };

                        let font = if sbr.bold.unwrap_or(false) { fb } else { fr };
                        let color = if sbr.bold.unwrap_or(false) {
                            [0.08_f32, 0.12, 0.20]
                        } else {
                            [0.20, 0.24, 0.30]
                        };

                        let label_enc = to_utf8_winansi(&sbr.label, sbr.label.len());
                        show_text(c, &label_enc, font, fs, box_x + pad_x, ry, color);

                        let val_enc = to_utf8_winansi(&val_str, val_str.len());
                        let val_tw = val_str.len() as f32 * fs * 0.55;
                        show_text(
                            c,
                            &val_enc,
                            font,
                            fs,
                            box_x + box_w - val_tw - pad_x,
                            ry,
                            color,
                        );

                        ry -= line_h;
                    }

                    *curs -= box_h + gap_top;
                }
            }

            if gi + 1 < groups.len() {
                if let Some(gap) = grouping.gap {
                    if gap > 0.0 {
                        if *curs - gap < page_bottom + 15.0 {
                            page_break(c, curs);
                            render_header(c, *curs);
                            *curs -= hh;
                        } else {
                            *curs -= gap;
                        }
                    }
                }
            }
        }

        if has_grand_total && !rows.is_empty() {
            let gh = rh * 1.8;
            if *curs - (gh + 4.0) < page_bottom + 15.0 {
                page_break(c, curs);
                render_header(c, *curs);
                *curs -= hh;
            }

            let top = *curs;
            let bottom = top - gh;
            c.set_stroke_rgb(0.75, 0.78, 0.82);
            c.set_line_width(2.0);
            c.set_dash_pattern(vec![3.0, 2.0], 0.0);
            c.move_to(tx, top);
            c.line_to(tx + iw, top);
            c.stroke();
            c.set_dash_pattern(vec![], 0.0);
            let title_fs = fs * 1.05;
            let value_fs = fs * 1.2;

            let mut summary_columns = Vec::new();
            let mut x = tx;
            for ci in 0..cc {
                let hdr = &table.table_header[ci];
                if hdr.sum {
                    summary_columns.push((ci, x, cw[ci]));
                }
                x += cw[ci];
            }

            if !summary_columns.is_empty() {
                let block_left = summary_columns.first().unwrap().1;
                let block_right =
                    summary_columns.last().unwrap().1 + summary_columns.last().unwrap().2;
                let block_width = block_right - block_left;

                for (ci, cell_x, cell_w) in &summary_columns {
                    let hdr = &table.table_header[*ci];
                    let label = hdr.prefix.as_deref().unwrap_or(&hdr.key);
                    let total_value = {
                        let t: f64 = rows
                            .iter()
                            .filter_map(|r| r.get(&hdr.key))
                            .filter_map(|v| v.as_f64())
                            .sum();
                        format_numeric_value(t, hdr.mask.as_deref())
                    };

                    let al2 = al[*ci];
                    let label_enc = to_utf8_winansi(label, label.len());
                    let label_tw = label.len() as f32 * title_fs * 0.55;
                    let label_x = match al2 {
                        "center" => cell_x + (cell_w - label_tw) / 2.0,
                        "right" => cell_x + cell_w - label_tw - 5.0,
                        _ => cell_x + 5.0,
                    };
                    show_text(
                        c,
                        &label_enc,
                        fb,
                        title_fs,
                        label_x,
                        bottom + gh - 10.0,
                        [0.15, 0.18, 0.24],
                    );

                    let val_enc = to_utf8_winansi(&total_value, total_value.len());
                    let val_tw = total_value.len() as f32 * value_fs * 0.55;
                    let val_x = match al2 {
                        "center" => cell_x + (cell_w - val_tw) / 2.0,
                        "right" => cell_x + cell_w - val_tw - 5.0,
                        _ => cell_x + 5.0,
                    };
                    show_text(
                        c,
                        &val_enc,
                        fb,
                        value_fs,
                        val_x,
                        bottom + 10.0,
                        [0.08, 0.12, 0.18],
                    );
                }

                let dash_count = ((block_width - 10.0) / (title_fs * 0.55)).floor() as usize;
                let dash_line = "-".repeat(dash_count.max(2));
                let dash_enc = to_utf8_winansi(&dash_line, dash_line.len());
                show_text(
                    c,
                    &dash_enc,
                    fr,
                    title_fs * 0.85,
                    block_left + 5.0,
                    bottom + gh - 18.0,
                    [0.15, 0.18, 0.24],
                );
            }

            *curs -= gh;
        }
    } else {
        let mut row_idx = 0;
        let rows_len = rows.len();
        let mut i = 0;

        while i < rows_len {
            // Verifica espaço para a próxima linha
            if *curs - rh < page_bottom + 15.0 {
                // Salva as linhas restantes
                let remaining_rows = &rows[i..];
                let remaining_count = remaining_rows.len();

                // Força quebra de página
                page_break(c, curs);

                // Renderiza cabeçalho na nova página
                render_header(c, *curs);
                *curs -= hh;

                // Renderiza todas as linhas restantes
                for remaining_row in remaining_rows {
                    if *curs - rh < page_bottom + 15.0 {
                        page_break(c, curs);
                        render_header(c, *curs);
                        *curs -= hh;
                    }

                    let ry = *curs;
                    let alt = (row_idx % 2) == 0;
                    if alt {
                        c.set_fill_rgb(0.96, 0.97, 0.99);
                    } else {
                        c.set_fill_rgb(1.0, 1.0, 1.0);
                    }
                    c.rect(tx, ry - rh, iw, rh);
                    c.fill_nonzero();

                    let mut hx = tx;
                    for ci in 0..cc {
                        let hdr = &table.table_header[ci];
                        let val = remaining_row
                            .get(&hdr.key)
                            .map(|v| format_mask(v, hdr.mask.as_deref()))
                            .unwrap_or_default();
                        let enc = to_utf8_winansi(&val, val.len());
                        let al2 = al[ci];
                        let tw = enc.len() as f32 * fs * 0.55;
                        let dx = match al2 {
                            "center" => hx + (cw[ci] - tw) / 2.0,
                            "right" => hx + cw[ci] - tw - 5.0,
                            _ => hx + 5.0,
                        };
                        show_text(
                            c,
                            &enc,
                            fr,
                            fs,
                            dx,
                            ry - rh / 2.0 - fs / 3.0,
                            [0.20, 0.22, 0.26],
                        );
                        c.set_stroke_rgb(0.88, 0.90, 0.93);
                        c.set_line_width(0.3);
                        c.move_to(hx + cw[ci], ry);
                        c.line_to(hx + cw[ci], ry - rh);
                        c.stroke();
                        hx += cw[ci];
                    }

                    c.set_stroke_rgb(0.90, 0.92, 0.95);
                    c.set_line_width(0.3);
                    c.move_to(tx, ry - rh);
                    c.line_to(tx + iw, ry - rh);
                    c.stroke();
                    *curs -= rh;
                    row_idx += 1;
                    let rendered_items = if let Some(expansion) = row_expansion {
                        render_child_section(
                            c,
                            remaining_row,
                            expansion,
                            table,
                            dctx,
                            ctx,
                            curs,
                            fr,
                            fb,
                            page_break,
                            tx,
                            iw,
                            fs,
                            hh,
                            &render_header,
                        )
                    } else {
                        false
                    };
                    let more_content = i + 1 < rows.len() || has_grand_total;
                    if rendered_items && more_content {
                        if *curs - hh < page_bottom + 20.0 {
                            page_break(c, curs);
                        }
                        render_header(c, *curs);
                        *curs -= hh;
                    }
                }
                break; // Sai do loop while
            }

            let row = &rows[i];
            let ry = *curs;
            let alt = (row_idx % 2) == 0;
            if alt {
                c.set_fill_rgb(0.96, 0.97, 0.99);
            } else {
                c.set_fill_rgb(1.0, 1.0, 1.0);
            }
            c.rect(tx, ry - rh, iw, rh);
            c.fill_nonzero();

            let mut hx = tx;
            for ci in 0..cc {
                let hdr = &table.table_header[ci];
                let val = row
                    .get(&hdr.key)
                    .map(|v| format_mask(v, hdr.mask.as_deref()))
                    .unwrap_or_default();
                if hdr.pill {
                    let matched_case = hdr
                        .pill_cases
                        .as_ref()
                        .and_then(|cases| cases.iter().find(|pc| pc.case == val));
                    let pill_bg = matched_case
                        .map(|pc| hex_to_rgb(&pc.color))
                        .unwrap_or([0.45, 0.50, 0.58]);
                    let pill_label = matched_case
                        .and_then(|pc| pc.transform.as_deref())
                        .unwrap_or(&val);
                    draw_pill(c, pill_label, hx, cw[ci], ry, rh, al[ci], hdr.pill_width, pill_bg, fb, fs);
                } else {
                    let enc = to_utf8_winansi(&val, val.len());
                    let al2 = al[ci];
                    let tw = enc.len() as f32 * fs * 0.55;
                    let dx = match al2 {
                        "center" => hx + (cw[ci] - tw) / 2.0,
                        "right" => hx + cw[ci] - tw - 5.0,
                        _ => hx + 5.0,
                    };
                    show_text(
                        c,
                        &enc,
                        fr,
                        fs,
                        dx,
                        ry - rh / 2.0 - fs / 3.0,
                        [0.20, 0.22, 0.26],
                    );
                }
                if draw_borders {
                    c.set_stroke_rgb(border_color[0], border_color[1], border_color[2]);
                    c.set_line_width(border_width);
                    c.move_to(hx + cw[ci], ry);
                    c.line_to(hx + cw[ci], ry - rh);
                    c.stroke();
                }
                hx += cw[ci];
            }

            c.set_stroke_rgb(0.90, 0.92, 0.95);
            c.set_line_width(0.3);
            c.move_to(tx, ry - rh);
            c.line_to(tx + iw, ry - rh);
            c.stroke();
            *curs -= rh;
            row_idx += 1;
            let rendered_items = if let Some(expansion) = row_expansion {
                render_child_section(
                    c,
                    row,
                    expansion,
                    table,
                    dctx,
                    ctx,
                    curs,
                    fr,
                    fb,
                    page_break,
                    tx,
                    iw,
                    fs,
                    hh,
                    &render_header,
                )
            } else {
                false
            };
            let more_content = i + 1 < rows.len() || has_grand_total;
            if rendered_items && more_content {
                if *curs - hh < page_bottom + 20.0 {
                    page_break(c, curs);
                }
                render_header(c, *curs);
                *curs -= hh;
            }
            i += 1;
        }

        if has_grand_total && !rows.is_empty() {
            let gh = rh * 1.8;
            if *curs - (gh + 4.0) < page_bottom + 15.0 {
                page_break(c, curs);
                render_header(c, *curs);
                *curs -= hh;
            }

            let top = *curs;
            let bottom = top - gh;
            c.set_stroke_rgb(0.75, 0.78, 0.82);
            c.set_line_width(2.0);
            c.set_dash_pattern(vec![3.0, 2.0], 0.0);
            c.move_to(tx, top);
            c.line_to(tx + iw, top);
            c.stroke();
            c.set_dash_pattern(vec![], 0.0);
            let title_fs = fs * 1.05;
            let value_fs = fs * 1.2;

            let mut summary_columns = Vec::new();
            let mut x = tx;
            for ci in 0..cc {
                let hdr = &table.table_header[ci];
                if hdr.sum {
                    summary_columns.push((ci, x, cw[ci]));
                }
                x += cw[ci];
            }

            if !summary_columns.is_empty() {
                let block_left = summary_columns.first().unwrap().1;
                let block_right =
                    summary_columns.last().unwrap().1 + summary_columns.last().unwrap().2;
                let block_width = block_right - block_left;

                for (ci, cell_x, cell_w) in &summary_columns {
                    let hdr = &table.table_header[*ci];
                    let label = hdr.prefix.as_deref().unwrap_or(&hdr.key);
                    let total_value = {
                        let t: f64 = rows
                            .iter()
                            .filter_map(|r| r.get(&hdr.key))
                            .filter_map(|v| v.as_f64())
                            .sum();
                        format_numeric_value(t, hdr.mask.as_deref())
                    };

                    let al2 = al[*ci];
                    let label_enc = to_utf8_winansi(label, label.len());
                    let label_tw = label.len() as f32 * title_fs * 0.55;
                    let label_x = match al2 {
                        "center" => cell_x + (cell_w - label_tw) / 2.0,
                        "right" => cell_x + cell_w - label_tw - 5.0,
                        _ => cell_x + 5.0,
                    };
                    show_text(
                        c,
                        &label_enc,
                        fb,
                        title_fs,
                        label_x,
                        bottom + gh - 10.0,
                        [0.15, 0.18, 0.24],
                    );

                    let val_enc = to_utf8_winansi(&total_value, total_value.len());
                    let val_tw = total_value.len() as f32 * value_fs * 0.55;
                    let val_x = match al2 {
                        "center" => cell_x + (cell_w - val_tw) / 2.0,
                        "right" => cell_x + cell_w - val_tw - 5.0,
                        _ => cell_x + 5.0,
                    };
                    show_text(
                        c,
                        &val_enc,
                        fb,
                        value_fs,
                        val_x,
                        bottom + 10.0,
                        [0.08, 0.12, 0.18],
                    );
                }

                let dash_count = ((block_width - 10.0) / (title_fs * 0.55)).floor() as usize;
                let dash_line = "-".repeat(dash_count.max(2));
                let dash_enc = to_utf8_winansi(&dash_line, dash_line.len());
                show_text(
                    c,
                    &dash_enc,
                    fr,
                    title_fs * 0.85,
                    block_left + 5.0,
                    bottom + gh - 18.0,
                    [0.15, 0.18, 0.24],
                );
            }

            *curs -= gh;
        }
    }

    // ── Summary Box ─────────────────────────────────────────────────────────
    if let Some(sb) = table.summary_box.as_ref() {
        if !rows.is_empty() && !sb.rows.is_empty() {
            let line_h = fs * 2.2;
            let pad_x = 14.0_f32;
            let pad_y = 10.0_f32;
            let box_w = sb.width.unwrap_or(200.0_f32).min(iw);
            let box_h = sb.rows.len() as f32 * line_h + pad_y * 2.0;
            let gap_top = 12.0_f32;

            *curs -= gap_top;

            if *curs - box_h < page_bottom + 15.0 {
                page_break(c, curs);
                *curs -= gap_top;
            }

            let box_x = match sb.align.as_deref().unwrap_or("center") {
                "left" => tx,
                "right" => tx + iw - box_w,
                _ => tx + (iw - box_w) / 2.0,
            };
            let box_y = *curs - box_h;

            // White background
            c.set_fill_rgb(1.0, 1.0, 1.0);
            c.rect(box_x, box_y, box_w, box_h);
            c.fill_nonzero();

            // Outer border
            c.set_stroke_rgb(0.20, 0.22, 0.28);
            c.set_line_width(0.7);
            c.rect(box_x, box_y, box_w, box_h);
            c.stroke();

            // Rows
            let mut ry = *curs - pad_y - line_h * 0.25; // start from top inside box

            for sbr in &sb.rows {
                // Divider before row — real dashed PDF line, edge-to-edge inside the box
                if sbr.divider_before.unwrap_or(false) {
                    let div_y = ry + line_h * 0.55;
                    c.set_stroke_rgb(0.35, 0.38, 0.44);
                    c.set_line_width(0.6);
                    // dash: 3pt on, 2pt off — firm and visible
                    c.set_dash_pattern(vec![3.0, 2.0], 0.0);
                    c.move_to(box_x + pad_x, div_y);
                    c.line_to(box_x + box_w - pad_x, div_y);
                    c.stroke();
                    // reset to solid
                    c.set_dash_pattern(vec![], 0.0);
                    ry -= 2.0; // small extra gap after divider
                }

                // Compute value string
                let val_str = if let Some(v) = sbr.value.as_deref() {
                    let interpolated = interpolate(v, &dctx.variables);
                    format_value_with_mask(&interpolated, sbr.mask.as_deref())
                } else if let Some(key) = sbr.key.as_deref() {
                    let t: f64 = rows
                        .iter()
                        .filter_map(|r| r.get(key))
                        .filter_map(|v| v.as_f64())
                        .sum();
                    format_numeric_value(t, sbr.mask.as_deref())
                } else {
                    String::new()
                };

                let font = if sbr.bold.unwrap_or(false) { fb } else { fr };
                let color = if sbr.bold.unwrap_or(false) {
                    [0.08_f32, 0.12, 0.20]
                } else {
                    [0.20, 0.24, 0.30]
                };

                // Label (left-aligned inside box)
                let label_enc = to_utf8_winansi(&sbr.label, sbr.label.len());
                show_text(c, &label_enc, font, fs, box_x + pad_x, ry, color);

                // Value (right-aligned inside box)
                let val_enc = to_utf8_winansi(&val_str, val_str.len());
                let val_tw = val_str.len() as f32 * fs * 0.55;
                show_text(
                    c,
                    &val_enc,
                    font,
                    fs,
                    box_x + box_w - val_tw - pad_x,
                    ry,
                    color,
                );

                ry -= line_h;
            }

            *curs -= box_h + gap_top;
        }
    }
}
fn render_chart(
    c: &mut Content,
    chart: &ChartComponent,
    ctx: &mut V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
) {
    let m = chart
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((4.0, 0.0, 4.0, 0.0));
    let ch = 140.0;
    let total_width = ctx.content_w;
    *curs -= m.0;
    let tx = ctx.margin + m.3;

    let chart_width = chart
        .width
        .as_ref()
        .map(|w| match w {
            V3Size::Pixels(v) => v.min(total_width),
            V3Size::Percent(p) => p
                .trim_end_matches('%')
                .parse::<f32>()
                .ok()
                .map(|pc| (pc / 100.0) * total_width)
                .unwrap_or(total_width)
                .min(total_width),
            V3Size::Auto(_) => total_width,
        })
        .unwrap_or(total_width);

    let cx = match chart.align.as_deref().unwrap_or("left") {
        "center" => tx + (total_width - chart_width) / 2.0,
        "right" => tx + (total_width - chart_width),
        _ => tx,
    };

    let primary = if let Some(colors) = chart.colors.as_ref() {
        if let Some(first) = colors.get(0) {
            hex_to_rgb(first)
        } else {
            [0.20, 0.35, 0.60]
        }
    } else if let Some(from) = chart.color_from.as_ref() {
        hex_to_rgb(from)
    } else {
        [0.20, 0.35, 0.60]
    };

    let accent = if let Some(colors) = chart.colors.as_ref() {
        if let Some(second) = colors.get(1) {
            hex_to_rgb(second)
        } else {
            [0.85, 0.35, 0.15]
        }
    } else if let Some(to) = chart.color_to.as_ref() {
        hex_to_rgb(to)
    } else {
        [0.85, 0.35, 0.15]
    };

    let title = chart
        .header
        .as_ref()
        .map(|h| h.value.clone())
        .or_else(|| chart.title.clone())
        .unwrap_or_default();
    let title = interpolate(&title, &dctx.variables);

    if !title.is_empty() {
        let title_fs = chart
            .header
            .as_ref()
            .and_then(|h| h.font_size)
            .unwrap_or(9.0);
        let title_color = chart
            .header
            .as_ref()
            .and_then(|h| h.color.as_deref())
            .map(hex_to_rgb)
            .unwrap_or([0.15, 0.15, 0.18]);
        let title_align = chart
            .header
            .as_ref()
            .and_then(|h| h.align.as_deref())
            .unwrap_or("left");
        let title_enc = to_utf8_winansi(&title, title.len());
        let title_tw = title.len() as f32 * title_fs * 0.55;
        let title_x = match title_align {
            "center" => tx + (total_width - title_tw) / 2.0,
            "right" => tx + total_width - title_tw - 5.0,
            _ => tx + 5.0,
        };

        let header_height = chart
            .header
            .as_ref()
            .and_then(|h| h.height)
            .unwrap_or(title_fs + 10.0);

        if let Some(bg) = chart
            .header
            .as_ref()
            .and_then(|h| h.background_color.as_deref())
        {
            let bg_rgb = hex_to_rgb(bg);
            c.set_fill_rgb(bg_rgb[0], bg_rgb[1], bg_rgb[2]);
            c.rect(tx, *curs - header_height, total_width, header_height);
            c.fill_nonzero();
        }

        show_text(
            c,
            &title_enc,
            fb,
            title_fs,
            title_x,
            *curs - header_height / 2.0 + title_fs / 3.0,
            title_color,
        );
        *curs -= header_height + 4.0;
    }

    fn value_to_string(value: &serde_json::Value) -> Option<String> {
        match value {
            serde_json::Value::String(s) => Some(s.clone()),
            serde_json::Value::Number(n) => Some(n.to_string()),
            serde_json::Value::Bool(b) => Some(b.to_string()),
            _ => None,
        }
    }

    let mut labels = chart.labels.clone().unwrap_or_default();
    let mut values = chart.values.clone().unwrap_or_default();
    let mut row_labels: Vec<String> = vec![];

    if labels.is_empty() || values.is_empty() {
        if let Some(dataset_name) = chart.dataset_name.as_ref() {
            if let Some(data_rows) = dctx.datasets.get(dataset_name) {
                if chart.chart_model == "heatmap" {
                    // Heatmap: build 2D matrix from keyPresent (columns) + labelKey (rows)
                    if let (Some(col_key), Some(row_key), Some(val_key)) = (
                        chart.key_present.as_deref(),
                        chart.label_key.as_deref(),
                        chart.value_key.as_deref(),
                    ) {
                        let mut col_labels: Vec<String> = Vec::new();
                        let mut row_lbls: Vec<String> = Vec::new();

                        for row in data_rows.iter() {
                            let cv = row
                                .get(col_key)
                                .and_then(value_to_string)
                                .unwrap_or_default();
                            let rv = row
                                .get(row_key)
                                .and_then(value_to_string)
                                .unwrap_or_default();
                            if !col_labels.contains(&cv) {
                                col_labels.push(cv);
                            }
                            if !row_lbls.contains(&rv) {
                                row_lbls.push(rv);
                            }
                        }

                        let ncols = col_labels.len();
                        let nrows = row_lbls.len();
                        let mut matrix = vec![0.0_f64; nrows * ncols];

                        for row in data_rows.iter() {
                            if let (Some(cv), Some(rv), Some(val)) = (
                                row.get(col_key).and_then(value_to_string),
                                row.get(row_key).and_then(value_to_string),
                                row.get(val_key).and_then(|v| v.as_f64()),
                            ) {
                                if let (Some(ci), Some(ri)) = (
                                    col_labels.iter().position(|x| x == &cv),
                                    row_lbls.iter().position(|x| x == &rv),
                                ) {
                                    matrix[ri * ncols + ci] = val;
                                }
                            }
                        }

                        labels = col_labels;
                        values = matrix;
                        row_labels = row_lbls;
                    }
                } else if let (Some(key_sum), Some(key_present)) =
                    (chart.key_sum.as_deref(), chart.key_present.as_deref())
                {
                    let group_key = chart.key_group.as_deref();
                    let mut totals: HashMap<String, (f64, String)> = HashMap::new();

                    for row in data_rows {
                        let group_id = group_key.and_then(|k| row.get(k)).and_then(value_to_string);
                        let label = row
                            .get(key_present)
                            .and_then(value_to_string)
                            .or_else(|| group_id.clone())
                            .unwrap_or_default();
                        let amount = row.get(key_sum).and_then(|v| v.as_f64()).unwrap_or(0.0);
                        let key = group_id.unwrap_or_else(|| label.clone());

                        let entry = totals.entry(key).or_insert((0.0, label.clone()));
                        entry.0 += amount;
                        if entry.1.is_empty() {
                            entry.1 = label.clone();
                        }
                    }

                    let mut items: Vec<_> = totals.into_iter().collect();
                    items.sort_by(|a, b| {
                        b.1 .0
                            .partial_cmp(&a.1 .0)
                            .unwrap_or(std::cmp::Ordering::Equal)
                    });

                    if let Some(top) = chart.top_count {
                        items.truncate(top);
                    }

                    labels = items
                        .iter()
                        .map(|(_, (_sum, label))| label.clone())
                        .collect();
                    values = items.iter().map(|(_, (sum, _))| *sum).collect();
                } else if let (Some(label_key), Some(value_key)) =
                    (chart.label_key.as_deref(), chart.value_key.as_deref())
                {
                    labels = data_rows
                        .iter()
                        .filter_map(|row| row.get(label_key).and_then(value_to_string))
                        .collect();
                    values = data_rows
                        .iter()
                        .filter_map(|row| row.get(value_key).and_then(|v| v.as_f64()))
                        .collect();
                }
            }
        }
    }

    let cd = ChartData {
        title: title.clone(),
        labels,
        row_labels,
        values,
        chart_type: chart.chart_model.clone(),
    };
    let cy = *curs - ch + 10.0;

    let label_font_size = chart.label_font_size.unwrap_or(5.5);
    let label_color = chart
        .label_color
        .as_deref()
        .map(|s| hex_to_rgb(s))
        .unwrap_or([0.55, 0.55, 0.60]);
    let grid_color = chart
        .grid_color
        .as_deref()
        .map(|s| hex_to_rgb(s))
        .unwrap_or([0.88, 0.88, 0.92]);
    let label_max_chars = chart.label_max_chars.unwrap_or(8);
    let value_suffix = chart.value_suffix.as_deref().unwrap_or("");

    match chart.chart_model.as_str() {
        "bar" => {
            if let Some(colors) = chart.colors.as_ref() {
                let color_vec: Vec<[f32; 3]> = colors.iter().map(|hex| hex_to_rgb(hex)).collect();
                if !color_vec.is_empty() {
                    draw_bar_chart_with_colors(
                        c,
                        &cd,
                        cx,
                        cy,
                        chart_width,
                        ch - 10.0,
                        &color_vec,
                        value_suffix,
                        label_font_size,
                        label_color,
                        grid_color,
                        label_max_chars,
                    );
                } else {
                    draw_bar_chart(
                        c,
                        &cd,
                        cx,
                        cy,
                        chart_width,
                        ch - 10.0,
                        primary,
                        value_suffix,
                        label_font_size,
                        label_color,
                        grid_color,
                        label_max_chars,
                    );
                }
            } else {
                draw_bar_chart(
                    c,
                    &cd,
                    cx,
                    cy,
                    chart_width,
                    ch - 10.0,
                    primary,
                    value_suffix,
                    label_font_size,
                    label_color,
                    grid_color,
                    label_max_chars,
                );
            }
        }
        "line" => draw_line_chart(c, &cd, cx, cy, chart_width, ch - 10.0, primary, accent),
        "pie" | "donut" => draw_pie_chart(c, &cd, cx, cy, chart_width, ch - 10.0, primary, accent),
        "candles" => {
            if let Some(colors) = chart.colors.as_ref() {
                let color_vec: Vec<[f32; 3]> = colors.iter().map(|hex| hex_to_rgb(hex)).collect();
                if !color_vec.is_empty() {
                    draw_bar_chart_with_colors(
                        c,
                        &cd,
                        cx,
                        cy,
                        chart_width,
                        ch - 10.0,
                        &color_vec,
                        value_suffix,
                        label_font_size,
                        label_color,
                        grid_color,
                        label_max_chars,
                    );
                } else {
                    draw_bar_chart(
                        c,
                        &cd,
                        cx,
                        cy,
                        chart_width,
                        ch - 10.0,
                        primary,
                        value_suffix,
                        label_font_size,
                        label_color,
                        grid_color,
                        label_max_chars,
                    );
                }
            } else {
                draw_bar_chart(
                    c,
                    &cd,
                    cx,
                    cy,
                    chart_width,
                    ch - 10.0,
                    primary,
                    value_suffix,
                    label_font_size,
                    label_color,
                    grid_color,
                    label_max_chars,
                );
            }
        }
        "heatmap" => {
            let color_from = chart
                .color_from
                .as_deref()
                .map(|s| hex_to_rgb(s))
                .unwrap_or([0.4, 0.6, 0.9]);
            let color_to = chart
                .color_to
                .as_deref()
                .map(|s| hex_to_rgb(s))
                .unwrap_or([0.1, 0.3, 0.7]);
            draw_heatmap_chart(c, &cd, cx, cy, chart_width, ch - 10.0, color_from, color_to);

            if chart.show_details.unwrap_or(false) {
                let details_h = 110.0_f32; // 60 card + 16 header + 10 gap
                let details_y = cy - details_h;
                draw_heatmap_details(c, &cd, cx, details_y, chart_width, color_to);
                *curs -= details_h;
            }
        }
        _ => {}
    }
    *curs -= ch + m.2;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE MULTI DATA
// ═══════════════════════════════════════════════════════════════════════════════

/// Renderiza o componente tableMultiData.
///
/// Cada registro do dataset é exibido como um "bloco" composto por:
///   1. Barra de título (opcional) — fundo escuro + nome do registro
///   2. Grade com `columns` colunas onde cada célula mostra:
///        ┌─────────────┐
///        │  Label      │  ← row de labels (fundo suave)
///        │  Valor      │  ← row de valores (fundo branco/zebra)
///        └─────────────┘
///
/// Campos com `span > 1` ocupam múltiplas colunas.
fn render_table_multi_data(
    c: &mut Content,
    comp: &TableMultiDataComponent,
    ctx: &mut V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
    page_break: &mut dyn FnMut(&mut Content, &mut f32),
) {
    let rows = match dctx.datasets.get(&comp.dataset_name) {
        Some(d) => d,
        None => return,
    };

    let m = comp
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((6.0, 0.0, 6.0, 0.0));

    let tx = ctx.margin + m.3;
    let iw = ctx.content_w - m.1 - m.3;

    let cols = comp.columns.unwrap_or(4).max(1) as usize;
    let gap = comp.gap.unwrap_or(8.0);

    // ── Colors ──────────────────────────────────────────────────────────────
    let title_bg = comp
        .title_background_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.125, 0.263, 0.361]); // #20435C
    let title_tc = comp
        .title_text_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([1.0, 1.0, 1.0]);
    let label_bg = comp
        .label_background_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.933, 0.945, 0.965]); // #EEF1F6
    let label_col = comp
        .label_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.333, 0.369, 0.455]); // #555e74
    let value_col = comp
        .value_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.118, 0.133, 0.169]); // #1e222b
    let border_col = comp
        .border_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.784, 0.804, 0.847]); // #c8cdd8
    let border_w = comp.border_width.unwrap_or(0.4);
    let zebra_bg = comp
        .zebra_background_color
        .as_deref()
        .map(hex_to_rgb)
        .unwrap_or([0.976, 0.980, 0.988]); // #f9fafc

    // ── Font sizes ───────────────────────────────────────────────────────────
    let label_fs = 7.5_f32;
    let value_fs = 9.0_f32;
    let title_fs = 9.5_f32;

    let label_rh = label_fs + 4.0;
    let value_rh = value_fs * 1.55 + 3.0;
    let title_h  = title_fs * 1.7 + 4.0;

    // Expandir fields em "slots" respeitando span
    // Cada slot ocupa `span` colunas
    let fields = &comp.fields;

    // Calcula altura total de um bloco de registro para checar page-break
    let block_height = |has_title: bool| -> f32 {
        // número de "linhas" de campos necessárias
        let mut used_cols = 0usize;
        let mut rows_count = 1usize;
        for f in fields.iter() {
            let span = (f.span.unwrap_or(1) as usize).max(1).min(cols);
            if used_cols + span > cols {
                rows_count += 1;
                used_cols = 0;
            }
            used_cols += span;
        }
        let title_part = if has_title { title_h } else { 0.0 };
        title_part + rows_count as f32 * (label_rh + value_rh)
    };

    *curs -= m.0;

    // ── Grouping ─────────────────────────────────────────────────────────────
    // Monta a lista de (Option<group_label>, rows_do_grupo)
    let grouped: Vec<(Option<String>, Vec<&HashMap<String, serde_json::Value>>)> =
        if let Some(ref grouping) = comp.grouping {
            group_rows(rows, &grouping.group_by)
                .into_iter()
                .map(|(key, grp)| {
                    let formatted_key = format_value_with_mask(&key, grouping.group_header_mask.as_deref());
                    let label = if let Some(ref template) = grouping.group_header {
                        template.replace("{value}", &formatted_key)
                    } else if let Some(ref prefix) = grouping.prefix {
                        format!("{}{}", prefix, formatted_key)
                    } else {
                        formatted_key
                    };
                    (Some(label), grp)
                })
                .collect()
        } else {
            vec![(None, rows.iter().collect())]
        };

    let group_header_bg = comp
        .grouping
        .as_ref()
        .and_then(|g| g.group_header_background_color.as_deref())
        .or(comp.group_header_background_color.as_deref())
        .map(hex_to_rgb)
        .unwrap_or([0.251, 0.251, 0.251]); // #404040
    let group_header_text = comp
        .grouping
        .as_ref()
        .and_then(|g| g.group_header_text_color.as_deref())
        .or(comp.group_header_text_color.as_deref())
        .map(hex_to_rgb)
        .unwrap_or([1.0, 1.0, 1.0]);
    let group_header_h = title_fs * 1.7 + 4.0;

    let mut global_ri = 0usize;

    for (group_label, group_rows) in &grouped {
        // ── Cabeçalho do grupo ────────────────────────────────────────────
        if let Some(ref label) = group_label {
            if *curs - group_header_h < ctx.bottom_reserved {
                page_break(c, curs);
            }
            *curs -= group_header_h;
            c.set_fill_rgb(group_header_bg[0], group_header_bg[1], group_header_bg[2]);
            c.rect(tx, *curs, iw, group_header_h);
            c.fill_nonzero();
            let enc = to_utf8_winansi(label, label.len());
            let ty = *curs + group_header_h / 2.0 - title_fs / 3.0;
            show_text(c, &enc, fb, title_fs, tx + 8.0, ty, group_header_text);
            *curs -= gap / 2.0;
        }

    for (ri, row) in group_rows.iter().enumerate() {
        let _ = ri; // índice local dentro do grupo, não usado diretamente
        let row = *row;
        let ri = global_ri;
        global_ri += 1;
        let has_title = comp.title_field.is_some();
        let bh = block_height(has_title);

        // Page-break se não couber o bloco inteiro (ou pelo menos título + primeira linha)
        let min_needed = title_h + label_rh + value_rh + 10.0;
        if *curs - min_needed < ctx.bottom_reserved {
            page_break(c, curs);
        }

        // Zebra de fundo para o bloco inteiro
        let block_bg = if ri % 2 == 0 {
            zebra_bg
        } else {
            [1.0_f32, 1.0, 1.0]
        };

        // ── Barra de título ───────────────────────────────────────────────
        if let Some(ref tf) = comp.title_field {
            let raw_val = row
                .get(tf)
                .map(|v| match v {
                    serde_json::Value::String(s) => s.clone(),
                    _ => v.to_string(),
                })
                .unwrap_or_default();
            let prefix = comp.title_prefix.as_deref().unwrap_or("");
            let title_text = format!("{}{}", prefix, raw_val);

            *curs -= title_h;
            c.set_fill_rgb(title_bg[0], title_bg[1], title_bg[2]);
            c.rect(tx, *curs, iw, title_h);
            c.fill_nonzero();

            let enc = to_utf8_winansi(&title_text, title_text.len());
            let ty = *curs + title_h / 2.0 - title_fs / 3.0;
            show_text(c, &enc, fb, title_fs, tx + 6.0, ty, title_tc);

            // Borda inferior da barra de título
            c.set_stroke_rgb(border_col[0], border_col[1], border_col[2]);
            c.set_line_width(border_w);
            c.move_to(tx, *curs);
            c.line_to(tx + iw, *curs);
            c.stroke();
        }

        // ── Grade de campos ───────────────────────────────────────────────
        // Distribui os campos em linhas de `cols` colunas
        let mut field_lines: Vec<Vec<(usize, usize)>> = Vec::new(); // (field_idx, span)
        let mut current_line: Vec<(usize, usize)> = Vec::new();
        let mut used_cols = 0usize;

        for (fi, field) in fields.iter().enumerate() {
            let span = (field.span.unwrap_or(1) as usize).max(1).min(cols);
            if used_cols + span > cols && !current_line.is_empty() {
                field_lines.push(current_line.clone());
                current_line.clear();
                used_cols = 0;
            }
            current_line.push((fi, span));
            used_cols += span;
        }
        if !current_line.is_empty() {
            // Preenche até `cols` com spans para alinhar última linha
            field_lines.push(current_line);
        }

        // Col width base = iw / cols
        let col_w = iw / cols as f32;

        for line in &field_lines {
            // ── Row de labels ────────────────────────────────────────────
            if *curs - label_rh < ctx.bottom_reserved {
                page_break(c, curs);
            }

            *curs -= label_rh;

            // Fundo label row
            c.set_fill_rgb(label_bg[0], label_bg[1], label_bg[2]);
            c.rect(tx, *curs, iw, label_rh);
            c.fill_nonzero();

            // Textos dos labels
            let mut lx = tx;
            for (fi, span) in line.iter() {
                let cell_w = col_w * (*span as f32);
                let field = &fields[*fi];
                let label = field.prefix.as_deref().unwrap_or(&field.key);
                let enc = to_utf8_winansi(label, label.len());
                let ly = *curs + label_rh / 2.0 - label_fs / 3.0;
                show_text(c, &enc, fr, label_fs, lx + 4.0, ly, label_col);

                // Borda vertical direita da célula
                c.set_stroke_rgb(border_col[0], border_col[1], border_col[2]);
                c.set_line_width(border_w);
                if lx + cell_w < tx + iw - 0.5 {
                    c.move_to(lx + cell_w, *curs);
                    c.line_to(lx + cell_w, *curs + label_rh);
                    c.stroke();
                }

                lx += cell_w;
            }

            // ── Row de valores ────────────────────────────────────────────
            if *curs - value_rh < ctx.bottom_reserved {
                page_break(c, curs);
            }

            *curs -= value_rh;

            // Fundo valor row (zebra)
            c.set_fill_rgb(block_bg[0], block_bg[1], block_bg[2]);
            c.rect(tx, *curs, iw, value_rh);
            c.fill_nonzero();

            let mut vx = tx;
            for (fi, span) in line.iter() {
                let cell_w = col_w * (*span as f32);
                let field = &fields[*fi];
                let raw = row
                    .get(&field.key)
                    .map(|v| format_mask(v, field.mask.as_deref()))
                    .unwrap_or_default();
                let enc = to_utf8_winansi(&raw, raw.len());
                let is_bold = field.bold.unwrap_or(false);
                let font = if is_bold { fb } else { fr };
                let al = field.align.as_deref().unwrap_or("left");
                let tw = enc.len() as f32 * value_fs * 0.55;
                let dx = match al {
                    "center" => vx + (cell_w - tw) / 2.0,
                    "right"  => vx + cell_w - tw - 4.0,
                    _        => vx + 4.0,
                };
                let vy = *curs + value_rh / 2.0 - value_fs / 3.0;
                show_text(c, &enc, font, value_fs, dx, vy, value_col);

                // Borda vertical direita da célula
                c.set_stroke_rgb(border_col[0], border_col[1], border_col[2]);
                c.set_line_width(border_w);
                if vx + cell_w < tx + iw - 0.5 {
                    c.move_to(vx + cell_w, *curs);
                    c.line_to(vx + cell_w, *curs + value_rh);
                    c.stroke();
                }

                vx += cell_w;
            }

            // Borda inferior da linha de valores
            c.set_stroke_rgb(border_col[0], border_col[1], border_col[2]);
            c.set_line_width(border_w);
            c.move_to(tx, *curs);
            c.line_to(tx + iw, *curs);
            c.stroke();
        }

        // Borda externa do bloco (esquerda + direita + topo se sem título)
        c.set_stroke_rgb(border_col[0], border_col[1], border_col[2]);
        c.set_line_width(border_w);
        let block_top = *curs + block_height(has_title);
        if !has_title {
            // topo
            c.move_to(tx, block_top);
            c.line_to(tx + iw, block_top);
            c.stroke();
        }
        // esquerda
        c.move_to(tx, block_top);
        c.line_to(tx, *curs);
        c.stroke();
        // direita
        c.move_to(tx + iw, block_top);
        c.line_to(tx + iw, *curs);
        c.stroke();

        // Espaço entre blocos
        *curs -= gap;
    } // fim loop registros do grupo

    } // fim loop grupos

    *curs -= m.2;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPATCH
// ═══════════════════════════════════════════════════════════════════════════════

fn render_comp(
    c: &mut Content,
    comp: &ComponentV3,
    ctx: &mut V3RenderContext,
    dctx: &V3DataContext,
    curs: &mut f32,
    fr: Name<'static>,
    fb: Name<'static>,
    fi: Name<'static>,
    image_map: &HashMap<String, ImageInfo>,
    page_break: &mut dyn FnMut(&mut Content, &mut f32),
) {
    match comp {
        ComponentV3::Text(t) => render_text(c, t, ctx, dctx, curs, fr, fb, fi),
        ComponentV3::Card(card) => {
            render_card(c, card, ctx, dctx, curs, fr, fb, fi, image_map, page_break)
        }
        ComponentV3::StackLayout(s) => {
            render_stack(c, s, ctx, dctx, curs, fr, fb, fi, image_map, page_break)
        }
        ComponentV3::HorizontalStack(h) => {
            render_hstack(c, h, ctx, dctx, curs, fr, fb, fi, image_map, page_break)
        }
        ComponentV3::FluidLayout(f) => {
            render_fluid(c, f, ctx, dctx, curs, fr, fb, fi, image_map, page_break)
        }
        ComponentV3::Table(t) => render_table(c, t, ctx, dctx, curs, fr, fb, page_break),
        ComponentV3::Chart(ch) => render_chart(c, ch, ctx, dctx, curs, fr, fb),
        ComponentV3::ImageBox(img) => render_image_box(c, img, ctx, dctx, curs, image_map, fr),
        ComponentV3::PriceList(pl) => render_price_list(c, pl, ctx, dctx, curs, fr, fb, page_break),
        ComponentV3::TableMultiData(tmd) => {
            render_table_multi_data(c, tmd, ctx, dctx, curs, fr, fb, page_break)
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

pub(crate) fn generate_pdf_v3_inner(
    report_json: &str,
    datasets_json: &str,
    variables_json: &str,
) -> Vec<u8> {
    let report: ReportV3 = match serde_json::from_str(report_json) {
        Ok(r) => r,
        Err(e) => {
            let pos = e.column();
            let ctx = if pos > 0 && pos <= report_json.len() {
                let start = pos.saturating_sub(40);
                let end = (pos + 40).min(report_json.len());
                &report_json[start..end]
            } else {
                "?"
            };
            return format!(
                "ERRO: Falha ao parsear report: {} (coluna {}) ao redor de: ...{}...",
                e, pos, ctx
            )
            .into_bytes();
        }
    };

    let datasets: HashMap<String, Vec<HashMap<String, serde_json::Value>>> =
        match serde_json::from_str(datasets_json) {
            Ok(d) => d,
            Err(e) => return format!("ERRO: datasets: {}", e).into_bytes(),
        };

    let variables: HashMap<String, String> = match serde_json::from_str(variables_json) {
        Ok(v) => v,
        Err(e) => return format!("ERRO: variables: {}", e).into_bytes(),
    };

    let dctx = V3DataContext {
        datasets,
        variables,
    };

    let margin = report
        .page_configuration
        .margin
        .as_ref()
        .map(|m| m.resolve())
        .unwrap_or((
            DEFAULT_MARGIN,
            DEFAULT_MARGIN,
            DEFAULT_MARGIN,
            DEFAULT_MARGIN,
        ));

    let orientation = report
        .page_configuration
        .orientation
        .as_deref()
        .unwrap_or("portrait")
        .to_lowercase();
    let (pw, ph) = match orientation.as_str() {
        "landscape" => (PAGE_H, PAGE_W),
        _ => (PAGE_W, PAGE_H),
    };

    let mut pdf = Pdf::new();
    let mut next_id: i32 = 1;
    let mut alloc = || {
        let r = Ref::new(next_id);
        next_id += 1;
        r
    };

    let catalog_id = alloc();
    let pages_id = alloc();
    let fr_id = alloc();
    let fb_id = alloc();
    let fi_id = alloc();
    let first_content_id = alloc();

    pdf.catalog(catalog_id).pages(pages_id);
    {
        let mut f = pdf.type1_font(fr_id);
        f.base_font(Name(b"Helvetica"));
        f.encoding_predefined(Name(b"WinAnsiEncoding"));
    }
    {
        let mut f = pdf.type1_font(fb_id);
        f.base_font(Name(b"Helvetica-Bold"));
        f.encoding_predefined(Name(b"WinAnsiEncoding"));
    }
    {
        let mut f = pdf.type1_font(fi_id);
        f.base_font(Name(b"ZapfDingbats"));
        f.encoding_predefined(Name(b"ZapfDingbatsEncoding"));
    }

    let fr_name = Name(b"F1");
    let fb_name = Name(b"F2");
    let fi_name = Name(b"F3");

    // ── Pre-scan: criar XObjects de imagem ───────────────────────────────────
    let mut image_map: HashMap<String, ImageInfo> = HashMap::new();
    {
        let mut all_comps: Vec<String> = Vec::new();
        collect_image_vars(&report.content, &mut all_comps);
        if let Some(ref h) = report.header {
            collect_image_vars(&h.content, &mut all_comps);
        }
        if let Some(ref f) = report.footer {
            collect_image_vars(&f.content, &mut all_comps);
        }

        for (idx, var_name) in all_comps.iter().enumerate() {
            // Pega base64 da variável
            let b64 = match dctx.variables.get(var_name) {
                Some(v) => v.as_str(),
                None => continue,
            };
            // Remove prefixo "data:image/...;base64,"
            let b64_clean = if let Some(pos) = b64.find(',') {
                &b64[pos + 1..]
            } else {
                b64
            };
            let raw = match B64.decode(b64_clean.trim()) {
                Ok(d) => d,
                Err(e) => {
                    image_map.insert(var_name.clone(), ImageInfo {
                        ref_id: Ref::new(1), xobj_name: vec![], nat_w: 0, nat_h: 0,
                        is_jpeg: false, num_components: 0,
                        error: Some(format!("Base64 decode falhou: {}", e)),
                    });
                    continue;
                }
            };

            // Detecta formato e dimensões
            let is_jpeg = raw.len() >= 3 && raw[0] == 0xFF && raw[1] == 0xD8;
            let is_png = raw.len() >= 8 && &raw[0..8] == b"\x89PNG\r\n\x1a\n";

            if !is_jpeg && !is_png {
                image_map.insert(var_name.clone(), ImageInfo {
                    ref_id: Ref::new(1), xobj_name: vec![], nat_w: 0, nat_h: 0,
                    is_jpeg: false, num_components: 0,
                    error: Some("Formato de imagem não suportado (esperado JPEG ou PNG)".to_string()),
                });
                continue;
            }

            let (nat_w, nat_h, num_components) = if is_jpeg {
                match jpeg_info(&raw) {
                    Some(v) => v,
                    None => {
                        image_map.insert(var_name.clone(), ImageInfo {
                            ref_id: Ref::new(1), xobj_name: vec![], nat_w: 0, nat_h: 0,
                            is_jpeg: true, num_components: 0,
                            error: Some("Não foi possível ler cabeçalho JPEG (SOF marker ausente)".to_string()),
                        });
                        continue;
                    }
                }
            } else {
                let (w, h) = png_dims(&raw).unwrap_or((0, 0));
                (w, h, 3u32)
            };

            if nat_w == 0 || nat_h == 0 {
                image_map.insert(var_name.clone(), ImageInfo {
                    ref_id: Ref::new(1), xobj_name: vec![], nat_w: 0, nat_h: 0,
                    is_jpeg, num_components,
                    error: Some("Dimensões da imagem são zero (arquivo corrompido?)".to_string()),
                });
                continue;
            }

            // CMYK JPEGs (4 componentes) não são renderizados corretamente pela maioria
            // dos visualizadores PDF. Registrar o erro e não embedar.
            if is_jpeg && num_components == 4 {
                image_map.insert(var_name.clone(), ImageInfo {
                    ref_id: Ref::new(1), xobj_name: vec![], nat_w, nat_h,
                    is_jpeg: true, num_components: 4,
                    error: Some(format!(
                        "Imagem CMYK (4 canais) detectada — não suportada pelo visualizador. \
                         Converta para RGB no Photoshop/GIMP antes de usar. \
                         ({}x{} px)", nat_w, nat_h
                    )),
                });
                continue;
            }

            let img_ref = alloc();
            let xobj_name = format!("Im{}", idx).into_bytes();

            if is_jpeg {
                let mut img = pdf.image_xobject(img_ref, &raw);
                img.filter(Filter::DctDecode);
                match num_components {
                    1 => { img.color_space().device_gray(); }
                    _ => { img.color_space().device_rgb(); } // 3 = RGB/YCbCr
                }
                img.bits_per_component(8);
                img.width(nat_w as i32);
                img.height(nat_h as i32);
                img.finish();
            } else {
                // PNG: não suportado nativamente sem lib de decode.
                image_map.insert(var_name.clone(), ImageInfo {
                    ref_id: Ref::new(1), xobj_name: vec![], nat_w, nat_h,
                    is_jpeg: false, num_components,
                    error: Some("PNG não suportado diretamente — converta para JPEG RGB".to_string()),
                });
                continue;
            }

            image_map.insert(
                var_name.clone(),
                ImageInfo {
                    ref_id: img_ref,
                    xobj_name,
                    nat_w,
                    nat_h,
                    is_jpeg,
                    num_components,
                    error: None,
                },
            );
        }
    }
    // ────────────────────────────────────────────────────────────────────────

    let mut content_ids: Vec<Ref> = Vec::new();
    let mut contents: Vec<Vec<u8>> = Vec::new();

    // Bottom margin for page-break detection
    let bottom_margin = margin.2;
    let mut current_content = Content::new();
    let mut current_cid = first_content_id;
    let mut curs = ph - margin.0;
    let mut ctx = V3RenderContext {
        pw,
        ph,
        margin: margin.3,
        content_w: pw - margin.1 - margin.3,
        bottom_reserved: 0.0,
    };

    // Helper to finalize current page and start a new one (cannot use closures with consume-by-value Content)
    let header_comps = report.header.as_ref().map(|h| &h.content);
    let header_repeat = report
        .header
        .as_ref()
        .map(|h| h.repeat.unwrap_or(true))
        .unwrap_or(true);

    let footer_height: f32 = report
        .footer
        .as_ref()
        .map(|footer| {
            let border = footer
                .border
                .as_ref()
                .map(|b| b.resolve())
                .unwrap_or((0.0, 0.0, 0.0, 0.0));
            let inner_width = (ctx.content_w - border.3 - border.1).max(0.0);
            let content_height: f32 = footer
                .content
                .iter()
                .map(|comp| est_h_with_margin(comp, inner_width, &dctx))
                .sum::<f32>();
            if let Some(fixed) = footer.height {
                fixed.max(0.0)
            } else {
                let min_content_height =
                    (footer.min_height.unwrap_or(0.0) - border.0 - border.2).max(0.0);
                content_height.max(min_content_height) + border.0 + border.2
            }
        })
        .unwrap_or(0.0);
    let footer_repeat = report
        .footer
        .as_ref()
        .map(|h| h.repeat.unwrap_or(true))
        .unwrap_or(true);

    ctx.bottom_reserved = bottom_margin + footer_height;

    let mut fill_background = |content: &mut Content| {
        if let Some(ref bg) = report.page_configuration.background_color {
            let rgb = hex_to_rgb(bg);
            content.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
            content.rect(0.0, 0.0, pw, ph);
            content.fill_nonzero();
        }
    };

    let draw_section_border = |content: &mut Content,
                               x: f32,
                               y: f32,
                               width: f32,
                               height: f32,
                               border: (f32, f32, f32, f32),
                               color: [f32; 3],
                               style: &str| {
        let (top, right, bottom, left) = border;
        if top <= 0.0 && right <= 0.0 && bottom <= 0.0 && left <= 0.0 {
            return;
        }

        content.set_fill_rgb(color[0], color[1], color[2]);

        let inner_x = x + left;
        let inner_y = y + bottom;
        let inner_width = width - left - right;
        let inner_height = height - top - bottom;

        match style {
            "dashed" => {
                let seg: f32 = 10.0;
                let gap: f32 = 6.0;
                if top > 0.0 {
                    let mut sx = x;
                    while sx < x + width {
                        let sw = seg.min(x + width - sx);
                        content.rect(sx, y + height - top, sw, top);
                        content.fill_nonzero();
                        sx += sw + gap;
                    }
                }
                if bottom > 0.0 {
                    let mut sx = x;
                    while sx < x + width {
                        let sw = seg.min(x + width - sx);
                        content.rect(sx, y, sw, bottom);
                        content.fill_nonzero();
                        sx += sw + gap;
                    }
                }
                if left > 0.0 {
                    let mut sy = inner_y;
                    while sy < inner_y + inner_height {
                        let sh = seg.min(inner_y + inner_height - sy);
                        content.rect(x, sy, left, sh);
                        content.fill_nonzero();
                        sy += sh + gap;
                    }
                }
                if right > 0.0 {
                    let mut sy = inner_y;
                    while sy < inner_y + inner_height {
                        let sh = seg.min(inner_y + inner_height - sy);
                        content.rect(x + width - right, sy, right, sh);
                        content.fill_nonzero();
                        sy += sh + gap;
                    }
                }
            }
            "thin" => {
                if inner_width > 0.0 {
                    if top > 0.0 {
                        content.rect(inner_x, y + height - 1.0, inner_width, 1.0);
                        content.fill_nonzero();
                    }
                    if bottom > 0.0 {
                        content.rect(inner_x, y, inner_width, 1.0);
                        content.fill_nonzero();
                    }
                }
                if inner_height > 0.0 {
                    if left > 0.0 {
                        content.rect(x, inner_y, 1.0, inner_height);
                        content.fill_nonzero();
                    }
                    if right > 0.0 {
                        content.rect(x + width - 1.0, inner_y, 1.0, inner_height);
                        content.fill_nonzero();
                    }
                }
            }
            "double" => {
                if inner_width > 0.0 {
                    if top > 0.0 {
                        content.rect(inner_x, y + height - 1.0, inner_width, 1.0);
                        content.fill_nonzero();
                        if top > 4.0 {
                            content.rect(inner_x, y + height - top + 1.0, inner_width, 1.0);
                            content.fill_nonzero();
                        }
                    }
                    if bottom > 0.0 {
                        content.rect(inner_x, y + 1.0, inner_width, 1.0);
                        content.fill_nonzero();
                        if bottom > 4.0 {
                            content.rect(inner_x, y + bottom - 2.0, inner_width, 1.0);
                            content.fill_nonzero();
                        }
                    }
                }
                if inner_height > 0.0 {
                    if left > 0.0 {
                        content.rect(x, inner_y, 1.0, inner_height);
                        content.fill_nonzero();
                        if left > 4.0 {
                            content.rect(x + left - 2.0, inner_y, 1.0, inner_height);
                            content.fill_nonzero();
                        }
                    }
                    if right > 0.0 {
                        content.rect(x + width - 1.0, inner_y, 1.0, inner_height);
                        content.fill_nonzero();
                        if right > 4.0 {
                            content.rect(x + width - right + 1.0, inner_y, 1.0, inner_height);
                            content.fill_nonzero();
                        }
                    }
                }
            }
            _ => {
                if top > 0.0 {
                    content.rect(x, y + height - top, width, top);
                    content.fill_nonzero();
                }
                if bottom > 0.0 {
                    content.rect(x, y, width, bottom);
                    content.fill_nonzero();
                }
                if left > 0.0 {
                    content.rect(x, y + bottom, left, height - top - bottom);
                    content.fill_nonzero();
                }
                if right > 0.0 {
                    content.rect(x + width - right, y + bottom, right, height - top - bottom);
                    content.fill_nonzero();
                }
            }
        }
    };

    let render_report_header = |content: &mut Content, curs: &mut f32| {
        if let Some(header) = &report.header {
            let border = header
                .border
                .as_ref()
                .map(|b| b.resolve())
                .unwrap_or((0.0, 0.0, 0.0, 0.0));
            let inner_width = (ctx.content_w - border.3 - border.1).max(0.0);
            let estimated_height: f32 = header
                .content
                .iter()
                .map(|comp| est_h_with_margin(comp, inner_width, &dctx))
                .sum();
            let header_height = if let Some(fixed) = header.height {
                fixed.max(0.0)
            } else {
                header
                    .min_height
                    .unwrap_or(0.0)
                    .max(estimated_height + border.0 + border.2)
                    .max(0.0)
            };
            let header_top = ph;
            let header_bottom = header_top - header_height;

            if let Some(ref shadow) = header.box_shadow {
                let color = shadow
                    .color
                    .as_deref()
                    .map(hex_to_rgb)
                    .unwrap_or([0.0, 0.0, 0.0]);
                let offset_x = shadow.offset_x.unwrap_or(0.0);
                let offset_y = shadow.offset_y.unwrap_or(4.0);
                let blur = shadow.blur.unwrap_or(10.0).max(2.0);
                let spread = shadow.spread.unwrap_or(0.0);
                let shadow_y = header_bottom - offset_y - blur / 2.0;
                content.set_fill_rgb(color[0], color[1], color[2]);
                content.rect(offset_x - spread, shadow_y, pw + spread * 2.0, blur);
                content.fill_nonzero();
            }

            if let Some(ref grad) = header.gradient {
                let start = hex_to_rgb(&grad.start_color);
                let end = hex_to_rgb(&grad.end_color);
                let direction = grad.direction.as_deref().unwrap_or("vertical");
                fill_gradient(
                    content,
                    0.0,
                    header_bottom,
                    pw,
                    header_height,
                    start,
                    end,
                    direction,
                );
            } else if let Some(ref bg) = header.background_color {
                if header_height > 0.0 {
                    let rgb = hex_to_rgb(bg);
                    content.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
                    content.rect(0.0, header_bottom, pw, header_height);
                    content.fill_nonzero();
                }
            }

            let header_border_color = header
                .border_color
                .as_deref()
                .map(|c| hex_to_rgb(c))
                .unwrap_or([0.0, 0.0, 0.0]);
            if border != (0.0, 0.0, 0.0, 0.0) {
                draw_section_border(
                    content,
                    0.0,
                    header_bottom,
                    pw,
                    header_height,
                    border,
                    header_border_color,
                    header.border_style.as_deref().unwrap_or("solid"),
                );
            }

            let mut header_cursor = header_top - border.0 - 8.0;
            let mut header_ctx = ctx;
            header_ctx.margin += border.3;
            header_ctx.content_w -= border.1 + border.3;
            for comp in &header.content {
                let mut ctx_c = header_ctx;
                render_comp(
                    content,
                    comp,
                    &mut ctx_c,
                    &dctx,
                    &mut header_cursor,
                    fr_name,
                    fb_name,
                    fi_name,
                    &image_map,
                    &mut |_, _| {},
                );
            }

            let rendered_height = header_top - header_cursor;
            let used_height = if header.height.is_some() {
                // altura fixa: cursor avança exatamente pelo valor declarado
                header_height
            } else {
                rendered_height.max(header_height)
            };
            *curs = header_top - used_height;
        }
    };

    let render_report_footer = |content: &mut Content| {
        if let Some(footer) = &report.footer {
            if footer_height > 0.0 {
                let footer_bottom = bottom_margin;
                let footer_top = footer_bottom + footer_height;

                if let Some(ref shadow) = footer.box_shadow {
                    let color = shadow
                        .color
                        .as_deref()
                        .map(hex_to_rgb)
                        .unwrap_or([0.0, 0.0, 0.0]);
                    let offset_x = shadow.offset_x.unwrap_or(0.0);
                    let offset_y = shadow.offset_y.unwrap_or(4.0);
                    let blur = shadow.blur.unwrap_or(10.0).max(2.0);
                    let spread = shadow.spread.unwrap_or(0.0);
                    let shadow_y = footer_top + offset_y;
                    content.set_fill_rgb(color[0], color[1], color[2]);
                    content.rect(offset_x - spread, shadow_y, pw + spread * 2.0, blur);
                    content.fill_nonzero();
                }

                let border = footer
                    .border
                    .as_ref()
                    .map(|b| b.resolve())
                    .unwrap_or((0.0, 0.0, 0.0, 0.0));
                if let Some(ref grad) = footer.gradient {
                    let start = hex_to_rgb(&grad.start_color);
                    let end = hex_to_rgb(&grad.end_color);
                    let direction = grad.direction.as_deref().unwrap_or("vertical");
                    fill_gradient(
                        content,
                        0.0,
                        footer_bottom,
                        pw,
                        footer_height,
                        start,
                        end,
                        direction,
                    );
                } else if let Some(ref bg) = footer.background_color {
                    let rgb = hex_to_rgb(bg);
                    content.set_fill_rgb(rgb[0], rgb[1], rgb[2]);
                    content.rect(0.0, footer_bottom, pw, footer_height);
                    content.fill_nonzero();
                }

                let footer_border_color = footer
                    .border_color
                    .as_deref()
                    .map(|c| hex_to_rgb(c))
                    .unwrap_or([0.0, 0.0, 0.0]);
                if border != (0.0, 0.0, 0.0, 0.0) {
                    draw_section_border(
                        content,
                        0.0,
                        footer_bottom,
                        pw,
                        footer_height,
                        border,
                        footer_border_color,
                        footer.border_style.as_deref().unwrap_or("solid"),
                    );
                }

                let mut footer_cursor = footer_top - border.0 - 8.0;
                let mut footer_ctx = ctx;
                footer_ctx.margin += border.3;
                footer_ctx.content_w -= border.1 + border.3;
                for comp in &footer.content {
                    let mut ctx_c = footer_ctx;
                    render_comp(
                        content,
                        comp,
                        &mut ctx_c,
                        &dctx,
                        &mut footer_cursor,
                        fr_name,
                        fb_name,
                        fi_name,
                        &image_map,
                        &mut |_, _| {},
                    );
                }
            }
        }
    };

    // Header (first page)
    fill_background(&mut current_content);
    render_report_header(&mut current_content, &mut curs);
    if footer_repeat {
        render_report_footer(&mut current_content);
    }

    // Body with page-break logic
    for comp in &report.content {
        // Estimate minimum height needed
        let est = est_h(comp, ctx.content_w, &dctx).max(20.0);
        // Page break if not enough space
        if curs - est < bottom_margin + footer_height + 20.0 {
            // Finalize current page
            let bytes = core::mem::replace(&mut current_content, Content::new())
                .finish()
                .into_vec();
            contents.push(bytes);
            content_ids.push(current_cid);
            current_cid = alloc();
            // Reset cursor
            curs = ph - margin.0;
            fill_background(&mut current_content);
            if header_repeat {
                render_report_header(&mut current_content, &mut curs);
            }
            if footer_repeat {
                render_report_footer(&mut current_content);
            }
        }
        let mut ctx_c = ctx;
        render_comp(
            &mut current_content,
            comp,
            &mut ctx_c,
            &dctx,
            &mut curs,
            fr_name,
            fb_name,
            fi_name,
            &image_map,
            &mut |c: &mut Content, curs: &mut f32| {
                let bytes = core::mem::replace(c, Content::new()).finish().into_vec();
                contents.push(bytes);
                content_ids.push(current_cid);
                current_cid = alloc();
                *curs = ph - margin.0;
                fill_background(c);
                if header_repeat {
                    render_report_header(c, curs);
                }
                if footer_repeat {
                    render_report_footer(c);
                }
            },
        );
    }

    // Finalize last page
    if report.footer.is_some() && !footer_repeat {
        render_report_footer(&mut current_content);
    }
    {
        let bytes = current_content.finish().into_vec();
        contents.push(bytes);
        content_ids.push(current_cid);
    }

    // Replace any reserved placeholders after the page count is known
    let page_count = contents.len();
    replace_page_placeholders(&mut contents, page_count);

    // Create page objects
    let mut page_refs: Vec<Ref> = Vec::with_capacity(content_ids.len());
    for (idx, cid) in content_ids.iter().enumerate() {
        let pid = alloc();
        page_refs.push(pid);
        {
            let mut page = pdf.page(pid);
            page.parent(pages_id);
            page.media_box(Rect::new(0.0, 0.0, pw, ph));
            {
                let mut res = page.resources();
                let mut fonts = res.fonts();
                fonts.pair(Name(b"F1"), fr_id);
                fonts.pair(Name(b"F2"), fb_id);
                fonts.pair(Name(b"F3"), fi_id);
                fonts.finish();
                // Registra XObjects de imagem (apenas entradas sem erro)
                let valid_images: Vec<&ImageInfo> = image_map.values()
                    .filter(|i| i.error.is_none() && !i.xobj_name.is_empty())
                    .collect();
                if !valid_images.is_empty() {
                    let mut xobjs = res.x_objects();
                    for info in &valid_images {
                        xobjs.pair(Name(info.xobj_name.as_slice()), info.ref_id);
                    }
                    xobjs.finish();
                }
            }
            page.contents(*cid);
            page.finish();
        }
    }

    // Pages object
    {
        let mut pages = pdf.pages(pages_id);
        pages.media_box(Rect::new(0.0, 0.0, pw, ph));
        pages.kids(page_refs.iter().map(|r| *r));
        pages.count(page_refs.len() as i32);
        pages.finish();
    }

    // Streams
    for (idx, bytes) in contents.iter().enumerate() {
        pdf.stream(content_ids[idx], bytes);
    }

    let out = pdf.finish();
    out
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(js_name = generate_pdf_v3)]
pub fn generate_pdf_v3_wasm(
    report_json: &str,
    datasets_json: &str,
    variables_json: &str,
) -> Vec<u8> {
    console_error_panic_hook::set_once();
    generate_pdf_v3_inner(report_json, datasets_json, variables_json)
}
