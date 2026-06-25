use chrono::{DateTime, Datelike, Local, NaiveDate, NaiveDateTime, Timelike, Utc};
use rust_xlsxwriter::*;
use std::collections::HashMap;
use std::str::FromStr;

use base64::{Engine as _, engine::general_purpose::STANDARD as B64};
use serde_json::Value;

use crate::modelsv3::*;

//=====================================================================
//                               CORE
//=====================================================================

pub fn gerar(json: &str) -> Vec<u8> {
    //PEGO JSON PARA TRATAR
    let report: ExcelReport = match serde_json::from_str(json) {
        Ok(r) => r,
        Err(e) => {
            web_sys::console::log_1(&format!("ERRO NO PARSE DO JSON: {}", e).into());
            web_sys::console::log_1(&format!("Linha: {}, Coluna: {}", e.line(), e.column()).into());

            // Mostra o trecho do JSON onde deu erro
            let pos = e.column() as usize;
            let start = pos.saturating_sub(100);
            let end = (pos + 100).min(json.len());
            web_sys::console::log_1(&format!("Trecho do JSON: ...{}...", &json[start..end]).into());

            panic!("Erro no JSON: {}", e);
        }
    };

    //PEGO A CONFIG
    let config = report.config.as_ref();
    let row_height = config.and_then(|c| c.row_height).unwrap_or(40);
    let header_bg = config
        .and_then(|c| c.header_background.as_ref())
        .and_then(|hex| hex_to_rgb(hex))
        .unwrap_or(0x1F2937);
    let header_fg = config
        .and_then(|c| c.header_foreground.as_ref())
        .and_then(|hex| hex_to_rgb(hex))
        .unwrap_or(0xFFFFFF);
    let zebra_bg = config
        .and_then(|c| c.zebra_background.as_ref())
        .and_then(|hex| hex_to_rgb(hex))
        .unwrap_or(0xF9FAFB);
    let zebra_fg = config
        .and_then(|c| c.zebra_foreground.as_ref())
        .and_then(|hex| hex_to_rgb(hex))
        .unwrap_or(0x000000);
    let row_bg = config
        .and_then(|c| c.row_background.as_ref())
        .and_then(|hex| hex_to_rgb(hex))
        .unwrap_or(0xFFFFFF);
    let row_fg = config
        .and_then(|c| c.row_foreground.as_ref())
        .and_then(|hex| hex_to_rgb(hex))
        .unwrap_or(0x000000);
    let header_border = config
        .and_then(|c| c.border_style.as_ref())
        .and_then(|v| parse_border_style(v))
        .unwrap_or(FormatBorder::None);

    //CHAMAR LIB EXCEL
    let mut workbook = Workbook::new();

    let mut current_row = 0;

    //step 3 renderizar componentes
    for component in report.content {
        match component {
            Component::Table(table) => {
                //CRIAR O WORKSHEET
                let worksheet = workbook.add_worksheet();

                //verifico se o workseet tem um nome para por
                if let Some(name) = &table.sheet_name {
                    web_sys::console::log_1(&"Esta setando o nome do sheet".into());
                    worksheet.set_name(name).unwrap();
                }

                worksheet.set_screen_gridlines(false); // esconde as grids
                worksheet.set_print_gridlines(false); // esconde as grid quando for gerar pdf
                worksheet.set_column_width(0, 18).unwrap();
                worksheet.set_row_height(0, 60).unwrap();

                //VERIFICAR SE TEM A LOGO TRANFORMAR IMAGEM
                let logo = report.variables.get("logoSistema").and_then(|base64| {
                    let image = image_from_base64(base64).ok()?;

                    let target_width = 200.0;
                    let scale = target_width / image.width() as f64;

                    Some(image.set_scale_width(scale).set_scale_height(scale))
                });

                //step 1 renderizar o header
                let header = report.header.as_ref().unwrap();
                render_header(
                    worksheet,
                    logo.as_ref(),
                    &header.title,
                    &header.company_name,
                );

                current_row = 2;

                //setp 2 Renderizar filtros~

                if let Some(filters) = &header.filters {
                    let mut filters_join = String::new();
                    filters_join.push_str("Filtros: ");
                    filters_join.push_str(
                        &filters
                            .iter()
                            .map(|f| format!("{}: {}", f.key, f.value))
                            .collect::<Vec<_>>()
                            .join(" | ")
                            .to_string(),
                    );

                    render_filters(worksheet, &filters_join);
                }

                let last_col_render = table
                    .table_header
                    .as_ref()
                    .and_then(|th| th.last())
                    .map(|t| t.cols[1])
                    .or_else(|| {
                        table
                            .childrens
                            .as_ref()
                            .and_then(|childrens| childrens.first())
                            .and_then(|child| child.table_header.last())
                            .map(|t| t.cols[1])
                    })
                    .unwrap_or(10);

                if let Some(dataset) = report.datasets.get(&table.dataset_name) {
                    web_sys::console::log_1(
                        &format!("O dadaset que ta batendo é o {}", &table.dataset_name).into(),
                    );
                    //verificando se tem agrupamento para fazer
                    if let Some(grouping) = &table.grouping {
                        let gap = grouping.gap.unwrap_or(2);
                        let mut groups: HashMap<String, Vec<Value>> = HashMap::new();
                        for item in dataset {
                            if let Some(group_value) = item.get(&grouping.group_by) {
                                let key = match group_value {
                                    Value::String(s) => s.clone(),
                                    Value::Number(n) => n.to_string(),
                                    Value::Bool(b) => b.to_string(),
                                    _ => group_value.to_string(),
                                };

                                groups
                                    .entry(key)
                                    .or_insert_with(Vec::new)
                                    .push(item.clone());
                            }
                        }

                        for (g_name, g_values) in groups {
                            web_sys::console::log_1(&format!("Nome do grupo {}", g_name).into());
                            let bg_color = report
                                .config
                                .as_ref()
                                .and_then(|c| c.primary_color.as_ref())
                                .and_then(|hex| hex_to_rgb(hex))
                                .unwrap_or(0xE5E7EB);
                            worksheet
                                .merge_range(
                                    current_row,
                                    1,
                                    current_row,
                                    last_col_render as u16,
                                    &apply_mask(
                                        &g_name.into(),
                                        grouping
                                            .group_header_mask
                                            .as_ref()
                                            .unwrap_or(&"Nenhum".to_string()),
                                    ),
                                    &Format::new()
                                        .set_bold()
                                        .set_background_color(bg_color)
                                        .set_font_color(Color::White),
                                )
                                .unwrap();
                            current_row += 1;
                            current_row = render_table(
                                worksheet,
                                &table,
                                current_row,
                                &g_values,
                                row_height,
                                header_bg,
                                header_fg,
                                zebra_bg,
                                zebra_fg,
                                row_bg,
                                row_fg,
                                header_border,
                            );
                            current_row += gap;
                        }

                        //renderizar totais sumaryBox

                        //pegar a ultima coluna renderizada para saber o meio
                        if let Some(sumary) = &table.summary_box {
                            let mut total_text = String::new();
                            let mut qtd_rows: u32 = 0;

                            for (_index, sumary_row) in sumary.rows.iter().enumerate() {
                                qtd_rows += 1;
                                total_text = sumary
                                    .rows
                                    .iter()
                                    .map(|row| {
                                        let soma: f64 = dataset
                                            .iter()
                                            .filter_map(|item| item.get(&sumary_row.key))
                                            .filter_map(|v| v.as_f64())
                                            .sum();
                                        format!(
                                            "{}:    {}",
                                            row.label,
                                            apply_mask_f64(
                                                soma,
                                                &sumary_row
                                                    .mask
                                                    .as_ref()
                                                    .unwrap_or(&"number".to_string())
                                            )
                                        )
                                    })
                                    .collect::<Vec<_>>()
                                    .join("\n");
                            }

                            let meio = last_col_render / 2;

                            let first_col = meio - 2;
                            let last_col = meio + 2;
                            if qtd_rows > 0 {
                                for r in 0..=qtd_rows + 1 {
                                    worksheet.set_row_height(current_row + r, 25).unwrap();
                                }
                            }

                            worksheet
                                .merge_range(
                                    current_row,
                                    first_col as u16,
                                    current_row + qtd_rows,
                                    last_col as u16,
                                    &total_text,
                                    &Format::new()
                                        .set_border(FormatBorder::Medium)
                                        .set_border_color(Color::Black)
                                        .set_align(FormatAlign::Center)
                                        .set_align(FormatAlign::VerticalCenter)
                                        .set_text_wrap()
                                        .set_font_name("Segoe UI")
                                        .set_bold()
                                        .set_font_color(Color::Black),
                                )
                                .unwrap();
                        }
                    } else {
                        current_row = render_table(
                            worksheet,
                            &table,
                            current_row,
                            dataset,
                            row_height,
                            header_bg,
                            header_fg,
                            zebra_bg,
                            zebra_fg,
                            row_bg,
                            row_fg,
                            header_border,
                        );
                    }
                }

                //step 4 renderizar o footer rodapé
                current_row += 5;

                let now = Local::now();
                let data_formatada = format!(
                    "{:02}/{:02}/{} às {:02}:{:02}",
                    now.day(),
                    now.month0(),
                    now.year(),
                    now.hour(),
                    now.minute()
                );

                worksheet
                    .merge_range(
                        current_row,
                        1,
                        current_row,
                        3,
                        &format!("Emitido em {}", data_formatada),
                        &format_filters(),
                    )
                    .unwrap();
                let meio = last_col_render / 2;
                if meio - 1 != 3 {
                    worksheet
                        .merge_range(
                            current_row,
                            (meio as u16) - 1,
                            current_row,
                            (meio as u16) + 1 as u16,
                            "www.datasetsistemas.com.br",
                            &&Format::new().set_align(FormatAlign::Center),
                        )
                        .unwrap();
                } else {
                    worksheet
                        .merge_range(
                            current_row,
                            meio as u16,
                            current_row,
                            (meio as u16) + 2 as u16,
                            "www.datasetsistemas.com.br",
                            &&Format::new().set_align(FormatAlign::Center),
                        )
                        .unwrap();
                }
            }
        }
    }

    workbook.save_to_buffer().unwrap()
}

