use pdf_writer::{Content, Name, Str};

/// Converte uma string UTF-8 para bytes WinAnsi (Windows-1252).
///
/// Mapeamento completo para português e latim:
/// - ASCII (0x20-0x7E) → direto
/// - Latin-1 Supplement (U+00A0-U+00FF) → direto (mesmo codepoint)
/// - Windows-1252 chars especiais (U+20AC, U+201A-U+201E, etc.) → mapeados
/// - Caracteres não mapeados → transliterados ou substituídos por espaço
pub fn to_win_ansi(s: &str, max_chars: usize) -> Vec<u8> {
    let mut out = Vec::with_capacity(s.len().min(max_chars));
    let mut count = 0usize;
    for ch in s.chars() {
        if count >= max_chars {
            out.extend_from_slice(b"...");
            break;
        }
        let byte: u8 = match ch {
            // ASCII printable
            '\x20'..='\x7E' => ch as u8,

            // Latin-1 Supplement (U+00A0-U+00FF) — mesmo codepoint no WinAnsi
            '\u{00A0}'..='\u{00FF}' => ch as u8,

            // Windows-1252 chars que diferem do Latin-1
            '\u{20AC}' => 0x80, // € Euro
            '\u{201A}' => 0x82, // ‚ Single low-9 quote
            '\u{0192}' => 0x83, // ƒ Florin
            '\u{201E}' => 0x84, // „ Double low-9 quote
            '\u{2026}' => 0x85, // … Ellipsis
            '\u{2020}' => 0x86, // † Dagger
            '\u{2021}' => 0x87, // ‡ Double dagger
            '\u{02C6}' => 0x88, // ˆ Modifier circumflex
            '\u{2030}' => 0x89, // ‰ Per mille
            '\u{0160}' => 0x8A, // Š S caron
            '\u{2039}' => 0x8B, // ‹ Single left angle
            '\u{0152}' => 0x8C, // Œ OE ligature
            '\u{017D}' => 0x8E, // Ž Z caron
            '\u{2018}' => 0x91, // ' Left single quote
            '\u{2019}' => 0x92, // ' Right single quote
            '\u{201C}' => 0x93, // " Left double quote
            '\u{201D}' => 0x94, // " Right double quote
            '\u{2022}' => 0x95, // • Bullet
            '\u{2013}' => 0x96, // – En dash
            '\u{2014}' => 0x97, // — Em dash
            '\u{02DC}' => 0x98, // ˜ Small tilde
            '\u{2122}' => 0x99, // ™ Trade mark
            '\u{0161}' => 0x9A, // š s caron
            '\u{203A}' => 0x9B, // › Single right angle
            '\u{0153}' => 0x9C, // œ oe ligature
            '\u{017E}' => 0x9E, // ž z caron
            '\u{0178}' => 0x9F, // Ÿ Y diaeresis

            // Transliteração de caracteres comuns não-WinAnsi
            '\u{2000}'..='\u{200A}' => b' ', // Various spaces → space
            '\u{00AD}' => b'-',  // Soft hyphen
            '\u{2010}'..='\u{2015}' => b'-', // Various dashes → hyphen
            '\u{2212}' => b'-',  // Minus sign → hyphen
            '\u{00B7}' => b'.',  // Middle dot → dot
            '\u{2023}' => b'>',  // Triangular bullet
            '\u{25E6}' => b'o',  // White bullet
            '\u{2044}' => b'/',  // Fraction slash
            '\u{00A6}' => b'|',  // Broken bar
            '\u{00AC}' => b'!',  // Not sign
            '\u{00A9}' => b'C',  // Copyright

            // Emoji/icon fallbacks for PDF Type1 fonts
            // ZapfDingbats uses a custom symbol encoding, so map to ASCII letters
            // that correspond to visible dingbat glyphs in that encoding.
            '💰' => b'a',
            '🎯' => b'b',
            '✅' => b'c',
            '📦' => b'd',
            '📊' => b'e',
            '📉' => b'f',
            '📈' => b'g',
            '💎' | '⭐' | '✨' => b'h',
            '📄' => b'i',
            '🚀' => b'j',
            '🔒' => b'k',
            '📅' => b'l',
            '🎫' => b'm',
            '💲' => b'n',
            '👛' => b'o',

            // Whitespace
            _ if ch.is_whitespace() => b' ',

            // Qualquer outro caractere não mapeado → '?'
            _ => b'?',
        };
        out.push(byte);
        count += 1;
    }
    out
}

/// Helper para mostrar texto no PDF, já convertido para WinAnsi
pub fn show_text_winansi(
    c: &mut Content,
    text: &str,
    font: Name,
    size: f32,
    x: f32,
    y: f32,
    rgb: [f32; 3],
) {
    let bytes = to_win_ansi(text, 999);
    crate::show_text(c, &bytes, font, size, x, y, rgb);
}

/// Helper para mostrar texto com limite de caracteres
pub fn show_text_winansi_trunc(
    c: &mut Content,
    text: &str,
    font: Name,
    size: f32,
    x: f32,
    y: f32,
    rgb: [f32; 3],
    max_chars: usize,
) {
    let bytes = to_win_ansi(text, max_chars);
    crate::show_text(c, &bytes, font, size, x, y, rgb);
}
