import React, { useEffect, useMemo, useRef, useState } from "react";

import { TextSearch } from "../../Inputs/TextSearch/TextSearch";
import ListGroup from "../../ListGroup/ListGroup";
import { Modal } from "../index";
import styles from "./SelectModal.module.scss";

// ─── Tipos de campo ───────────────────────────────────────────────────────────
type MaskType = "monetary" | "cpf" | "cnpj" | "document" | "phone" | "cep" | "number";

export interface FieldDef {
  /** Chave do objeto retornado pelo fetchItems */
  key: string;
  /** Máscara aplicada ao valor */
  mask?: MaskType | ((value: string) => string);
  /** Texto prefixado antes do valor */
  prefix?: string;
  /** Texto sufixado após o valor */
  suffix?: string;
  /** Comprimento mínimo — preenche com `padChar` à esquerda se necessário */
  padStart?: number;
  /** Caractere usado no preenchimento @default "0" */
  padChar?: string;
  /** Espaçamento à esquerda do campo em nº de espaços */
  marginStart?: number;
  /** Espaçamento à direita do campo em nº de espaços */
  marginEnd?: number;
}

/** Uma configuração de campo: pode ser a chave direta ou um objeto com opções */
export type FieldConfig = string | FieldDef;

export interface DisplayConfig {
  /** Campo(s) que formam o texto principal (linha de cima do item) */
  primary: FieldConfig | FieldConfig[];
  /** Campo(s) que formam a descrição secundária (linha de baixo) */
  secondary?: FieldConfig | FieldConfig[];
  /** Separador ao concatenar múltiplos campos @default " " */
  separator?: string;
}

// ─── Item genérico ────────────────────────────────────────────────────────────
export interface SelectItem {
  id: number | string;
  /** Campo legado — usado como fallback quando keyShow não é informado */
  descricao?: string;
  [key: string]: any;
}

export interface SelectedValue {
  id: number | string;
  /** Texto principal resolvido */
  name: string;
  /** Item original completo */
  raw: SelectItem;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SelectModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  /** Função assíncrona que retorna a lista de itens */
  fetchItems: () => Promise<SelectItem[]>;
  title?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /**
   * Configura quais campos exibir no item.
   * - `primary`: texto principal (topo)
   * - `secondary`: descrição (abaixo)
   *
   * @example
   * keyShow={{ primary: "nome", secondary: [{ key: "id", prefix: "Cód. " }] }}
   */
  keyShow?: DisplayConfig;
  /**
   * Ícone exibido ao lado de cada item.
   * Aceita um ReactNode estático ou uma função que recebe o item.
   * @default ícone de pessoa
   */
  icon?: React.ReactNode | ((item: SelectItem) => React.ReactNode);
  /**
   * Campo do item que contém a URL da imagem.
   * Quando informado, substitui o `icon` por um avatar com a imagem.
   * Aceita também uma função que recebe o item e retorna a URL.
   */
  img?: string | ((item: SelectItem) => string);
  /** IDs a omitir completamente da lista (já selecionados externamente) */
  excludeIds?: (number | string)[];
  /**
   * Dados já selecionados externamente. O modal extrai os IDs e omite esses
   * itens da lista automaticamente — sem precisar de useState extra.
   * Aceita qualquer objeto que tenha um campo `id`.
   */
  selectedData?: Array<{ id: number | string; [key: string]: any }>;
  bucketEvent?: string;
  /**
   * Campos usados para gerar filtros de combobox acima da lista.
   * Ex: filtersBox={["grupo", "categoria"]} → cria um select para cada campo
   * com os valores únicos encontrados nos itens carregados.
   */
  filtersBox?: string[];
  /**
   * Campo usado como chave única de cada item. @default "id"
   * Use quando a API retorna um campo diferente, ex: "idProduto".
   */
  idField?: string;
}

interface SingleModeProps extends SelectModalBaseProps {
  mode?: "single";
  onSelect: (item: SelectedValue) => void;
  onMultiSelect?: never;
  selectedIds?: never;
}