//=====================================================================
//                       RENDERS EM ORDEM DE STEPS
//=====================================================================

fn render_header(
    worksheet: &mut Worksheet,
    image: Option<&Image>,
    title: &str,
    company_info: &str,
) {
    if let Some(img) = image {
        worksheet
            .insert_image_with_offset(0, 1, img, 0, 10)
            .unwrap();
    }

    worksheet
        .merge_range(0, 4, 0, 13, title, &header_title_format())
        .unwrap();

    worksheet
        .merge_range(0, 14, 0, 16, company_info, &company_info_format())
        .unwrap();
}

fn render_filters(worksheet: &mut Worksheet, filters: &str) {
    worksheet
        .merge_range(1, 1, 1, 16, filters, &format_filters())
        .unwrap();
}

fn render_table(
    worksheet: &mut Worksheet,
    table: &TableComponent,
    start_row: u32,
    dataset: &Vec<Value>,
    row_height: u8,
    header_bg: u32,
    header_fg: u32,
    zebra_bg: u32,
    zebra_fg: u32,
    row_bg: u32,
    row_fg: u32,
    header_border: FormatBorder,
) -> u32 {
    let mut row = start_row;
    if let Some(table_header) = &table.table_header {
        row = render_table_header(
            worksheet,
            table,
            row,
            row_height,
            header_bg,
            header_fg,
            header_border,
        );
    }
    row = render_table_rows(
        worksheet, table, row, dataset, row_height, zebra_bg, zebra_fg, row_bg, row_fg,
    );
    //verifico se soma algo para poder printar totais
    if let Some(table_header) = &table.table_header {
        if table_header.iter().any(|f| f.sum.unwrap_or(false) == true) {
            row = render_totals_rows(worksheet, table, row, dataset);
        }
    }
    let dataset_len = dataset.len();
    //mostrar quantidade de registros
    if dataset_len > 0 {
        row += 1;
        let last_col = table
            .table_header
            .as_ref()
            .and_then(|header| header.last())
            .map(|col| col.cols[1])
            .or_else(|| {
                table
                    .childrens
                    .as_ref()
                    .and_then(|childrens| childrens.first())
                    .map(|c| c.table_header.last().map(|ch| ch.cols[1]).unwrap_or(10))
            })
            .unwrap_or(10);
        worksheet
            .merge_range(
                row,
                1,
                row,
                last_col as u16,
                &format!("Registros {}", dataset_len.to_string()),
                &format_filters(),
            )
            .unwrap();
    }

    row
}

