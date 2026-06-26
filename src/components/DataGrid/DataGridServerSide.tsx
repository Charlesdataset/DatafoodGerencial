import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
} from "@tanstack/react-table";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useResponsive } from "../../hooks/useResponsive";
import dayjsUtc from "../../utils/dates";
import { IconPin, IconPinOff } from "./DataGrid";
import styles from "./DataGrid.module.scss";

// ============================================
// TIPOS
// ============================================
export type MaskType =
    | "monetary"
    | "monetary-clear"
    | "cpf"
    | "cnpj"
    | "document"
    | "phone"
    | "cep"
    | "number"
    | "decimal"
    | "percent"
    | "email"
    | "datetime"
    | "date";

export type ExtendedColumnDef<T> = ColumnDef<T> & {
    textAlign?: "left" | "center" | "right";
    headerAlign?: "left" | "center" | "right";
    fontWeight?: number | string;
    width?: number | string;
    minWidth?: number | string;
    maxWidth?: number | string;
    colSize?: number | "auto" | "expand" | "fit";
    mask?: MaskType | ((value: any) => string);
    format?: (value: any) => string;
    prefix?: string;
    suffix?: string;
    padStart?: number;
    padChar?: string;
    badge?: (
        value: any,
        row: any,
    ) => {
        label: string;
        color: "green" | "red" | "amber" | "blue" | "gray" | "purple";
    } | null;
    tooltip?: string;
    freeze?: "left" | "right";
};

export interface DataGridServerSideProps<T extends object> {
    data: T[];
    columns: ExtendedColumnDef<T>[];
    totalRows: number;
    limit: number;
    offset: number;
    onPaginationChange: (limit: number, offset: number) => void;
    pageSizeOptions?: number[];
    showPagination?: boolean;
    showPageSizeSelector?: boolean;
    showSorting?: boolean;
    showColumnVisibility?: boolean;
    showVerticalGrid?: boolean;
    showRowNumbers?: boolean;
    showRowSelection?: boolean;
    showExport?: boolean;
    stickyHeader?: boolean;
    striped?: boolean;
    compact?: boolean;
    className?: string;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
    loading?: boolean;
    loadingRows?: number;
    onRowClick?: (row: T) => void;
    onSelectionChange?: (rows: T[]) => void;
    rowHeight?: number | string;
    fontWeight?: number | string;
    headerAlign?: "left" | "center" | "right";
    rowAlign?: "left" | "center" | "right";
    accessKey?: string;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
    autoPageSizeOnDesktop?: boolean;
    offsets?: number;
}

// ============================================
// FORMATAÇÃO
// ============================================
const applyPredefinedMask = (value: any, maskType: string): string => {
    if (value === undefined || value === null) return "";
    const strValue = String(value);

    if (maskType === "monetary" || maskType === "monetary-clear") {
        let normalized = strValue.replace(",", ".");
        let num = parseFloat(normalized);
        if (isNaN(num)) return "";

        if (maskType === "monetary") {
            return num.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                style: "currency",
                currency: "BRL"
            });
        } else {
            return num.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
    }

    const numbers = strValue.replace(/\D/g, "");

    switch (maskType) {
        case "cpf":
            return numbers
                .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                .slice(0, 14);
        case "cnpj":
            return numbers
                .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
                .slice(0, 18);
        case "document":
            return numbers.length <= 11
                ? numbers
                    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                    .slice(0, 14)
                : numbers
                    .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
                    .slice(0, 18);
        case "phone":
            return numbers.length <= 10
                ? numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
                : numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        case "cep":
            return numbers.replace(/(\d{5})(\d{3})/, "$1-$2").slice(0, 9);
        case "percent": {
            const n = parseInt(numbers, 10);
            if (isNaN(n)) return "";
            return (
                (n / 100).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }) + "%"
            );
        }
        case "datetime": {
            return dayjsUtc(new Date(strValue)).format("DD/MM/YYYY HH:mm");
        }
        case "date": {
            return dayjsUtc(new Date(strValue)).format("DD/MM/YYYY");
        }
        default:
            return strValue;
    }
};

