/// Binário standalone para gerar o PDF V3 Completão.
/// Uso: cargo run --bin generate_pdf <report.json> [datasets.json] [variables.json]
use std::fs;
use std::io::Read;

fn main() {
    let report_path = std::env::args().nth(1).expect("Uso: generate_pdf <report.json> [datasets.json]");
    let datasets_path = std::env::args().nth(2);
    let variables_path = std::env::args().nth(3);

    let report_json = {
        let mut s = String::new();
        fs::File::open(&report_path).unwrap().read_to_string(&mut s).unwrap();
        s
    };
    let datasets_json = match datasets_path {
        Some(p) => { let mut s = String::new(); fs::File::open(&p).unwrap().read_to_string(&mut s).unwrap(); s },
        None => "{}".to_string(),
    };
    let variables_json = match variables_path {
        Some(p) => { let mut s = String::new(); fs::File::open(&p).unwrap().read_to_string(&mut s).unwrap(); s },
        None => "{}".to_string(),
    };

    let pdf_bytes = pdf_wasm::generate_pdf_v3(&report_json, &datasets_json, &variables_json);

    // Se for mensagem de erro, mostra
    if pdf_bytes.len() < 100 && pdf_bytes.starts_with(b"ERRO:") {
        eprintln!("❌ {}", String::from_utf8_lossy(&pdf_bytes));
        std::process::exit(1);
    }

    fs::write("output.pdf", &pdf_bytes)
        .expect("❌ Erro ao salvar PDF");

    println!("✅ PDF gerado: output.pdf ({} bytes)", pdf_bytes.len());
}