pub fn render_table_header(
    worksheet: &mut Worksheet,
    table: &TableComponent,
    row: u32,
    row_height: u8,
    header_bg: u32,
    header_fg: u32,
    header_border: FormatBorder,
) -> u32 {
    if let Some(table_header) = &table.table_header {
        for column in table_header {
            worksheet.set_row_height(row, row_height).unwrap();

            let [start, end] = column.cols;
            let align = column.header_align.as_deref().unwrap_or("center");
            if start == end {
                worksheet
                    .write_with_format(
                        row,
                        start as u16,
                        &column.prefix,
                        &table_header_format(align)
                            .set_background_color(header_bg)
                            .set_font_color(header_fg)
                            .set_border(header_border),
                    )
                    .unwrap();
            } else {
                worksheet
                    .merge_range(
                        row,
                        start as u16,
                        row,
                        end as u16,
                        &column.prefix,
                        &table_header_format(align)
                            .set_background_color(header_bg)
                            .set_font_color(header_fg)
                            .set_border(header_border),
                    )
                    .unwrap();
            }
        }
    }

    row + 1
}

fn render_table_rows(
    worksheet: &mut Worksheet,
    table: &TableComponent,
    start_row: u32,
    dataset: &Vec<Value>,
    row_height: u8,
    zebra_bg: u32,
    zebra_fg: u32,
    row_bg: u32,
    row_fg: u32,
) -> u32 {
    let mut row = start_row;

    for (index, item) in dataset.iter().enumerate() {
        worksheet.set_row_height(row, row_height).unwrap();
        if let Some(table_header) = &table.table_header {
            for column in table_header {
                let [start_col, end_col] = column.cols;

                let align = column.align.as_deref().unwrap_or("center");

                let format = if index % 2 == 0 {
                    table_row_even_format(align)
                        .set_background_color(row_bg)
                        .set_font_color(row_fg)
                } else {
                    table_row_odd_format(align)
                        .set_background_color(zebra_bg)
                        .set_font_color(zebra_fg)
                };
                // web_sys::console::log_1(&"Estou debugando....".into());
                let value = item.get(&column.key);
                let formated_value = apply_mask(
                    value.unwrap_or_default(),
                    &column.mask.as_ref().unwrap_or(&"nenhum".to_string()),
                );

                // web_sys::console::log_1(&format!("campo={} valor={:?}", column.key, value).into());

                if start_col == end_col {
                    worksheet
                        .write_with_format(row, start_col as u16, formated_value, &format)
                        .unwrap();
                } else {
                    worksheet
                        .merge_range(
                            row,
                            start_col as u16,
                            row,
                            end_col as u16,
                            &formated_value,
                            &format,
                        )
                        .unwrap();
                }
            }
        }

        row += 1;

        //verifico se não tem itens
        if let Some(childrens) = &table.childrens {
            for c in childrens {
                let pre_header_path = if let Some(path) = &c.pre_header_path {
                    item.get(path).map(|v| apply_mask(v, "string"))
                } else {
                    None
                };

                if let Some(value) = item.get(&c.path) {
                    if value.is_array() {
                        row = render_children(
                            row,
                            worksheet,
                            value.as_array().unwrap(),
                            &c.table_header,
                            c.margin_top.unwrap_or(0),
                            c.margin_bottom.unwrap_or(3),
                            &c.pre_header,
                            &pre_header_path,
                        );
                    }
                }
            }
        }
    }

    row
}

