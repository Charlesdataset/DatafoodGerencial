use crate::models::*;
use rust_xlsxwriter::*;
use serde_json::Value;

pub fn gerar(json: &str) -> Vec<u8> {
    let report: ExcelReport = serde_json::from_str(json).unwrap();

    let mut workbook = Workbook::new();

    workbook.set_properties(
        &DocProperties::new()
            .set_author("excel-wasm")
            .set_company("Dataset Sistemas"),
    );

    let worksheet = workbook.add_worksheet();

    worksheet.set_screen_gridlines(false);
    worksheet.set_print_gridlines(false);

    worksheet.set_default_row_height(28.0);

    let mut row: u32 = 0;

    if let Some(header) = &report.header {
        render_header(worksheet, &report.variables, header, &mut row);
    }

    for component in &report.content {
        match component {
            Component::Table(table) => {
                render_table(worksheet, &report.datasets, table, &mut row);
            }
        }
    }

    workbook.save_to_buffer().unwrap()
}

fn render_header(
    worksheet: &mut Worksheet,
    variables: &std::collections::HashMap<String, String>,
    header: &HeaderComponent,
    row: &mut u32,
) {
    worksheet
        .merge_range(
            *row,
            2,
            *row,
            8,
            &replace_variables(&header.title, variables),
            &report_title_format(),
        )
        .unwrap();

    *row += 1;

    worksheet
        .merge_range(
            *row,
            0,
            *row,
            3,
            &replace_variables(&header.company_name, variables),
            &company_format(),
        )
        .unwrap();

    worksheet
        .merge_range(
            *row,
            4,
            *row,
            6,
            &replace_variables(&header.document, variables),
            &document_format(),
        )
        .unwrap();

    *row += 3;
}

fn render_table(
    worksheet: &mut Worksheet,
    datasets: &std::collections::HashMap<String, Vec<Value>>,
    table: &TableComponent,
    row: &mut u32,
) {
    let Some(dataset) = datasets.get(&table.dataset_name) else {
        return;
    };

    for (col, header) in table.table_header.iter().enumerate() {
        worksheet
            .write_with_format(*row, col as u16, &header.prefix, &table_header_format())
            .unwrap();
    }

    *row += 1;

    for (index, record) in dataset.iter().enumerate() {
        let format = if index % 2 == 0 {
            row_even_format()
        } else {
            row_odd_format()
        };

        for (col, column) in table.table_header.iter().enumerate() {
            let value = extract_value(record, &column.key);

            worksheet
                .write_with_format(*row, col as u16, value, &format)
                .unwrap();
        }

        *row += 1;
    }

    if let Some(summary) = &table.summary_box {
        *row += 1;

        render_summary(worksheet, dataset, summary, row);
    }

    *row += 2;
}

fn render_summary(
    worksheet: &mut Worksheet,
    dataset: &[Value],
    summary: &SummaryBox,
    row: &mut u32,
) {
    worksheet
        .merge_range(*row, 0, *row, 2, "RESUMO", &summary_title_format())
        .unwrap();

    *row += 1;

    for item in &summary.rows {
        let mut total = 0.0;

        for record in dataset {
            if let Some(value) = record.get(&item.key) {
                total += value.as_f64().unwrap_or(0.0);
            }
        }

        worksheet
            .write_with_format(*row, 0, &item.label, &summary_label_format())
            .unwrap();

        worksheet
            .write_with_format(*row, 1, format!("R$ {:.2}", total), &summary_value_format())
            .unwrap();

        *row += 1;
    }
}

fn extract_value(record: &Value, key: &str) -> String {
    match record.get(key) {
        Some(Value::String(v)) => v.clone(),
        Some(Value::Number(v)) => v.to_string(),
        Some(Value::Bool(v)) => v.to_string(),
        Some(v) => v.to_string(),
        None => String::new(),
    }
}

fn replace_variables(text: &str, variables: &std::collections::HashMap<String, String>) -> String {
    let mut result = text.to_string();

    for (key, value) in variables {
        result = result.replace(&format!("${}", key), value);
    }

    result
}

fn report_title_format() -> Format {
    Format::new()
        .set_bold()
        .set_font_size(20.0)
        .set_align(FormatAlign::Center)
}

fn company_format() -> Format {
    Format::new().set_font_size(11.0).set_bold()
}

fn document_format() -> Format {
    Format::new()
        .set_font_size(10.0)
        .set_align(FormatAlign::Right)
}

fn table_header_format() -> Format {
    Format::new()
        .set_bold()
        .set_font_color(Color::White)
        .set_background_color(Color::RGB(0x1F2937))
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center)
}

fn row_even_format() -> Format {
    Format::new()
        .set_background_color(Color::RGB(0xF9FAFB))
        .set_border(FormatBorder::Thin)
}

fn row_odd_format() -> Format {
    Format::new()
        .set_background_color(Color::White)
        .set_border(FormatBorder::Thin)
}

fn summary_title_format() -> Format {
    Format::new().set_bold().set_font_size(14.0)
}

fn summary_label_format() -> Format {
    Format::new().set_bold()
}

fn summary_value_format() -> Format {
    Format::new().set_bold().set_num_format("R$ #,##0.00")
}
