use rust_xlsxwriter::*;

use base64::{Engine as _, engine::general_purpose::STANDARD as B64};

use crate::models::*;

pub fn gerar(json: &str) -> Vec<u8> {
    //PEGO JSON PARA TRATAR
    let report: ExcelReport = serde_json::from_str(json).unwrap();

    //CHAMAR LIB EXCEL
    let mut workbook = Workbook::new();

    //CRIAR O WORKSHEET
    let worksheet = workbook.add_worksheet();
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
    let header = report.header.unwrap();
    render_header(
        worksheet,
        logo.as_ref(),
        &header.title,
        &header.company_name,
    );

    workbook.save_to_buffer().unwrap()
}

//FUNÇÃO PARA RENDERIZAR O HEADER
pub fn render_header(
    worksheet: &mut Worksheet,
    image: Option<&Image>,
    title: &str,
    company_info: &str,
) {
    if let Some(img) = image {
        worksheet
            .insert_image_with_offset(0, 1, img, 10, 10)
            .unwrap();
    }

    worksheet
        .merge_range(0, 4, 0, 12, title, &header_title_format())
        .unwrap();

    worksheet
        .merge_range(0, 13, 0, 18, company_info, &company_info_format())
        .unwrap();
}

//FUNCOES ULTILITARIAS
pub fn image_from_base64(base64_str: &str) -> Result<Image, String> {
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

///Formats

pub fn header_title_format() -> Format {
    Format::new()
        .set_font_name("Aptos")
        .set_font_size(20.0)
        .set_bold()
        .set_font_color(Color::RGB(0x111827))
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
}

pub fn company_info_format() -> Format {
    Format::new().set_font_name("Aptos").set_font_size(10)
}
