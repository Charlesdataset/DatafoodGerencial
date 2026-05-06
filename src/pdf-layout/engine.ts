import type { Component, PdfTemplate, RenderElement, RenderPlan, RgbColor } from "./types";
import { DEFAULT_MARGIN, PAGE_SIZES, hexToRgb } from "./types";

function normMarg(m: number | number[]): number[] {
  if (typeof m === "number") return [m, m, m, m];
  return m;
}

function normPad(p: any): number[] {
  if (!p) return [0, 0, 0, 0];
  if (typeof p === "number") return [p, p, p, p];
  return p;
}

function interp(v: string, data: any): string {
  return v.replace(/\{(w+)\}/g, (_, k) => String(data[k] ?? "{" + k + "}"));
}

function renderOne(comp: any, ctx: any, maxW: number): RenderElement[] {
  switch (comp.type) {
    case "box": {
      const m = normMarg(comp.margin);
      const p = normPad(comp.padding);
      const el: RenderElement = {
        type: "box", x: m[3], y: m[0], w: comp.width ?? maxW, h: comp.height ?? 0,
        backgroundColor: comp.backgroundColor ? hexToRgb(comp.backgroundColor) : undefined,
        borderRadius: comp.borderRadius ?? 0, padding: p, children: [],
      };
      const inner = (comp.width ?? maxW) - p[1] - p[3];
      return [el, ...(comp.children?.flatMap((c: any) => renderOne(c, ctx, inner)) ?? [])];
    }
    case "text": {
      const align = (comp as any).align ?? "left";
      return [{ type: "text", value: interp(comp.value, ctx.data), x: 0, y: 0,
        w: (comp.fontSize ?? 12) * 0.5 * comp.value.length, h: (comp.fontSize ?? 12) + 4,
        fontSize: comp.fontSize ?? 12, color: comp.color ? hexToRgb(comp.color) : [0,0,0],
        bold: comp.bold ?? false, align }];
    }
    case "divider": {
      return [{ type: "line", x1: 0, y1: 0, x2: maxW, y2: 0, color: [0.8,0.8,0.8], lineWidth: 0.5 }];
    }
    case "pageBreak": return [{ type: "pageBreak" }];
    default: return [];
  }
}

export async function buildRenderPlanFromTemplate(tpl: PdfTemplate, data: any): Promise<RenderPlan> {
  const [pw, ph] = PAGE_SIZES[tpl.pageSize ?? "A4"];
  const m = normMarg(tpl.margins ?? DEFAULT_MARGIN);
  const ctx = { pageWidth: pw, pageHeight: ph, marginTop: m[0], marginRight: m[1], marginBottom: m[2], marginLeft: m[3], data };
  const el: RenderElement[] = [];
  if (tpl.header) el.push(...renderOne(tpl.header, ctx, pw - m[1] - m[3]));
  for (const c of tpl.body ?? []) el.push(...renderOne(c, ctx, pw - m[1] - m[3]));
  if (tpl.footer) el.push(...renderOne(tpl.footer, ctx, pw - m[1] - m[3]));
  return { pages: [{ elements: el }], pageWidth: pw, pageHeight: ph };
}