const formatCellValue = (
    value: any,
    column: ExtendedColumnDef<any>,
): string => {
    if (value === undefined || value === null) return "—";
    let strValue = String(value);
    if (column.padStart !== undefined) {
        const n = strValue.replace(/\D/g, "");
        if (n.length > 0)
            strValue = n.padStart(column.padStart, column.padChar || "0");
    }
    if (column.mask) {
        if (typeof column.mask === "function") return column.mask(strValue);
        if (typeof column.mask === "string")
            return applyPredefinedMask(strValue, column.mask);
    }
    if (column.format) return column.format(strValue);
    if (column.prefix) strValue = column.prefix + strValue;
    if (column.suffix) strValue = strValue + column.suffix;
    return strValue;
};

// ============================================
// ÍCONES
// ============================================
const IconSort = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
            d="M4.5 5.5L7 3L9.5 5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M4.5 8.5L7 11L9.5 8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconSortAsc = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
            d="M4.5 8L7 5L9.5 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconSortDesc = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
            d="M4.5 6L7 9L9.5 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconChevronLeft = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
            d="M9 3L5 7L9 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconChevronRight = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
            d="M5 3L9 7L5 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconChevronsLeft = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
            d="M7 3L3 7L7 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M11 3L7 7L11 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconChevronsRight = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
            d="M3 3L7 7L3 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M7 3L11 7L7 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconDownload = () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path
            d="M7.5 1V10M7.5 10L4 6.5M7.5 10L11 6.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M2 12H13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </svg>
);

const IconInfo = () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
        <path
            d="M6.5 5.5V9.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
        />
        <circle cx="6.5" cy="3.5" r="0.7" fill="currentColor" />
    </svg>
);

const IconEmpty = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect
            x="6"
            y="10"
            width="36"
            height="30"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 3"
        />
        <path d="M6 18H42" stroke="currentColor" strokeWidth="1.5" />
        <path d="M18 10V18" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="24" cy="32" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path
            d="M27.5 35.5L31 39"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </svg>
);

const IconSettings = () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3" />
        <path
            d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.75 2.75l1.06 1.06M11.19 11.19l1.06 1.06M2.75 12.25l1.06-1.06M11.19 3.81l1.06-1.06"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
        />
    </svg>
);

const IconEye = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse
            cx="7"
            cy="7"
            rx="5"
            ry="3.5"
            stroke="currentColor"
            strokeWidth="1.2"
        />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
);

const IconEyeOff = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
            d="M2 7S3.5 4 7 4s5 3 5 3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
        />
        <line
            x1="2"
            y1="2"
            x2="12"
            y2="12"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
        />
    </svg>
);

// ============================================
// SKELETON & BADGE
// ============================================
const SkeletonRow: React.FC<{ cols: number; index: number }> = React.memo(
    ({ cols, index }) => (
        <tr
            className={styles.skeletonRow}
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className={styles.skeletonCell}>
                    <div
                        className={styles.skeletonBar}
                        style={{ width: `${55 + Math.sin(index * 3 + i) * 30}%` }}
                    />
                </td>
            ))}
        </tr>
    ),
);

const Badge: React.FC<{ label: string; color: string }> = React.memo(
    ({ label, color }) => (
        <span className={`${styles.badge} ${styles[`badge_${color}`]}`}>
            {label}
        </span>
    ),
);