fn render_children(
    row: u32,
    worksheet: &mut Worksheet,
    dataset: &Vec<Value>,
    table_header: &Vec<ExcelTableColumn>,
    margin_top: u8,
    margin_bottom: u8,
    pre_header: &Option<String>,
    pre_header_path: &Option<String>,
) -> u32 {
    let mut current_row = row;

    if margin_top > 0 {
        current_row += margin_top as u32;
    }

    //renderizo o pre header
    if let Some(pre_header) = pre_header {
        let first_col = table_header.first().as_deref().unwrap().cols[0];
        let last_col = table_header.last().as_deref().unwrap().cols[1];
        worksheet
            .merge_range(
                current_row,
                first_col as u16,
                current_row,
                last_col as u16,
                pre_header,
                &Format::new().set_bold(),
            )
            .unwrap();
        current_row += 1;
    }
    if let Some(header_path) = pre_header_path {
        let first_col = table_header.first().as_deref().unwrap().cols[0];
        let last_col = table_header.last().as_deref().unwrap().cols[1];

        worksheet
            .merge_range(
                current_row,
                first_col as u16,
                current_row,
                last_col as u16,
                header_path,
                &Format::new().set_bold(),
            )
            .unwrap();
        current_row += 1;
    }

    //renderizar o header do children
    for t in table_header {
        if is_same_col(t.cols[0], t.cols[1]) {
            worksheet
                .write_with_format(
                    current_row,
                    t.cols[0] as u16,
                    &t.prefix,
                    &table_children_header_format(
                        &t.align.as_deref().unwrap_or(&"center".to_string()),
                    ),
                )
                .unwrap();
        } else {
            worksheet
                .merge_range(
                    current_row,
                    t.cols[0] as u16,
                    current_row,
                    t.cols[1] as u16,
                    &t.prefix,
                    &table_children_header_format(
                        &t.align.as_deref().unwrap_or(&"center".to_string()),
                    ),
                )
                .unwrap();
        }
    }
    current_row += 1;

    for v in dataset {
        for t in table_header {
            if let Some(value) = v.get(&t.key) {
                if is_same_col(t.cols[0], t.cols[1]) {
                    worksheet
                        .write_with_format(
                            current_row,
                            t.cols[0] as u16,
                            apply_mask(value, t.mask.as_ref().unwrap_or(&"Nenhum".to_string())),
                            &table_row_even_format(
                                &t.align.as_deref().unwrap_or(&"center".to_string()),
                            ),
                        )
                        .unwrap();
                } else {
                    worksheet
                        .merge_range(
                            current_row,
                            t.cols[0] as u16,
                            current_row,
                            t.cols[1] as u16,
                            &apply_mask(value, t.mask.as_ref().unwrap_or(&"Nenhum".to_string())),
                            &table_row_even_format(
                                &t.align.as_deref().unwrap_or(&"center".to_string()),
                            ),
                        )
                        .unwrap();
                }
            }
        }

        current_row += 1;
    }

    //renderizar compos que somam nos itens
    for t in table_header {
        if let Some(_sum) = t.sum {
            let soma: f64 = dataset
                .iter()
                .filter_map(|v| v.get(&t.key))
                .filter_map(|i| i.as_f64())
                .sum();

            if is_same_col(t.cols[0], t.cols[1]) {
                worksheet
                    .write_with_format(
                        current_row,
                        t.cols[0] as u16,
                        apply_mask_f64(soma, t.mask.as_ref().unwrap_or(&"Nenhum".to_string())),
                        &table_row_totals_format(
                            &t.align.as_deref().unwrap_or(&"center".to_string()),
                        ),
                    )
                    .unwrap();
            } else {
                worksheet
                    .merge_range(
                        current_row,
                        t.cols[0] as u16,
                        current_row,
                        t.cols[1] as u16,
                        &apply_mask_f64(soma, t.mask.as_ref().unwrap_or(&"Nenhum".to_string())),
                        &table_row_totals_format(
                            &t.align.as_deref().unwrap_or(&"center".to_string()),
                        ),
                    )
                    .unwrap();
            }
        }
    }

    current_row + margin_bottom as u32
}

fn render_totals_rows(
    worksheet: &mut Worksheet,
    table: &TableComponent,
    row: u32,
    dataset: &Vec<Value>,
) -> u32 {
    if let Some(table_header) = &table.table_header {
        for (index, column) in table_header.iter().enumerate() {
            if index == 0 && column.sum.unwrap_or(false) == false {
                //primeiro index não soma , entao vou colocar nome total
                if is_same_col(column.cols[0], column.cols[1]) {
                    worksheet
                        .write_with_format(
                            row,
                            column.cols[0] as u16,
                            "TOTAL",
                            &table_row_totals_format("left"),
                        )
                        .unwrap();
                } else {
                    worksheet
                        .merge_range(
                            row,
                            column.cols[0] as u16,
                            row,
                            column.cols[1] as u16,
                            "TOTAL",
                            &table_row_totals_format("left"),
                        )
                        .unwrap();
                }
            } else {
                if column.sum.unwrap_or(false) == false {
                    if column.cols[0] == column.cols[1] {
                        worksheet
                            .write_with_format(
                                row,
                                column.cols[0] as u16,
                                " ",
                                &table_row_totals_format(
                                    &column.align.as_deref().unwrap_or("center"),
                                ),
                            )
                            .unwrap();
                    } else {
                        worksheet
                            .merge_range(
                                row,
                                column.cols[0] as u16,
                                row,
                                column.cols[1] as u16,
                                " ",
                                &table_row_totals_format(
                                    &column.align.as_deref().unwrap_or("center"),
                                ),
                            )
                            .unwrap();
                    }
                } else {
                    let sum_result: f64 = dataset
                        .iter()
                        .filter_map(|item| item.get(&column.key).and_then(|v| v.as_f64()))
                        .sum();
                    if column.cols[0] == column.cols[1] {
                        worksheet
                            .write_with_format(
                                row,
                                column.cols[0] as u16,
                                &apply_mask_f64(sum_result, &"monetary".to_string()),
                                &table_row_totals_format(
                                    &column.align.as_deref().unwrap_or("center"),
                                ),
                            )
                            .unwrap();
                    } else {
                        worksheet
                            .merge_range(
                                row,
                                column.cols[0] as u16,
                                row,
                                column.cols[1] as u16,
                                &apply_mask_f64(sum_result, &"monetary".to_string()),
                                &table_row_totals_format(
                                    &column.align.as_deref().unwrap_or("center"),
                                ),
                            )
                            .unwrap();
                    }
                }
            }
        }
    }

    row + 1
}

