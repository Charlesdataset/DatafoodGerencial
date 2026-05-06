use pdf_writer::{Content, Name, Str};
use serde::Deserialize;

use crate::encoding::to_win_ansi as to_utf8_winansi;

// ─── Constants ─────────────────────────────────────────────────────────────────
pub(crate) const KAPPA: f32 = 0.5522847498;

// ─── Data structures ────────────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChartData {
    pub title: String,
    pub labels: Vec<String>,
    pub row_labels: Vec<String>,
    pub values: Vec<f64>,
    pub chart_type: String, // "bar", "line", "pie", "donut", "heatmap"
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricCardData {
    pub title: String,
    pub value: String,
    pub change: Option<String>,
    pub icon: Option<String>,
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

pub(crate) fn lerp(a: f32, b: f32, t: f32) -> f32 {
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

pub(crate) fn draw_rounded_rect_fill(
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

pub(crate) fn rounded_rect_path(c: &mut Content, x: f32, y: f32, w: f32, h: f32, r: f32) {
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

pub(crate) fn draw_circle(
    c: &mut Content,
    cx: f32,
    cy: f32,
    r: f32,
    cr: f32,
    cg: f32,
    cb: f32,
    fill: bool,
) {
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

pub(crate) fn truncate_text(s: &str, max_chars: usize) -> Vec<u8> {
    let mut bytes = to_utf8_winansi(s, max_chars);
    if bytes.len() > max_chars {
        bytes.truncate(max_chars);
        bytes.extend_from_slice(b"...");
    }
    bytes
}

// ─── GRÁFICO DE BARRAS ─────────────────────────────────────────────────────────

pub fn draw_bar_chart_with_colors(
    c: &mut Content,
    data: &ChartData,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    colors: &[[f32; 3]],
    value_suffix: &str,
    label_font_size: f32,
    label_color: [f32; 3],
    grid_color: [f32; 3],
    label_max_chars: usize,
) {
    if data.values.is_empty() || colors.is_empty() {
        return;
    }

    let max_val = data.values.iter().fold(0.0f32, |a, &b| a.max(b as f32));
    if max_val == 0.0 {
        return;
    }

    // Grid lines (horizontal)
    c.set_stroke_rgb(grid_color[0], grid_color[1], grid_color[2]);
    c.set_line_width(0.4);
    for gi in 0..=4 {
        let gy = y + height * gi as f32 / 4.0;
        c.move_to(x, gy);
        c.line_to(x + width, gy);
        c.stroke();
    }

    // Y-axis labels
    for gi in 0..=4 {
        let gy = y + height * gi as f32 / 4.0;
        let label_txt = format!("{:.0}", max_val * gi as f32 / 4.0);
        show_text(
            c,
            &truncate_text(&label_txt, label_max_chars),
            Name(b"F1"),
            label_font_size,
            x - 20.0,
            gy - 2.5,
            label_color,
        );
    }

    // Axis line
    c.set_stroke_rgb(grid_color[0], grid_color[1], grid_color[2]);
    c.set_line_width(0.6);
    c.move_to(x, y);
    c.line_to(x + width, y);
    c.stroke();

    let bar_width = width / data.values.len() as f32 * 0.65;
    let bar_spacing = width / data.values.len() as f32;

    for (i, &val) in data.values.iter().enumerate() {
        let bar_height = (val as f32 / max_val) * height;
        let bar_x = x + i as f32 * bar_spacing + (bar_spacing - bar_width) / 2.0;
        let bar_y = y;

        // Use color from the colors array (cycling if needed)
        let bar_color = colors[i % colors.len()];

        c.set_fill_rgb(bar_color[0], bar_color[1], bar_color[2]);

        // Rounded top bar
        let r = (bar_width * 0.3).min(4.0);
        rounded_rect_path(c, bar_x, bar_y, bar_width, bar_height, r);
        c.fill_nonzero();

        // Value label at top
        let val_str = if value_suffix.is_empty() {
            format!("{:.0}", val)
        } else {
            format!("{:.0} {}", val, value_suffix)
        };
        let tw = val_str.len() as f32 * 3.2;
        show_text(
            c,
            &truncate_text(&val_str, 10),
            Name(b"F2"),
            6.0,
            bar_x + (bar_width - tw) / 2.0,
            bar_y + bar_height + 6.0,
            bar_color,
        );

        // Label below the bar
        if let Some(label) = data.labels.get(i) {
            show_text(
                c,
                &truncate_text(label, 8),
                Name(b"F1"),
                5.5,
                bar_x + 1.0,
                y - 12.0,
                [0.40, 0.40, 0.45],
            );
        }
    }
}

pub fn draw_bar_chart(
    c: &mut Content,
    data: &ChartData,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    color: [f32; 3],
    value_suffix: &str,
    label_font_size: f32,
    label_color: [f32; 3],
    grid_color: [f32; 3],
    label_max_chars: usize,
) {
    if data.values.is_empty() {
        return;
    }

    let max_val = data.values.iter().fold(0.0f32, |a, &b| a.max(b as f32));
    if max_val == 0.0 {
        return;
    }

    // Grid lines (horizontal)
    c.set_stroke_rgb(grid_color[0], grid_color[1], grid_color[2]);
    c.set_line_width(0.4);
    for gi in 0..=4 {
        let gy = y + height * gi as f32 / 4.0;
        c.move_to(x, gy);
        c.line_to(x + width, gy);
        c.stroke();
    }

    // Y-axis labels
    for gi in 0..=4 {
        let gy = y + height * gi as f32 / 4.0;
        let label_txt = format!("{:.0}", max_val * gi as f32 / 4.0);
        show_text(
            c,
            &truncate_text(&label_txt, label_max_chars),
            Name(b"F1"),
            label_font_size,
            x - 20.0,
            gy - 2.5,
            label_color,
        );
    }

    // Axis line
    c.set_stroke_rgb(grid_color[0], grid_color[1], grid_color[2]);
    c.set_line_width(0.6);
    c.move_to(x, y);
    c.line_to(x + width, y);
    c.stroke();

    let bar_width = width / data.values.len() as f32 * 0.65;
    let bar_spacing = width / data.values.len() as f32;

    for (i, &val) in data.values.iter().enumerate() {
        let bar_height = (val as f32 / max_val) * height;
        let bar_x = x + i as f32 * bar_spacing + (bar_spacing - bar_width) / 2.0;
        let bar_y = y;

        // Gradient: darker for larger values
        let intensity = 0.45 + (val as f32 / max_val) * 0.55;
        c.set_fill_rgb(
            color[0] * intensity,
            color[1] * intensity,
            color[2] * intensity,
        );

        // Rounded top bar
        let r = (bar_width * 0.3).min(4.0);
        rounded_rect_path(c, bar_x, bar_y, bar_width, bar_height, r);
        c.fill_nonzero();

        // Value label at top
        let val_str = if value_suffix.is_empty() {
            format!("{:.0}", val)
        } else {
            format!("{:.0} {}", val, value_suffix)
        };
        let tw = val_str.len() as f32 * 3.2;
        show_text(
            c,
            &truncate_text(&val_str, 10),
            Name(b"F2"),
            6.0,
            bar_x + (bar_width - tw) / 2.0,
            bar_y + bar_height + 6.0,
            color,
        );

        // Label below the bar
        if let Some(label) = data.labels.get(i) {
            show_text(
                c,
                &truncate_text(label, label_max_chars),
                Name(b"F1"),
                label_font_size,
                bar_x + 1.0,
                y - 12.0,
                label_color,
            );
        }
    }
}

// ─── GRÁFICO DE LINHA ──────────────────────────────────────────────────────────

pub fn draw_line_chart(
    c: &mut Content,
    data: &ChartData,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    color: [f32; 3],
    secondary: [f32; 3],
) {
    if data.values.len() < 2 {
        return;
    }

    let max_val = data.values.iter().fold(0.0f32, |a, &b| a.max(b as f32));
    if max_val == 0.0 {
        return;
    }

    // Grid lines (horizontal)
    c.set_stroke_rgb(0.88, 0.88, 0.92);
    c.set_line_width(0.4);
    for gi in 0..=4 {
        let gy = y + height * gi as f32 / 4.0;
        c.move_to(x, gy);
        c.line_to(x + width, gy);
        c.stroke();
    }

    // Y-axis labels
    for gi in 0..=4 {
        let gy = y + height * gi as f32 / 4.0;
        let label_txt = format!("{:.1}", max_val * gi as f32 / 4.0);
        show_text(
            c,
            &truncate_text(&label_txt, 6),
            Name(b"F1"),
            5.5,
            x - 22.0,
            gy - 2.5,
            [0.55, 0.55, 0.60],
        );
    }

    // Axis line
    c.set_stroke_rgb(0.75, 0.75, 0.80);
    c.set_line_width(0.6);
    c.move_to(x, y);
    c.line_to(x + width, y);
    c.stroke();

    let step_x = width / (data.values.len() - 1) as f32;
    let points: Vec<(f32, f32)> = data
        .values
        .iter()
        .enumerate()
        .map(|(i, &val)| {
            let px = x + i as f32 * step_x;
            let py = y + (val as f32 / max_val) * height;
            (px, py)
        })
        .collect();

    // Filled area under the line
    if let (Some(first), Some(last)) = (points.first(), points.last()) {
        c.set_fill_rgb(color[0] * 0.15, color[1] * 0.15, color[2] * 0.15);
        c.move_to(first.0, y);
        c.line_to(first.0, first.1);
        for point in &points[1..] {
            c.line_to(point.0, point.1);
        }
        if let Some(last) = points.last() {
            c.line_to(last.0, y);
        }
        c.close_path();
        c.fill_nonzero();
    }

    // Draw the line
    c.set_stroke_rgb(color[0], color[1], color[2]);
    c.set_line_width(2.0);
    if let Some(first) = points.first() {
        c.move_to(first.0, first.1);
        for point in &points[1..] {
            c.line_to(point.0, point.1);
        }
        c.stroke();
    }

    // Draw points with white ring
    for (i, (px, py)) in points.iter().enumerate() {
        draw_circle(c, *px, *py, 4.0, 1.0, 1.0, 1.0, true);
        draw_circle(c, *px, *py, 2.5, color[0], color[1], color[2], true);

        if let Some(val) = data.values.get(i) {
            let val_str = format!("{:.0}", val);
            show_text(
                c,
                &truncate_text(&val_str, 7),
                Name(b"F2"),
                6.0,
                px - 7.0,
                py + 6.0,
                color,
            );
        }

        if let Some(label) = data.labels.get(i) {
            show_text(
                c,
                &truncate_text(label, 8),
                Name(b"F1"),
                5.5,
                px - 8.0,
                y - 12.0,
                [0.40, 0.40, 0.45],
            );
        }
    }
}

// ─── GRÁFICO DE PIZZA / DONUT ──────────────────────────────────────────────────

pub fn draw_pie_chart(
    c: &mut Content,
    data: &ChartData,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    color: [f32; 3],
    secondary: [f32; 3],
) {
    if data.values.is_empty() {
        return;
    }
    let total: f32 = data.values.iter().sum::<f64>() as f32;
    if total == 0.0 {
        return;
    }

    let is_donut = data.chart_type == "donut";

    // Center and radius
    let cx = x + width / 2.0;
    let cy = y + height / 2.0;
    let r = (width.min(height)) / 2.0 - 5.0;

    // Color palette derived from primary/accent
    let palette: [[f32; 3]; 8] = [
        color,
        secondary,
        [color[0] * 0.7, color[1] * 0.7, color[2] * 0.7],
        [secondary[0] * 0.7, secondary[1] * 0.7, secondary[2] * 0.7],
        [color[0] * 0.85, color[1] * 1.1, color[2] * 0.85],
        [secondary[0] * 1.1, secondary[1] * 0.85, secondary[2] * 0.85],
        [0.5, 0.5, 0.6],
        [0.7, 0.7, 0.8],
    ];

    let mut start_angle = std::f32::consts::PI / 2.0;
    let num_slices = data.values.len().min(8);

    for i in 0..num_slices {
        let val = data.values[i] as f32;
        let slice_angle = (val / total) * 2.0 * std::f32::consts::PI;
        let end_angle = start_angle + slice_angle;
        let p_color = palette[i % palette.len()];

        c.set_fill_rgb(p_color[0], p_color[1], p_color[2]);

        let p1x = cx + r * start_angle.cos();
        let p1y = cy + r * start_angle.sin();
        let p2x = cx + r * end_angle.cos();
        let p2y = cy + r * end_angle.sin();

        if slice_angle > 0.01 {
            c.move_to(cx, cy);
            c.line_to(p1x, p1y);
            let arc_segments = ((slice_angle / std::f32::consts::PI * 180.0) / 5.0).ceil() as u32;
            for s in 1..=arc_segments {
                let t = s as f32 / arc_segments as f32;
                let a = start_angle + slice_angle * t;
                let px = cx + r * a.cos();
                let py = cy + r * a.sin();
                c.line_to(px, py);
            }
            c.close_path();
            c.fill_nonzero();
        }

        start_angle = end_angle;
    }

    // Donut hole
    if is_donut && r > 15.0 {
        c.set_fill_rgb(1.0, 1.0, 1.0);
        draw_circle(c, cx, cy, r * 0.45, 1.0, 1.0, 1.0, true);
    }

    // Legend and labels
    let legend_x = x + width + 8.0;
    let mut legend_y = y + height;
    start_angle = std::f32::consts::PI / 2.0;

    for i in 0..num_slices {
        let val = data.values[i] as f32;
        let slice_angle = (val / total) * 2.0 * std::f32::consts::PI;
        let mid_angle = start_angle + slice_angle / 2.0;

        let p_color = palette[i % palette.len()];

        // Percentage label on the slice
        if slice_angle > 0.1 {
            let pct = val / total * 100.0;
            let pct_str = format!("{:.0}%", pct);
            let lx = cx + r * 0.65 * mid_angle.cos();
            let ly = cy + r * 0.65 * mid_angle.sin();
            show_text(
                c,
                &truncate_text(&pct_str, 4),
                Name(b"F2"),
                7.0,
                lx - 6.0,
                ly - 2.5,
                [1.0, 1.0, 1.0],
            );
        }

        // Legend item
        start_angle += slice_angle;
    }

    // Legend outside pie (if width allows)
    if width >= 80.0 {
        start_angle = std::f32::consts::PI / 2.0;
        for i in 0..num_slices {
            let val = data.values[i] as f32;
            let slice_angle = (val / total) * 2.0 * std::f32::consts::PI;

            let p_color = palette[i % palette.len()];

            legend_y -= 12.0;
            if legend_y > y - 10.0 {
                if let Some(label) = data.labels.get(i) {
                    draw_rounded_rect_fill(
                        c,
                        legend_x,
                        legend_y - 4.0,
                        6.0,
                        6.0,
                        1.5,
                        p_color[0],
                        p_color[1],
                        p_color[2],
                        1.0,
                    );
                    show_text(
                        c,
                        &truncate_text(label, 12),
                        Name(b"F1"),
                        6.0,
                        legend_x + 10.0,
                        legend_y - 1.0,
                        [0.25, 0.25, 0.30],
                    );
                }
            }

            start_angle += slice_angle;
        }
    }
}

// ─── METRIC CARDS ──────────────────────────────────────────────────────────────

pub fn draw_metric_cards(
    c: &mut Content,
    cards: &[MetricCardData],
    x: f32,
    y: f32,
    card_width: f32,
    card_height: f32,
    primary: [f32; 3],
    accent: [f32; 3],
) {
    let count = cards.len().min(6);
    if count == 0 {
        return;
    }

    let gap = 10.0;
    let start_x = x;

    for (i, card) in cards.iter().enumerate().take(count) {
        let cx = start_x + i as f32 * (card_width + gap);
        let cy = y;

        // Card background (white)
        c.set_fill_rgb(1.0, 1.0, 1.0);
        draw_rounded_rect_fill(c, cx, cy, card_width, card_height, 6.0, 1.0, 1.0, 1.0, 1.0);

        // Subtle border
        c.set_stroke_rgb(0.90, 0.90, 0.95);
        c.set_line_width(0.5);
        rounded_rect_path(c, cx, cy, card_width, card_height, 6.0);
        c.stroke();

        // Top accent line
        c.set_stroke_rgb(accent[0], accent[1], accent[2]);
        c.set_line_width(2.5);
        c.move_to(cx + 6.0, cy + card_height);
        c.line_to(cx + card_width - 6.0, cy + card_height);
        c.stroke();

        // Icon
        if let Some(ref icon) = card.icon {
            show_text(
                c,
                &truncate_text(icon, 4),
                Name(b"F1"),
                16.0,
                cx + 10.0,
                cy + card_height - 22.0,
                [0.3, 0.3, 0.4],
            );
        }

        // Value
        show_text(
            c,
            &truncate_text(&card.value, 12),
            Name(b"F2"),
            16.0,
            cx + 10.0,
            cy + card_height - 48.0,
            [0.08, 0.08, 0.12],
        );

        // Title
        show_text(
            c,
            &truncate_text(&card.title, 18),
            Name(b"F1"),
            7.5,
            cx + 10.0,
            cy + card_height - 64.0,
            [0.50, 0.52, 0.58],
        );

        // Change indicator
        if let Some(ref change) = card.change {
            let is_positive = change.starts_with('+') || !change.starts_with('-');
            if is_positive {
                show_text(
                    c,
                    &truncate_text(change, 10),
                    Name(b"F2"),
                    8.0,
                    cx + 10.0,
                    cy + card_height - 80.0,
                    [0.1, 0.7, 0.1],
                );
            } else {
                show_text(
                    c,
                    &truncate_text(change, 10),
                    Name(b"F2"),
                    8.0,
                    cx + 10.0,
                    cy + card_height - 80.0,
                    [0.8, 0.2, 0.2],
                );
            }
        }
    }
}

// ─── GRÁFICO HEATMAP ────────────────────────────────────────────────────────────

pub fn draw_heatmap_chart(
    c: &mut Content,
    data: &ChartData,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    color_from: [f32; 3],
    color_to: [f32; 3],
) {
    if data.values.is_empty() || data.labels.is_empty() {
        return;
    }

    let cols = data.labels.len();
    let rows = (data.values.len() / cols).max(1);
    if cols == 0 || rows == 0 {
        return;
    }

    // Layout
    let margin_left = 54.0;
    let margin_top = 20.0;
    let margin_bottom = 26.0;

    let grid_x = x + margin_left;
    let grid_top = y + height - margin_top;
    let grid_bottom = y + margin_bottom;
    let grid_h = (grid_top - grid_bottom).max(1.0);
    let grid_w = width - margin_left;

    let cell_w = grid_w / cols as f32;
    let cell_h = grid_h / rows as f32;
    let gap = 2.5;
    let corner_r = if cell_w > 8.0 && cell_h > 8.0 {
        2.5
    } else {
        0.0
    };

    let min_val = data.values.iter().cloned().fold(f64::MAX, f64::min) as f32;
    let max_val = data.values.iter().cloned().fold(0.0_f64, f64::max) as f32;
    let range = if (max_val - min_val).abs() < 0.001 {
        1.0
    } else {
        max_val - min_val
    };

    // ── Draw cells ──────────────────────────────────────────────────────────────
    for (idx, &val) in data.values.iter().enumerate() {
        let col = idx % cols;
        let row = idx / cols;
        if row >= rows {
            break;
        }

        let cell_x = grid_x + col as f32 * cell_w;
        // Row 0 at the top → subtract (row+1)*cell_h from grid_top
        let cell_y = grid_top - (row + 1) as f32 * cell_h;

        let t = ((val as f32 - min_val) / range).clamp(0.0, 1.0);
        let r = lerp(color_from[0], color_to[0], t);
        let g = lerp(color_from[1], color_to[1], t);
        let b = lerp(color_from[2], color_to[2], t);

        c.set_fill_rgb(r, g, b);
        if corner_r > 0.0 {
            rounded_rect_path(
                c,
                cell_x + gap / 2.0,
                cell_y + gap / 2.0,
                cell_w - gap,
                cell_h - gap,
                corner_r,
            );
        } else {
            c.rect(
                cell_x + gap / 2.0,
                cell_y + gap / 2.0,
                cell_w - gap,
                cell_h - gap,
            );
        }
        c.fill_nonzero();

        // Value label inside cell
        if cell_h > 11.0 && cell_w > 14.0 {
            let val_str = format!("{:.0}", val);
            let text_color = if t > 0.52 {
                [1.0_f32, 1.0, 1.0]
            } else {
                [0.15, 0.15, 0.15]
            };
            let char_w = 3.6_f32;
            let text_x = cell_x + cell_w / 2.0 - val_str.len() as f32 * char_w / 2.0;
            let text_y = cell_y + cell_h / 2.0 - 2.5;
            show_text(
                c,
                &truncate_text(&val_str, 5),
                Name(b"F2"),
                7.0,
                text_x,
                text_y,
                text_color,
            );
        }
    }

    // ── Column labels (hours) — above the grid ──────────────────────────────────
    for (col, label) in data.labels.iter().enumerate() {
        let cell_x = grid_x + col as f32 * cell_w;
        let char_w = 3.2_f32;
        let text_x = cell_x + cell_w / 2.0 - label.len() as f32 * char_w / 2.0;
        show_text(
            c,
            &truncate_text(label, 8),
            Name(b"F1"),
            7.5,
            text_x,
            grid_top + 5.0,
            [0.3, 0.3, 0.3],
        );
    }

    // ── Row labels (days) — left of grid ────────────────────────────────────────
    for row in 0..rows {
        let cell_y = grid_top - (row + 1) as f32 * cell_h;
        let label = if row < data.row_labels.len() {
            data.row_labels[row].clone()
        } else {
            format!("R{}", row)
        };
        let text_y = cell_y + cell_h / 2.0 - 3.0;
        show_text(
            c,
            &truncate_text(&label, 10),
            Name(b"F1"),
            7.5,
            x + 2.0,
            text_y,
            [0.25, 0.25, 0.25],
        );
    }

    // ── Color legend bar (horizontal, bottom) ───────────────────────────────────
    let legend_x = grid_x;
    let legend_y = y + 6.0;
    let legend_w = grid_w;
    let legend_h = 8.0;
    let steps = 100;

    for i in 0..steps {
        let t = i as f32 / steps as f32;
        let r = lerp(color_from[0], color_to[0], t);
        let g = lerp(color_from[1], color_to[1], t);
        let b = lerp(color_from[2], color_to[2], t);
        let sw = legend_w / steps as f32 + 0.5;
        c.set_fill_rgb(r, g, b);
        c.rect(legend_x + t * legend_w, legend_y, sw, legend_h);
        c.fill_nonzero();
    }

    // Legend border
    c.set_stroke_rgb(0.75, 0.75, 0.75);
    c.set_line_width(0.5);
    c.rect(legend_x, legend_y, legend_w, legend_h);
    c.stroke();

    // Legend min / max labels
    let min_str = format!("{:.0}", min_val);
    let max_str = format!("{:.0}", max_val);
    show_text(
        c,
        &truncate_text(&min_str, 8),
        Name(b"F1"),
        7.0,
        legend_x,
        legend_y - 7.0,
        [0.45, 0.45, 0.45],
    );
    let max_x = legend_x + legend_w - max_str.len() as f32 * 3.5;
    show_text(
        c,
        &truncate_text(&max_str, 8),
        Name(b"F1"),
        7.0,
        max_x,
        legend_y - 7.0,
        [0.45, 0.45, 0.45],
    );
}

// ─── HEATMAP DETAILS PANEL ───────────────────────────────────────────────────

pub fn draw_heatmap_details(
    c: &mut Content,
    data: &ChartData,
    x: f32,
    y: f32, // bottom-left of the entire details block (PDF: y grows up)
    width: f32,
    color_to: [f32; 3],
) {
    if data.values.is_empty() || data.labels.is_empty() || data.row_labels.is_empty() {
        return;
    }

    let cols = data.labels.len();
    let rows = data.row_labels.len();

    // ── Compute stats ────────────────────────────────────────────────────────
    let mut row_totals: Vec<f64> = vec![0.0; rows];
    for (idx, &val) in data.values.iter().enumerate() {
        let row = idx / cols;
        if row < rows {
            row_totals[row] += val;
        }
    }
    let mut col_totals: Vec<f64> = vec![0.0; cols];
    for (idx, &val) in data.values.iter().enumerate() {
        let col = idx % cols;
        col_totals[col] += val;
    }

    let (best_day_idx, best_day_total) = row_totals
        .iter()
        .enumerate()
        .max_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(std::cmp::Ordering::Equal))
        .map(|(i, &v)| (i, v))
        .unwrap_or((0, 0.0));
    let (worst_day_idx, worst_day_total) = row_totals
        .iter()
        .enumerate()
        .min_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(std::cmp::Ordering::Equal))
        .map(|(i, &v)| (i, v))
        .unwrap_or((0, 0.0));
    let (best_hour_idx, best_hour_total) = col_totals
        .iter()
        .enumerate()
        .max_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(std::cmp::Ordering::Equal))
        .map(|(i, &v)| (i, v))
        .unwrap_or((0, 0.0));
    let (worst_hour_idx, worst_hour_total) = col_totals
        .iter()
        .enumerate()
        .min_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(std::cmp::Ordering::Equal))
        .map(|(i, &v)| (i, v))
        .unwrap_or((0, 0.0));

    let best_day_name = data
        .row_labels
        .get(best_day_idx)
        .map(|s| s.as_str())
        .unwrap_or("-");
    let worst_day_name = data
        .row_labels
        .get(worst_day_idx)
        .map(|s| s.as_str())
        .unwrap_or("-");
    let best_hour_name = data
        .labels
        .get(best_hour_idx)
        .map(|s| s.as_str())
        .unwrap_or("-");
    let worst_hour_name = data
        .labels
        .get(worst_hour_idx)
        .map(|s| s.as_str())
        .unwrap_or("-");

    // ── Layout ───────────────────────────────────────────────────────────────
    // CORREÇÃO 1: Aumentar card_h de 60.0 para 75.0 para dar mais espaço vertical
    let card_h = 75.0_f32;
    let header_h = 16.0_f32;
    let gap = 10.0_f32;
    let corner = 6.0_f32;
    let card_w = (width - gap * 3.0) / 4.0;

    // Cards start at y (bottom), header sits on top of them
    let cards_y = y;
    let header_y = cards_y + card_h + 6.0; // Ajustado para o novo card_h

    // Accent palette derived from colorTo
    let [ar, ag, ab] = color_to;
    let neg = [0.78_f32, 0.32_f32, 0.18_f32];

    // ── Section header "Resumo do período" ───────────────────────────────────
    draw_rounded_rect_fill(c, x, header_y + 3.0, 3.0, 10.0, 1.5, ar, ag, ab, 1.0);
    show_text(
        c,
        &truncate_text("Resumo do periodo", 30),
        Name(b"F2"),
        8.0,
        x + 8.0,
        header_y + 4.0,
        [ar * 0.55, ag * 0.55, ab.min(0.55)],
    );

    // ── Cards ─────────────────────────────────────────────────────────────────
    struct CardSpec<'a> {
        label: &'a str,
        value: String,
        subtitle: String,
        positive: bool,
    }

    let n_rows = rows as f64;
    let specs = [
        CardSpec {
            label: "Melhor dia",
            value: best_day_name.to_string(),
            subtitle: format!("{:.0} vendas", best_day_total),
            positive: true,
        },
        CardSpec {
            label: "Pior dia",
            value: worst_day_name.to_string(),
            subtitle: format!("{:.0} vendas", worst_day_total),
            positive: false,
        },
        CardSpec {
            label: "Melhor hora",
            value: best_hour_name.to_string(),
            subtitle: format!("media {:.1}/dia", best_hour_total / n_rows),
            positive: true,
        },
        CardSpec {
            label: "Pior hora",
            value: worst_hour_name.to_string(),
            subtitle: format!("media {:.1}/dia", worst_hour_total / n_rows),
            positive: false,
        },
    ];

    for (i, spec) in specs.iter().enumerate() {
        let cx = x + i as f32 * (card_w + gap);
        let cy = cards_y;

        let (acc_r, acc_g, acc_b) = if spec.positive {
            (ar, ag, ab)
        } else {
            (neg[0], neg[1], neg[2])
        };

        let (bg_r, bg_g, bg_b) = if spec.positive {
            (
                lerp(1.0, acc_r, 0.07),
                lerp(1.0, acc_g, 0.07),
                lerp(1.0, acc_b, 0.12),
            )
        } else {
            (1.0, lerp(1.0, neg[1], 0.06), lerp(1.0, neg[2], 0.08))
        };

        // ── Shadow ──────────────────────────────────────────────────────────
        draw_rounded_rect_fill(
            c,
            cx + 1.5,
            cy - 1.5,
            card_w,
            card_h,
            corner,
            0.80,
            0.83,
            0.88,
            1.0,
        );

        // ── Card background ──────────────────────────────────────────────────
        draw_rounded_rect_fill(c, cx, cy, card_w, card_h, corner, bg_r, bg_g, bg_b, 1.0);

        // ── Top accent strip (5 px, rounded on top, square on bottom) ────────
        let strip_h = 5.0_f32;
        draw_rounded_rect_fill(
            c,
            cx,
            cy + card_h - strip_h,
            card_w,
            strip_h + corner,
            corner,
            acc_r,
            acc_g,
            acc_b,
            1.0,
        );
        draw_rounded_rect_fill(
            c,
            cx + 0.5,
            cy + card_h - strip_h,
            card_w - 1.0,
            corner + 0.5,
            0.0,
            bg_r,
            bg_g,
            bg_b,
            1.0,
        );

        // ── Border ───────────────────────────────────────────────────────────
        let bdr = lerp(bg_r, acc_r, 0.25);
        let bdg = lerp(bg_g, acc_g, 0.25);
        let bdb = lerp(bg_b, acc_b, 0.28);
        c.set_stroke_rgb(bdr, bdg, bdb);
        c.set_line_width(0.6);
        rounded_rect_path(c, cx, cy, card_w, card_h, corner);
        c.stroke();

        // ── Indicator dot ────────────────────────────────────────────────────
        let dot_x = cx + 13.0;
        // CORREÇÃO 2: Reposicionar o dot para o topo da área de conteúdo
        let dot_y = cy + card_h - 22.0;
        draw_circle(c, dot_x, dot_y, 4.0, acc_r, acc_g, acc_b, true);
        draw_circle(c, dot_x, dot_y, 2.0, bg_r, bg_g, bg_b, true);

        // ── Label ────────────────────────────────────────────────────────────
        let lbl_color = [
            lerp(0.38, acc_r, 0.40),
            lerp(0.42, acc_g, 0.38),
            lerp(0.50, acc_b, 0.38),
        ];
        // CORREÇÃO 3: Reposicionar o label para ficar logo acima do valor, mas com folga
        show_text(
            c,
            &truncate_text(spec.label, 20),
            Name(b"F1"),
            8.0,
            cx + 22.0,
            cy + card_h - 24.0, // Antes: -19.0 (muito perto do valor)
            lbl_color,
        );

        // ── Value (large) ────────────────────────────────────────────────────
        let val_color = [acc_r * 0.60, acc_g * 0.58, (acc_b * 0.65).min(0.70)];
        // CORREÇÃO 4: Reposicionar o valor grande para o centro do card
        show_text(
            c,
            &truncate_text(&spec.value, 14),
            Name(b"F2"),
            20.0,
            cx + 13.0,
            cy + card_h - 46.0, // Antes: -39.0 (muito perto do bottom)
            val_color,
        );

        // ── Divider line ─────────────────────────────────────────────────────
        c.set_stroke_rgb(bdr, bdg, bdb);
        c.set_line_width(0.4);
        // CORREÇÃO 5: Ajustar a posição da linha divisória
        c.move_to(cx + 13.0, cy + 20.0); // Antes: 18.0
        c.line_to(cx + card_w - 13.0, cy + 20.0);
        c.stroke();

        // ── Subtitle ─────────────────────────────────────────────────────────
        // CORREÇÃO 6: Reposicionar o subtítulo na parte inferior do card
        show_text(
            c,
            &truncate_text(&spec.subtitle, 22),
            Name(b"F1"),
            7.5,
            cx + 13.0,
            cy + 12.0, // Antes: 8.0
            [0.50, 0.55, 0.62],
        );
    }
}