// ============================================
// COMPONENTE PRINCIPAL (SERVER SIDE) - CORRIGIDO
// ============================================
const DataGridServerSide = <T extends object>({
    data,
    columns,
    totalRows,
    limit,
    offset,
    onPaginationChange,
    pageSizeOptions = [10, 25, 50, 100],
    showPagination = true,
    showPageSizeSelector = true,
    showSorting = true,
    showVerticalGrid = false,
    showRowNumbers = false,
    showRowSelection = false,
    showExport = false,
    stickyHeader = true,
    striped = true,
    compact = false,
    className = "",
    emptyMessage = "Nenhum registro encontrado",
    emptyIcon,
    loading = false,
    loadingRows = 8,
    onRowClick,
    onSelectionChange,
    rowHeight,
    fontWeight = 400,
    headerAlign = "left",
    rowAlign = "left",
    accessKey,
    title,
    subtitle,
    actions,
    autoPageSizeOnDesktop = false,
    offsets = 0,
}: DataGridServerSideProps<T>) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter] = useState("");
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
    const [columnVisibility, setColumnVisibility] = useState<
        Record<string, boolean>
    >({});
    const [showCogMenu, setShowCogMenu] = useState(false);
    const [cogTab, setCogTab] = useState<"visibility" | "freeze">("visibility");
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [frozenCols, setFrozenCols] = useState<
        Record<string, "left" | "right">
    >(() => {
        const init: Record<string, "left" | "right"> = {};
        columns.forEach((col) => {
            const id = String((col as any).id ?? (col as any).accessorKey ?? "");
            if (col.freeze) init[id] = col.freeze;
        });
        return init;
    });

    const [colWidths, setColWidths] = useState<Record<string, number>>({});
    const [calculatedLimit, setCalculatedLimit] = useState<number | undefined>(undefined);
    const [gridHeight, setGridHeight] = useState<number | undefined>(undefined);
    const [isAutoSizeReady, setIsAutoSizeReady] = useState(false);
    const tableRef = useRef<HTMLTableElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const cogMenuRef = useRef<HTMLDivElement>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const { height, up } = useResponsive();

    const effectiveLimit =
        autoPageSizeOnDesktop && up("nt") && calculatedLimit ? calculatedLimit : limit;

    const currentPage = Math.floor(offset / effectiveLimit) + 1;
    const totalPages = Math.ceil(totalRows / effectiveLimit);

    // Fecha cog ao clicar fora
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (cogMenuRef.current && !cogMenuRef.current.contains(e.target as Node))
                setShowCogMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Cálculo do auto page size com ResizeObserver e debounce
    useEffect(() => {
        if (!autoPageSizeOnDesktop || !up("nt") || !rootRef.current) {
            setCalculatedLimit(undefined);
            setGridHeight(undefined);
            setIsAutoSizeReady(false);
            return;
        }

        let timeoutId: NodeJS.Timeout;
        let isMounted = true;

        const calculateDimensions = () => {
            if (!isMounted || !rootRef.current || !tableRef.current) return;

            const rootEl = rootRef.current;
            const toolbarEl = rootEl.querySelector(`.${styles.toolbar}`) as HTMLElement | null;
            const footerEl = rootEl.querySelector(`.${styles.footer}`) as HTMLElement | null;
            const theadEl = tableRef.current.querySelector("thead") as HTMLElement | null;

            const toolbarHeight = toolbarEl?.offsetHeight ?? 0;
            const footerHeight = footerEl?.offsetHeight ?? 0;
            const headerHeight = theadEl?.offsetHeight ?? 0;
            const rowHeightValue =
                typeof rowHeight === "number"
                    ? rowHeight
                    : rowHeight
                        ? parseInt(String(rowHeight), 10) || 44
                        : 44;
            const bottomGap = 80;

            const rootRect = rootEl.getBoundingClientRect();
            const rootAvailableHeight =
                height - rootRect.top - bottomGap + 60 - offsets;
            const bodyAvailableHeight =
                rootAvailableHeight - toolbarHeight - footerHeight - headerHeight;
            const computedRows = Math.max(1, Math.floor(bodyAvailableHeight / rowHeightValue));

            if (computedRows > 0 && computedRows !== calculatedLimit) {
                setCalculatedLimit(computedRows);
            }

            setGridHeight(Math.max(rootAvailableHeight, rowHeightValue * 2));
        };

        const debouncedCalculate = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                calculateDimensions();
            }, 150);
        };

        // Calcula inicialmente após um pequeno delay para garantir DOM estável
        const initialTimer = setTimeout(() => {
            calculateDimensions();
            setIsAutoSizeReady(true);
        }, 200);

        // Usa ResizeObserver para detectar mudanças no tamanho do container
        resizeObserverRef.current = new ResizeObserver(() => {
            debouncedCalculate();
        });

        resizeObserverRef.current.observe(rootRef.current);

        window.addEventListener('resize', debouncedCalculate);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            clearTimeout(initialTimer);
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
            window.removeEventListener('resize', debouncedCalculate);
        };
    }, [autoPageSizeOnDesktop, up, height, rowHeight, offsets, calculatedLimit]);

    // Notifica mudança de paginação - com prevenção de loop
    useEffect(() => {
        if (!autoPageSizeOnDesktop || !up("nt") || calculatedLimit == null) return;
        if (!isAutoSizeReady) return;
        if (calculatedLimit !== limit && !loading) {
            onPaginationChange(calculatedLimit, 0);
        }
    }, [autoPageSizeOnDesktop, up, calculatedLimit, limit, onPaginationChange, loading, isAutoSizeReady]);

    // Notifica seleção ao pai
    useEffect(() => {
        if (!onSelectionChange) return;
        const selected = Object.keys(rowSelection)
            .filter((k) => rowSelection[k])
            .map((k) => data[parseInt(k)]);
        onSelectionChange(selected);
    }, [rowSelection, data, onSelectionChange]);

    // Mede larguras reais das colunas com debounce
    useEffect(() => {
        if (!tableRef.current) return;
        if (Object.keys(frozenCols).length === 0) return;

        let timeoutId: NodeJS.Timeout;

        const measureWidths = () => {
            const ths = tableRef.current?.querySelectorAll<HTMLElement>("thead th[data-colid]");
            if (!ths) return;

            const widths: Record<string, number> = {};
            ths.forEach((th) => {
                const id = th.dataset.colid!;
                widths[id] = th.offsetWidth;
            });

            setColWidths((prev) => {
                const changed = Object.keys(widths).some((k) => prev[k] !== widths[k]);
                return changed ? widths : prev;
            });
        };

        timeoutId = setTimeout(measureWidths, 100);

        return () => clearTimeout(timeoutId);
    }, [frozenCols, columnVisibility, columns.length, data]);

    // Handlers de paginação server-side
    const goToPage = useCallback(
        (page: number) => {
            const newOffset = (page - 1) * effectiveLimit;
            onPaginationChange(effectiveLimit, newOffset);
        },
        [effectiveLimit, onPaginationChange],
    );

    const nextPage = useCallback(() => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    }, [currentPage, totalPages, goToPage]);

    const previousPage = useCallback(() => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    }, [currentPage, goToPage]);

    const changePageSize = useCallback(
        (newSize: number) => {
            onPaginationChange(newSize, 0);
        },
        [onPaginationChange],
    );

    // Colunas internas
    const selectionColumn = useMemo<ExtendedColumnDef<T>>(
        () => ({
            id: "__select__",
            header: ({ table }) => (
                <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={table.getIsAllPageRowsSelected()}
                    ref={(el) => {
                        if (el) el.indeterminate = table.getIsSomePageRowsSelected();
                    }}
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            colSize: "fit",
            width: 44,
        }),
        [],
    );

    const rowNumberColumn = useMemo<ExtendedColumnDef<T>>(
        () => ({
            id: "__rownum__",
            header: "#",
            cell: ({ row }) => (
                <span className={styles.rowNumber}>{offset + row.index + 1}</span>
            ),
            colSize: "fit",
            width: 52,
            textAlign: "center",
            headerAlign: "center",
        }),
        [offset],
    );

    const allColumns = useMemo<ExtendedColumnDef<T>[]>(
        () => [
            ...(showRowSelection ? [selectionColumn] : []),
            ...(showRowNumbers ? [rowNumberColumn] : []),
            ...columns,
        ],
        [showRowSelection, showRowNumbers, rowNumberColumn, selectionColumn, columns],
    );

    const processedColumns = useMemo(
        () =>
            allColumns.map((col) => ({
                ...col,
                cell:
                    col.cell ??
                    ((info: any) => {
                        const value = info.getValue();
                        const colDef = col as ExtendedColumnDef<T>;
                        if (colDef.badge) {
                            const b = colDef.badge(value, info.row.original);
                            if (b)
                                return (
                                    <div className={styles.cellWithBadge}>
                                        <Badge label={b.label} color={b.color} />
                                    </div>
                                );
                        }
                        return (
                            <span className={styles.cellText}>
                                {formatCellValue(value, col)}
                            </span>
                        );
                    }),
            })),
        [allColumns],
    );

    const table = useReactTable({
        data,
        columns: processedColumns as unknown as ColumnDef<T>[],
        state: {
            sorting,
            columnFilters,
            globalFilter,
            rowSelection,
            columnVisibility,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableRowSelection: showRowSelection,
        manualPagination: true,
    });

    const pageNumbers = useMemo<(number | "...")[]>(() => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    }, [totalPages, currentPage]);

    const startRow = totalRows === 0 ? 0 : offset + 1;
    const endRow = Math.min(offset + effectiveLimit, totalRows);
    const selectedCount = Object.values(rowSelection).filter(Boolean).length;

    // Freeze styles
    const freezeInfo = useMemo(() => {
        const visibleIds = table.getVisibleLeafColumns().map((c) => c.id);
        const leftOffset: Record<string, number> = {};
        let accLeft = 0;
        visibleIds.forEach((id) => {
            if (frozenCols[id] === "left") {
                leftOffset[id] = accLeft;
                accLeft += colWidths[id] ?? 120;
            }
        });
        const rightOffset: Record<string, number> = {};
        let accRight = 0;
        [...visibleIds].reverse().forEach((id) => {
            if (frozenCols[id] === "right") {
                rightOffset[id] = accRight;
                accRight += colWidths[id] ?? 120;
            }
        });
        const leftFrozenIds = visibleIds.filter((id) => frozenCols[id] === "left");
        const rightFrozenIds = visibleIds.filter(
            (id) => frozenCols[id] === "right",
        );
        const lastLeftId = leftFrozenIds[leftFrozenIds.length - 1] ?? null;
        const firstRightId = rightFrozenIds[0] ?? null;
        return { leftOffset, rightOffset, lastLeftId, firstRightId };
    }, [frozenCols, colWidths, table.getVisibleLeafColumns()]);

    const getFreezeStyle = (colId: string): React.CSSProperties => {
        const side = frozenCols[colId];
        if (!side) return {};
        if (side === "left")
            return {
                position: "sticky",
                left: freezeInfo.leftOffset[colId] ?? 0,
                zIndex: stickyHeader ? 12 : 3,
            };
        return {
            position: "sticky",
            right: freezeInfo.rightOffset[colId] ?? 0,
            zIndex: stickyHeader ? 12 : 3,
        };
    };

    const fmt = (v: any) => {
        if (v == null) return undefined;
        if (typeof v === "string" && v === "fit") return "fit-content";
        return typeof v === "number" ? `${v}px` : String(v);
    };

    const hasAutoSize = allColumns.some(
        (c: any) => c.colSize === "auto" || c.colSize === "fit",
    );
    const tableLayout = hasAutoSize ? "auto" : "fixed";
    const mapAlign = (a: "left" | "center" | "right") =>
        a === "center" ? "center" : a === "right" ? "flex-end" : "flex-start";

    const toggleFreeze = (colId: string, side: "left" | "right") => {
        setFrozenCols((prev) => {
            const next = { ...prev };
            if (next[colId] === side) delete next[colId];
            else next[colId] = side;
            return next;
        });
    };

    const handleExport = useCallback(() => {
        const visCols = columns;
        const headers = visCols.map((c) =>
            typeof c.header === "string" ? c.header : String((c as any).id ?? ""),
        );
        const rows = data.map((row) =>
            visCols.map((col) => {
                const accessorKey = (col as any).accessorKey;
                const id = (col as any).id;
                const value = accessorKey ? (row as any)[accessorKey] : (row as any)[id];
                return formatCellValue(value, col);
            }),
        );
        const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [data, columns]);

    const cogColumns = table
        .getAllLeafColumns()
        .filter((c) => c.id !== "__select__" && c.id !== "__rownum__");

    return (
        <div
            ref={rootRef}
            className={`${styles.root} ${className} ${compact ? styles.compact : ""}`}
        >
            {(title ||
                subtitle ||
                showExport ||
                actions ||
                (showRowSelection && selectedCount > 0)) && (
                    <div className={styles.toolbar}>
                        <div className={styles.toolbarLeft}>
                            {(title || subtitle) && (
                                <div className={styles.titleBlock}>
                                    {title && <h2 className={styles.title}>{title}</h2>}
                                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                                </div>
                            )}
                        </div>
                        <div className={styles.toolbarRight}>
                            {showRowSelection && selectedCount > 0 && (
                                <span className={styles.selectionBadge}>
                                    {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
                                </span>
                            )}
                            {showExport && (
                                <button
                                    className={styles.toolBtn}
                                    onClick={handleExport}
                                    title="Exportar CSV"
                                >
                                    <IconDownload />
                                    <span>Exportar</span>
                                </button>
                            )}
                            {actions && <div className={styles.toolbarActions}>{actions}</div>}
                        </div>
                    </div>
                )}

            <div className={styles.tableWrap} style={gridHeight && autoPageSizeOnDesktop && up("nt") ? { height: `${gridHeight}px` } : undefined}>
                <table
                    ref={tableRef}
                    className={[
                        styles.table,
                        showVerticalGrid ? styles.vGrid : "",
                        striped ? styles.striped : "",
                        stickyHeader ? styles.sticky : "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    accessKey={accessKey}
                    style={{ tableLayout }}
                >
                    <thead className={styles.thead}>
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id}>
                                {hg.headers.map((header) => {
                                    const colDef = header.column
                                        .columnDef as ExtendedColumnDef<T>;
                                    const colId = header.column.id;
                                    const side = frozenCols[colId];
                                    const isSorted = header.column.getIsSorted();
                                    const canSort = showSorting && header.column.getCanSort();
                                    const tooltipId = `tt-${header.id}`;
                                    const isLastLeft =
                                        side === "left" && freezeInfo.lastLeftId === colId;
                                    const isFirstRight =
                                        side === "right" && freezeInfo.firstRightId === colId;

                                    return (
                                        <th
                                            key={header.id}
                                            data-colid={colId}
                                            className={[
                                                styles.th,
                                                canSort ? styles.thSortable : "",
                                                isSorted ? styles.thSorted : "",
                                                side ? styles.thFrozen : "",
                                                isLastLeft ? styles.frozenLeftEdge : "",
                                                isFirstRight ? styles.frozenRightEdge : "",
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                            style={{
                                                width:
                                                    colDef.colSize === "fit"
                                                        ? "1%"
                                                        : fmt(colDef.width ?? header.getSize()),
                                                minWidth: fmt(colDef.minWidth),
                                                maxWidth: fmt(colDef.maxWidth),
                                                ...getFreezeStyle(colId),
                                            }}
                                            onClick={
                                                canSort
                                                    ? header.column.getToggleSortingHandler()
                                                    : undefined
                                            }
                                        >
                                            <div
                                                className={styles.thInner}
                                                style={{
                                                    justifyContent: mapAlign(
                                                        colDef.headerAlign ??
                                                        colDef.textAlign ??
                                                        headerAlign,
                                                    ),
                                                }}
                                            >
                                                <span className={styles.thLabel}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext(),
                                                        )}
                                                </span>
                                                {colDef.tooltip && (
                                                    <span
                                                        className={styles.thTooltipIcon}
                                                        onMouseEnter={() => setActiveTooltip(tooltipId)}
                                                        onMouseLeave={() => setActiveTooltip(null)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <IconInfo />
                                                        {activeTooltip === tooltipId && (
                                                            <span className={styles.tooltip}>
                                                                {colDef.tooltip}
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                                {canSort && (
                                                    <span className={styles.sortIcon}>
                                                        {isSorted === "asc" ? (
                                                            <IconSortAsc />
                                                        ) : isSorted === "desc" ? (
                                                            <IconSortDesc />
                                                        ) : (
                                                            <IconSort />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>

                    <tbody className={styles.tbody}>
                        {loading ? (
                            Array.from({ length: loadingRows }).map((_, i) => (
                                <SkeletonRow key={i} cols={allColumns.length} index={i} />
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={allColumns.length} className={styles.emptyTd}>
                                    <div className={styles.emptyState}>
                                        <span className={styles.emptyIcon}>
                                            {emptyIcon || <IconEmpty />}
                                        </span>
                                        <p className={styles.emptyMsg}>{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={[
                                        styles.tr,
                                        onRowClick ? styles.trClickable : "",
                                        row.getIsSelected() ? styles.trSelected : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    onClick={() => onRowClick && onRowClick(row.original)}
                                    style={{
                                        height: rowHeight
                                            ? typeof rowHeight === "number"
                                                ? `${rowHeight}px`
                                                : rowHeight
                                            : undefined,
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const colDef = cell.column
                                            .columnDef as ExtendedColumnDef<T>;
                                        const colId = cell.column.id;
                                        const side = frozenCols[colId];
                                        const isLastLeft =
                                            side === "left" && freezeInfo.lastLeftId === colId;
                                        const isFirstRight =
                                            side === "right" && freezeInfo.firstRightId === colId;

                                        return (
                                            <td
                                                key={cell.id}
                                                className={[
                                                    styles.td,
                                                    side ? styles.tdFrozen : "",
                                                    isLastLeft ? styles.frozenLeftEdge : "",
                                                    isFirstRight ? styles.frozenRightEdge : "",
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ")}
                                                style={{
                                                    textAlign: colDef.textAlign ?? rowAlign,
                                                    fontWeight: colDef.fontWeight ?? fontWeight,
                                                    width:
                                                        colDef.colSize === "fit" ? "1%" : fmt(colDef.width),
                                                    minWidth: fmt(colDef.minWidth),
                                                    maxWidth: fmt(colDef.maxWidth),
                                                    ...getFreezeStyle(colId),
                                                }}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles.footer}>
                <div className={styles.footerInfo}>
                    {!loading && totalRows > 0 ? (
                        <span>
                            Exibindo{" "}
                            <strong>
                                {startRow}–{endRow}
                            </strong>{" "}
                            de <strong>{totalRows}</strong> registros
                        </span>
                    ) : null}
                </div>

                {showPagination && !loading && totalRows > 0 && (
                    <div className={styles.footerCenter}>
                        <button
                            className={styles.pgBtn}
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                            title="Primeira"
                        >
                            <IconChevronsLeft />
                        </button>
                        <button
                            className={styles.pgBtn}
                            onClick={previousPage}
                            disabled={currentPage === 1}
                            title="Anterior"
                        >
                            <IconChevronLeft />
                        </button>
                        <div className={styles.pgNumbers}>
                            {pageNumbers.map((p, i) =>
                                p === "..." ? (
                                    <span key={`e${i}`} className={styles.pgEllipsis}>
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        className={`${styles.pgNum} ${currentPage === p ? styles.pgActive : ""}`}
                                        onClick={() => goToPage(p as number)}
                                    >
                                        {p}
                                    </button>
                                ),
                            )}
                        </div>
                        <button
                            className={styles.pgBtn}
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            title="Próxima"
                        >
                            <IconChevronRight />
                        </button>
                        <button
                            className={styles.pgBtn}
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages}
                            title="Última"
                        >
                            <IconChevronsRight />
                        </button>
                    </div>
                )}

                <div className={styles.footerRight}>
                    {showPagination &&
                        showPageSizeSelector &&
                        !loading &&
                        totalRows > 0 && (
                            <>
                                <label className={styles.psLabel}>Linhas:</label>
                                <select
                                    className={styles.psSelect}
                                    value={effectiveLimit}
                                    onChange={(e) => changePageSize(Number(e.target.value))}
                                >
                                    {pageSizeOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}

                    <div className={styles.cogWrap} ref={cogMenuRef}>
                        <button
                            className={`${styles.cogBtn} ${showCogMenu ? styles.cogBtnActive : ""}`}
                            onClick={() => setShowCogMenu((v) => !v)}
                            title="Configurações da tabela"
                        >
                            <IconSettings />
                        </button>

                        {showCogMenu && (
                            <div className={styles.cogMenu}>
                                <div className={styles.cogTabs}>
                                    <button
                                        className={`${styles.cogTab} ${cogTab === "visibility" ? styles.cogTabActive : ""}`}
                                        onClick={() => setCogTab("visibility")}
                                    >
                                        <IconEye /> Colunas
                                    </button>
                                    <button
                                        className={`${styles.cogTab} ${cogTab === "freeze" ? styles.cogTabActive : ""}`}
                                        onClick={() => setCogTab("freeze")}
                                    >
                                        <IconPin /> Congelar
                                    </button>
                                </div>

                                {cogTab === "visibility" && (
                                    <div className={styles.cogBody}>
                                        <p className={styles.cogSectionLabel}>
                                            Mostrar / ocultar colunas
                                        </p>
                                        {cogColumns.map((col) => {
                                            const label =
                                                typeof col.columnDef.header === "string"
                                                    ? col.columnDef.header
                                                    : col.id;
                                            return (
                                                <label key={col.id} className={styles.cogItem}>
                                                    <input
                                                        type="checkbox"
                                                        className={styles.checkbox}
                                                        checked={col.getIsVisible()}
                                                        onChange={col.getToggleVisibilityHandler()}
                                                    />
                                                    <span className={styles.cogItemLabel}>{label}</span>
                                                    <span
                                                        className={`${styles.cogItemIcon} ${!col.getIsVisible() ? styles.cogItemIconMuted : ""}`}
                                                    >
                                                        {col.getIsVisible() ? <IconEye /> : <IconEyeOff />}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {cogTab === "freeze" && (
                                    <div className={styles.cogBody}>
                                        <p className={styles.cogSectionLabel}>
                                            Fixar coluna na borda
                                        </p>
                                        {cogColumns.map((col) => {
                                            const colId = col.id;
                                            const currentSide = frozenCols[colId];
                                            const label =
                                                typeof col.columnDef.header === "string"
                                                    ? col.columnDef.header
                                                    : colId;
                                            return (
                                                <div key={colId} className={styles.freezeRow}>
                                                    <span className={styles.freezeLabel}>{label}</span>
                                                    <div className={styles.freezeBtns}>
                                                        <button
                                                            className={`${styles.freezeBtn} ${currentSide === "left" ? styles.freezeBtnActive : ""}`}
                                                            onClick={() => toggleFreeze(colId, "left")}
                                                            title="Fixar à esquerda"
                                                        >
                                                            ← Esq
                                                        </button>
                                                        <button
                                                            className={`${styles.freezeBtn} ${currentSide === "right" ? styles.freezeBtnActive : ""}`}
                                                            onClick={() => toggleFreeze(colId, "right")}
                                                            title="Fixar à direita"
                                                        >
                                                            Dir →
                                                        </button>
                                                        {currentSide && (
                                                            <button
                                                                className={styles.freezeBtnClear}
                                                                onClick={() => toggleFreeze(colId, currentSide)}
                                                                title="Remover fixação"
                                                            >
                                                                <IconPinOff />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Object.keys(frozenCols).length > 0 && (
                                            <button
                                                className={styles.freezeClearAll}
                                                onClick={() => setFrozenCols({})}
                                            >
                                                Remover todas as fixações
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataGridServerSide;