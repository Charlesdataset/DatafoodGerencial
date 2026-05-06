import type { RenderPlan, RenderElement, RenderBox, RenderLine } from "./types";

export function renderPlanToJson(plan: RenderPlan): string {
  const obj = {
    page: {
      width: plan.pageWidth,
      height: plan.pageHeight,
      margin: 30,
    },
    elements: flattenPages(plan.pages),
  };
  return JSON.stringify(obj);
}

function flattenPages(pages: { elements: RenderElement[] }[]): any[] {
  const result: any[] = [];
  for (const page of pages) {
    for (const el of page.elements) {
      result.push(elementToJson(el));
    }
  }
  return result;
}

function elementToJson(el: RenderElement): any {
  if (el.type === "pageBreak") {
    return { type: "spacer", h: 0 };
  }
  if (el.type === "line") {
    return { type: "rect", h: 1, w: el.x2 - el.x1, style: { backgroundColor: "#000000" } };
  }
  if (el.type === "box") {
    const box: any = {
      type: "container",
      w: el.w,
      h: el.h ?? 0,
      style: {},
    };
    if (el.backgroundColor) {
      const r = Math.round(el.backgroundColor[0] * 255);
      const g = Math.round(el.backgroundColor[1] * 255);
      const b = Math.round(el.backgroundColor[2] * 255);
      const hex = "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
      box.style.backgroundColor = hex;
    }
    if (el.borderRadius) box.style.borderRadius = el.borderRadius;
    if (el.children && el.children.length > 0) {
      box.children = el.children.map(elementToJson);
    }
    return box;
  }
  return el;
}