//=====================================================================
//                          FUNCOES ULTILITARIAS
//=====================================================================

fn is_same_col(first_col: u8, last_col: u8) -> bool {
    return first_col == last_col;
}

fn parse_border_style(value: &str) -> Option<FormatBorder> {
    match value.to_lowercase().as_str() {
        "none" => Some(FormatBorder::None),
        "thin" => Some(FormatBorder::Thin),
        "medium" => Some(FormatBorder::Medium),
        "thick" => Some(FormatBorder::Thick),
        "dashed" => Some(FormatBorder::Dashed),
        "dotted" => Some(FormatBorder::Dotted),
        "double" => Some(FormatBorder::Double),
        "hair" => Some(FormatBorder::Hair),
        "medium_dashed" => Some(FormatBorder::MediumDashed),
        "dash_dot" => Some(FormatBorder::DashDot),
        "medium_dash_dot" => Some(FormatBorder::MediumDashDot),
        "dash_dot_dot" => Some(FormatBorder::DashDotDot),
        "medium_dash_dot_dot" => Some(FormatBorder::MediumDashDotDot),
        "slant_dash_dot" => Some(FormatBorder::SlantDashDot),
        _ => None,
    }
}

fn apply_mask(value: &Value, mask: &str) -> String {
    let clean_value = match value {
        Value::Null => "".to_string(),
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        _ => value.to_string().replace('"', ""),
    };

    match mask {
        "monetary" => {
            let num = value.as_f64().unwrap_or(0.0);
            let int_part = num.trunc() as i64;
            let dec_part = ((num.abs() - num.trunc().abs()) * 100.0).round() as i64;
            let formatted_int = int_part
                .abs()
                .to_string()
                .chars()
                .rev()
                .collect::<Vec<_>>()
                .chunks(3)
                .map(|c| c.iter().collect::<String>())
                .collect::<Vec<_>>()
                .join(".")
                .chars()
                .rev()
                .collect::<String>();
            let sign = if int_part < 0 { "-" } else { "" };
            format!("R$ {}{},{:02}", sign, formatted_int, dec_part)
        }
        "percent" => {
            let num = value.as_f64().unwrap_or(0.0);
            format!("{:.1}%", num * 100.0)
        }
        "number" => {
            let num = value.as_f64().unwrap_or(0.0);

            format!("{:.0}", num)
        }
        "number-3" => {
            let num = value.as_f64().unwrap_or(0.0);

            format!("{:.3}", num)
        }
        "decimal" => {
            let num = value.as_f64().unwrap_or(0.0);
            let int_part = num.trunc() as i64;
            let dec_part = ((num.abs() - num.trunc().abs()) * 100.0).round() as i64;
            let formatted_int = int_part
                .abs()
                .to_string()
                .chars()
                .rev()
                .collect::<Vec<_>>()
                .chunks(3)
                .map(|c| c.iter().collect::<String>())
                .collect::<Vec<_>>()
                .join(".")
                .chars()
                .rev()
                .collect::<String>();
            let sign = if int_part < 0 { "-" } else { "" };
            format!("{}{},{:02}", sign, formatted_int, dec_part)
        }
        "milhar" => {
            let num = value.as_f64().unwrap_or(0.0);
            let rounded = num.round() as i64;
            let formatted = rounded
                .abs()
                .to_string()
                .chars()
                .rev()
                .collect::<Vec<_>>()
                .chunks(3)
                .map(|c| c.iter().collect::<String>())
                .collect::<Vec<_>>()
                .join(".")
                .chars()
                .rev()
                .collect::<String>();
            if rounded < 0 {
                format!("-{}", formatted)
            } else {
                formatted
            }
        }
        "date" => {
            if let Some(s) = value.as_str() {
                parse_and_format_date(s, "%d/%m/%Y")
            } else {
                clean_value
            }
        }
        "datetime" => {
            if let Some(s) = value.as_str() {
                parse_and_format_date(s, "%d/%m/%Y %H:%M:%S")
            } else {
                clean_value
            }
        }
        "time" => {
            if let Some(s) = value.as_str() {
                parse_and_format_date(s, "%H:%M:%S")
            } else {
                clean_value
            }
        }
        _ => clean_value,
    }
}