interface MultiModeProps extends SelectModalBaseProps {
  mode: "multi";
  onSelect?: never;
  onMultiSelect: (items: SelectedValue[]) => void;
  /** IDs pré-selecionados ao abrir o modal */
  selectedIds?: (number | string)[];
}

export type SelectModalProps = SingleModeProps | MultiModeProps;

// ─── Helpers de máscara ───────────────────────────────────────────────────────
function applyBuiltinMask(value: string, mask: MaskType): string {
  const n = value.replace(/\D/g, "");
  switch (mask) {
    case "phone":
      if (!n.length) return "";
      if (n.length <= 2) return `(${n}`;
      if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
      return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
    case "cpf":
      if (n.length <= 3) return n;
      if (n.length <= 6) return n.replace(/(\d{3})(\d+)/, "$1.$2");
      if (n.length <= 9) return n.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
      return n.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4").slice(0, 14);
    case "cnpj":
      if (n.length <= 2) return n;
      if (n.length <= 5) return n.replace(/(\d{2})(\d+)/, "$1.$2");
      if (n.length <= 8) return n.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
      if (n.length <= 12) return n.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
      return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5").slice(0, 18);
    case "cep":
      if (n.length <= 5) return n;
      return n.replace(/(\d{5})(\d+)/, "$1-$2").slice(0, 9);
    case "monetary":
      if (!n) return "";
      return (parseInt(n, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    case "number":
      return n;
    default:
      return value;
  }
}

function resolveField(item: SelectItem, field: FieldConfig): string {
  if (typeof field === "string") return String(item[field] ?? "");
  const raw = String(item[field.key] ?? "");
  let masked = raw;
  if (field.mask) {
    masked = typeof field.mask === "function" ? field.mask(raw) : applyBuiltinMask(raw, field.mask);
  }
  if (field.padStart) {
    masked = masked.padStart(field.padStart, field.padChar ?? "0");
  }
  return `${"\u00a0".repeat(field.marginStart ?? 0)}${field.prefix ?? ""}${masked}${field.suffix ?? ""}${"\u00a0".repeat(field.marginEnd ?? 0)}`;
}

function resolveFields(item: SelectItem, config: FieldConfig | FieldConfig[], sep = " "): string {
  const arr = Array.isArray(config) ? config : [config];
  return arr
    .map((f) => resolveField(item, f))
    .filter(Boolean)
    .join(sep);
}

// ─── Ícones internos ──────────────────────────────────────────────────────────
const SpinnerIcon = () => (
  <svg className={styles.spinner} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="44" strokeDashoffset="22" strokeLinecap="round" />
  </svg>
);

const IconPerson = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2 13.5C2 11 4.5 9 7.5 9s5.5 2 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── SelectModal ──────────────────────────────────────────────────────────────
const SelectModal: React.FC<SelectModalProps> = ({
  isOpen,
  onClose,
  fetchItems,
  title = "Selecione o item",
  searchPlaceholder = "Buscar por nome ou código...",
  emptyMessage = "Nenhum item encontrado.",
  keyShow,
  icon,
  img,
  mode = "single",
  excludeIds,
  selectedData,
  selectedIds: selectedIdsProp,
  bucketEvent,
  filtersBox,
  idField = "id",
  ...rest
}) => {
  const [items, setItems] = useState<SelectItem[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIdsFromProps = mode === "multi" ? (selectedIdsProp ?? []) : [];
  const selectedDataIds = mode === "multi" ? (selectedData ?? []).map((item) => item.id) : [];
  const initialSelectedIds = mode === "multi" ? Array.from(new Set([...selectedIdsFromProps, ...selectedDataIds])) : [];
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set(initialSelectedIds));
  const [selectedItems, setSelectedItems] = useState<SelectedValue[]>([]);
  const externalSelectedData = mode === "multi" ? (selectedData ?? []) : [];
  const fetchItemsRef = useRef(fetchItems);

  useEffect(() => {
    fetchItemsRef.current = fetchItems;
  }, [fetchItems]);

  const selectedItemsEqual = (a: SelectedValue[], b: SelectedValue[]) => {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item.id === b[index].id && item.name === b[index].name);
  };

  // ── Estado dos filtros de combobox ────────────────────────────────────────
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Reseta filtros ao abrir/fechar
  useEffect(() => {
    if (!isOpen) setFilterValues({});
  }, [isOpen]);

  // Detecta teclado virtual aberto via visualViewport (só em telas <= 420px)
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const baseHeightRef = useRef<number>(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || window.innerWidth > 420) return;
    baseHeightRef.current = vv.height;
    const onResize = () => {
      // teclado é considerado aberto quando o viewport encolheu > 150px
      setKeyboardOpen(vv.height < baseHeightRef.current - 150);
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setFiltro("");
    setError(null);
    if (mode === "multi") {
      const ids = Array.from(new Set([...selectedIdsFromProps, ...selectedDataIds]));
      setSelectedIds((prev) => {
        const next = new Set(ids);
        if (prev.size === next.size && Array.from(prev).every((id) => next.has(id))) {
          return prev;
        }
        return next;
      });
    }
    const load = async () => {
      setLoading(true);
      try {
        setItems(await fetchItemsRef.current());
      } catch {
        setError("Não foi possível carregar os itens.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, mode]);

  useEffect(() => {
    if (mode !== "multi") return;
    const selected = Array.from(selectedIds).map((id) => {
      const item = items.find((i) => i[idField] === id);
      if (item) return toSelectedValue(item);
      const raw = externalSelectedData.find((x) => x.id === id);
      return {
        id,
        name: raw ? getPrimary(raw as SelectItem) : String(id),
        raw: (raw ?? { id } as SelectItem),
      };
    });
    if (!selectedItemsEqual(selectedItems, selected)) {
      setSelectedItems(selected);
    }
  }, [items, selectedIds, idField, externalSelectedData, mode, keyShow]);

  // ── Resolução de textos ────────────────────────────────────────────────────
  const sep = keyShow?.separator ?? " ";

  const getPrimary = (item: SelectItem): string => {
    if (keyShow?.primary) return resolveFields(item, keyShow.primary, sep);
    return item.descricao ?? String(item.id);
  };

  const getSecondary = (item: SelectItem): string => {
    if (keyShow?.secondary) return resolveFields(item, keyShow.secondary, sep);
    // Se keyShow foi informado mas sem secondary → sem descrição
    if (keyShow) return "";
    return `Cód. ${String(item.id).padStart(4, "0")}`;
  };

  const getIcon = (item: SelectItem): React.ReactNode => {
    // img tem prioridade sobre icon
    if (img) {
      const url = typeof img === "function" ? img(item) : item[img];
      const currBucket = bucketEvent ? item[bucketEvent] : undefined;
      return url ? <img src={`${import.meta.env.VITE_BASE_URL_BUCKET}/${currBucket}/${url}`} alt="" className={styles.itemAvatar} /> : <IconPerson />;
    }
    if (!icon) return null; // sem icon nem img → sem ícone
    if (typeof icon === "function") return icon(item);
    return icon;
  };

  // ── Filtragem (busca em primary + secondary + excludeIds) ───────────────
  // Opções únicas para cada campo de filtersBox
  const filterOptions = useMemo(() => {
    if (!filtersBox?.length) return {};
    const map: Record<string, string[]> = {};
    for (const field of filtersBox) {
      const unique = Array.from(new Set(items.map((i) => String(i[field] ?? "")).filter(Boolean))).sort();
      map[field] = unique;
    }
    return map;
  }, [items, filtersBox]);

  const itemsFiltrados = useMemo(() => {
    const excludeSet = new Set([...(excludeIds ?? []), ...Array.from(selectedIds)]);
    let base = excludeSet.size > 0 ? items.filter((item) => !excludeSet.has(item[idField])) : items;
    // Aplica filtros dos comboboxes
    for (const [field, val] of Object.entries(filterValues)) {
      if (val) base = base.filter((item) => String(item[field] ?? "") === val);
    }
    if (!filtro.trim()) return base;
    const f = filtro.toLowerCase();
    return base.filter((item) => getPrimary(item).toLowerCase().includes(f) || getSecondary(item).toLowerCase().includes(f) || String(item.id).includes(f));
  }, [items, filtro, keyShow, excludeIds, selectedIds, filterValues]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toSelectedValue = (item: SelectItem): SelectedValue => ({
    id: item[idField],
    name: getPrimary(item),
    raw: item,
  });

  const handleSingleSelect = (item: SelectItem) => {
    const value = toSelectedValue(item);
    setSelectedItems([value]);
    (rest as SingleModeProps).onSelect(value);
    onClose();
  };

  const handleMultiToggle = (item: SelectItem) => {
    const itemId = item[idField];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
        setSelectedItems((prevItems) => prevItems.filter((selected) => selected.id !== itemId));
      } else {
        next.add(itemId);
        setSelectedItems((prevItems) => {
          const nextItems = prevItems.filter((selected) => selected.id !== itemId);
          return [...nextItems, toSelectedValue(item)];
        });
      }
      return next;
    });
  };

  const handleRemoveSelected = (id: number | string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSelectedItems((prevItems) => prevItems.filter((selected) => selected.id !== id));
  };

  const handleMultiConfirm = () => {
    const selected = items.filter((i) => selectedIds.has(i[idField])).map(toSelectedValue);
    (rest as MultiModeProps).onMultiSelect(selected);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" centered>
      <Modal.Header onClose={onClose}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body noPadding>
        <div className={styles.searchWrap}>
          <TextSearch placeholder={searchPlaceholder} value={filtro} onChange={(e) => setFiltro(e.target.value)} autoFocus />
        </div>

        {filtersBox && filtersBox.length > 0 && !loading && (
          <div className={styles.filtersRow}>
            {filtersBox.map((field) => {
              const opts = filterOptions[field] ?? [];
              return (
                <select key={field} className={styles.filterSelect} value={filterValues[field] ?? ""} onChange={(e) => setFilterValues((prev) => ({ ...prev, [field]: e.target.value }))}>
                  <option value="">{field.charAt(0).toUpperCase() + field.slice(1)}: Todos</option>
                  {opts.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              );
            })}
          </div>
        )}

        {mode === "multi" && selectedIds.size > 0 && (
          <div className={styles.selectedBar}>
            <span className={styles.selectedCount}>
              {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <button type="button" className={styles.clearBtn} onClick={() => setSelectedIds(new Set())}>
              Limpar
            </button>
          </div>
        )}

        <div className={styles.listWrap}>
          {loading ? (
            <div className={styles.stateBox}>
              <SpinnerIcon />
              <span>Carregando...</span>
            </div>
          ) : error ? (
            <div className={`${styles.stateBox} ${styles.stateError}`}>{error}</div>
          ) : (
            <ListGroup flush compact emptyMessage={emptyMessage}>
              {itemsFiltrados.map((item) => {
                const isSelected = selectedIds.has(item[idField]);
                return (
                  <ListGroup.Item
                    key={item[idField]}
                    icon={getIcon(item)}
                    description={getSecondary(item)}
                    onClick={() => (mode === "multi" ? handleMultiToggle(item) : handleSingleSelect(item))}
                    className={isSelected ? styles.itemSelected : undefined}
                    suffix={mode === "multi" ? <span className={`${styles.checkBox} ${isSelected ? styles.checkBoxChecked : ""}`}>{isSelected && <IconCheck />}</span> : undefined}
                  >
                    {getPrimary(item)}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </div>

        <div className={styles.pillsWrap}>
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.pill}
                onClick={() => handleRemoveSelected(item.id)}
              >
                <span className={styles.pillLabel}>{item.name}</span>
                <span className={styles.pillRemove} aria-label="Remover">×</span>
              </button>
            ))
          ) : (
            <div className={styles.noSelectedText}>Nenhum selecionado</div>
          )}
        </div>

        {!loading && !error && items.length > 0 && (
          <div className={styles.countBar}>{filtro ? `${itemsFiltrados.length} de ${items.length} item${items.length !== 1 ? "s" : ""}` : `${items.length} item${items.length !== 1 ? "s" : ""}`}</div>
        )}
      </Modal.Body>

      {mode === "multi" && !keyboardOpen && (
        <Modal.Footer>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className={styles.confirmBtn} onClick={handleMultiConfirm}>
            Confirmar{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default SelectModal;
