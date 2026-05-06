/* tslint:disable */
/* eslint-disable */

export function generate_flex_report(json: string): Uint8Array;

export function generate_pdf(config_json: string): Uint8Array;

export function generate_pdf_v3(report_json: string, datasets_json: string, variables_json: string): Uint8Array;

export function gerar_pdf_brincadeira(config_json: string): Uint8Array;

export function gerar_relatorio_estiloso(config_json: string): Uint8Array;

export function gerar_relatorio_premium(config_json: string): Uint8Array;

export function init_panic_hook(): void;

export function render_template(plan_json: string): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly generate_flex_report: (a: number, b: number, c: number) => void;
    readonly generate_pdf: (a: number, b: number, c: number) => void;
    readonly generate_pdf_v3: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly gerar_pdf_brincadeira: (a: number, b: number, c: number) => void;
    readonly gerar_relatorio_estiloso: (a: number, b: number, c: number) => void;
    readonly gerar_relatorio_premium: (a: number, b: number, c: number) => void;
    readonly render_template: (a: number, b: number, c: number) => void;
    readonly init_panic_hook: () => void;
    readonly __wbindgen_export: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export2: (a: number, b: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