fn apply_mask_f64(value: f64, mask: &str) -> String {
    match mask {
        "monetary" => {
            let int_part = value.trunc() as i64;
            let dec_part = ((value.abs() - value.trunc().abs()) * 100.0).round() as i64;
            let formatted_int = int_part
                .abs()
                .to_string()
                .chars()
                .rev()
                .collect::<Vec<_>>()
                .chunks(3)
                .map(|c| c.iter().collect::<String>())
                .collect::<Vec<_>>()
                .join(".")
                .chars()
                .rev()
                .collect::<String>();
            let sign = if int_part < 0 { "-" } else { "" };
            format!("R$ {}{},{:02}", sign, formatted_int, dec_part)
        }
        "percent" => format!("{:.1}%", value * 100.0),
        "number" => format!("{:.0}", value),
        "number-3" => {
            format!("{:.3}", value)
        }
        "decimal" => {
            let int_part = value.trunc() as i64;
            let dec_part = ((value.abs() - value.trunc().abs()) * 100.0).round() as i64;
            let formatted_int = int_part
                .abs()
                .to_string()
                .chars()
                .rev()
                .collect::<Vec<_>>()
                .chunks(3)
                .map(|c| c.iter().collect::<String>())
                .collect::<Vec<_>>()
                .join(".")
                .chars()
                .rev()
                .collect::<String>();
            let sign = if int_part < 0 { "-" } else { "" };
            format!("{}{},{:02}", sign, formatted_int, dec_part)
        }
        "milhar" => {
            let rounded = value.round() as i64;
            let formatted = rounded
                .abs()
                .to_string()
                .chars()
                .rev()
                .collect::<Vec<_>>()
                .chunks(3)
                .map(|c| c.iter().collect::<String>())
                .collect::<Vec<_>>()
                .join(".")
                .chars()
                .rev()
                .collect::<String>();
            if rounded < 0 {
                format!("-{}", formatted)
            } else {
                formatted
            }
        }
        _ => value.to_string(),
    }
}

fn parse_and_format_date(date_str: &str, format_str: &str) -> String {
    // Tenta parsear como ISO 8601 (com T e Z)
    if let Ok(dt) = DateTime::parse_from_rfc3339(date_str) {
        return dt.format(format_str).to_string();
    }

    if let Ok(dt) = DateTime::<Utc>::from_str(date_str) {
        return dt.format(format_str).to_string();
    }

    // Tenta parsear como NaiveDateTime (sem timezone)
    if let Ok(dt) = NaiveDateTime::parse_from_str(date_str, "%Y-%m-%dT%H:%M:%S") {
        return dt.format(format_str).to_string();
    }

    // Tenta parsear como NaiveDateTime com milissegundos
    if let Ok(dt) = NaiveDateTime::parse_from_str(date_str, "%Y-%m-%dT%H:%M:%S%.f") {
        return dt.format(format_str).to_string();
    }

    // Tenta parsear como data simples
    if let Ok(d) = NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        return d.format(format_str).to_string();
    }

    // Se nada funcionar, retorna o original
    date_str.to_string()
}

fn hex_to_rgb(hex: &str) -> Option<u32> {
    let hex = hex.trim_start_matches('#');
    if hex.len() == 6 {
        u32::from_str_radix(hex, 16).ok()
    } else {
        None
    }
}
fn image_from_base64(base64_str: &str) -> Result<Image, String> {
    let b64_clean = if let Some(pos) = base64_str.find(',') {
        &base64_str[pos + 1..]
    } else {
        base64_str
    };

    let raw = B64
        .decode(b64_clean.trim())
        .map_err(|e| format!("Falha ao decodificar base64: {}", e))?;

    let is_jpeg = raw.len() >= 3 && raw[0] == 0xFF && raw[1] == 0xD8;

    let is_png = raw.len() >= 8 && &raw[0..8] == b"\x89PNG\r\n\x1a\n";

    if !is_jpeg && !is_png {
        return Err("Formato não suportado. Esperado PNG ou JPEG".to_string());
    }
    Image::new_from_buffer(&raw).map_err(|e| format!("Erro criando imagem: {:?}", e))
}

//=====================================================================
//                          FORMATAÇÕES E ESTILOS
//=====================================================================
fn get_align(align: &str) -> FormatAlign {
    let align = match align {
        "left" => FormatAlign::Left,
        "right" => FormatAlign::Right,
        _ => FormatAlign::Center,
    };
    align
}

fn header_title_format() -> Format {
    Format::new()
        .set_font_name("Aptos")
        .set_font_size(20.0)
        .set_bold()
        .set_font_color(Color::RGB(0x111827))
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
}

fn company_info_format() -> Format {
    Format::new()
        .set_font_name("Aptos")
        .set_font_size(10)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_text_wrap()
}

fn format_filters() -> Format {
    Format::new()
        .set_font_color(Color::RGB(0x808080))
        .set_font_size(9)
        .set_align(FormatAlign::Left)
}

fn table_header_format(align: &str) -> Format {
    Format::new()
        .set_font_name("Segoe UI")
        .set_font_size(10)
        .set_bold()
        .set_font_color(Color::White)
        .set_background_color(Color::RGB(0x1F2937))
        .set_align(get_align(align))
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin)
}

fn table_row_even_format(align: &str) -> Format {
    Format::new()
        .set_font_name("Aptos")
        .set_font_size(10)
        .set_background_color(Color::RGB(0xF9FAFB))
        .set_border(FormatBorder::Thin)
        .set_border_color(Color::RGB(0xE5E7EB))
        .set_align(get_align(align))
        .set_align(FormatAlign::VerticalCenter)
}

fn table_row_odd_format(align: &str) -> Format {
    Format::new()
        .set_font_name("Aptos")
        .set_font_size(10)
        .set_background_color(Color::White)
        .set_border(FormatBorder::Thin)
        .set_border_color(Color::RGB(0xE5E7EB))
        .set_align(get_align(align))
        .set_align(FormatAlign::VerticalCenter)
}

fn table_row_totals_format(align: &str) -> Format {
    Format::new()
        .set_font_name("Aptos")
        .set_font_size(12)
        .set_border_top(FormatBorder::MediumDashed)
        .set_align(get_align(align))
        .set_bold()
        .set_border_color(Color::Gray)
}

fn table_children_header_format(align: &str) -> Format {
    Format::new()
        .set_bold()
        .set_align(get_align(align))
        .set_align(FormatAlign::VerticalCenter)
        .set_font_color(Color::Black)
        .set_border_top(FormatBorder::Medium)
        .set_border_bottom(FormatBorder::Medium)
}
