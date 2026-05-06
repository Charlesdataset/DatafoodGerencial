import React from "react";
import styles from "./Table.module.scss";

// ─── Table Root ───────────────────────────────────────────────────────────────
interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const Table: React.FC<TableProps> & {
  Header: typeof TableHeader;
  Body: typeof TableBody;
  Footer: typeof TableFooter;
  Row: typeof TableRow;
  Cell: typeof TableCell;
  HeadCell: typeof TableHeadCell;
} = ({
  children,
  striped = true,
  bordered = false,
  hover = true,
  size = "md",
  className = "",
  ...props
}) => {
  const classes = [styles.wrapper, className].filter(Boolean).join(" ");

  const tableClasses = [
    styles.table,
    striped ? styles.striped : "",
    bordered ? styles.bordered : "",
    hover ? styles.hover : "",
    styles[`size--${size}`],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      <table className={tableClasses}>{children}</table>
    </div>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className = "",
  ...props
}) => (
  <thead
    className={[styles.thead, className].filter(Boolean).join(" ")}
    {...props}
  >
    {children}
  </thead>
);

// ─── Body ─────────────────────────────────────────────────────────────────────
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

const TableBody: React.FC<TableBodyProps> = ({
  children,
  className = "",
  ...props
}) => (
  <tbody
    className={[styles.tbody, className].filter(Boolean).join(" ")}
    {...props}
  >
    {children}
  </tbody>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

const TableFooter: React.FC<TableFooterProps> = ({
  children,
  className = "",
  ...props
}) => (
  <tfoot
    className={[styles.tfoot, className].filter(Boolean).join(" ")}
    {...props}
  >
    {children}
  </tfoot>
);

// ─── Row ──────────────────────────────────────────────────────────────────────
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  className?: string;
}

const TableRow: React.FC<TableRowProps> = ({
  children,
  className = "",
  ...props
}) => (
  <tr className={[styles.tr, className].filter(Boolean).join(" ")} {...props}>
    {children}
  </tr>
);

// ─── HeadCell (th) ────────────────────────────────────────────────────────────
interface TableHeadCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
  width?: number | string;
  className?: string;
}

const TableHeadCell: React.FC<TableHeadCellProps> = ({
  children,
  align = "left",
  width,
  className = "",
  style,
  ...props
}) => (
  <th
    className={[styles.th, className].filter(Boolean).join(" ")}
    style={{ textAlign: align, width, ...style }}
    {...props}
  >
    {children}
  </th>
);

// ─── Cell (td) ────────────────────────────────────────────────────────────────
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
  bold?: boolean;
  className?: string;
}

const TableCell: React.FC<TableCellProps> = ({
  children,
  align = "left",
  bold = false,
  className = "",
  style,
  ...props
}) => (
  <td
    className={[styles.td, bold ? styles.bold : "", className]
      .filter(Boolean)
      .join(" ")}
    style={{ textAlign: align, ...style }}
    {...props}
  >
    {children}
  </td>
);

// ─── Attach sub-components ────────────────────────────────────────────────────
Table.Header = TableHeader;
Table.Body = TableBody;
Table.Footer = TableFooter;
Table.Row = TableRow;
Table.Cell = TableCell;
Table.HeadCell = TableHeadCell;

export { Table };
export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableCellProps,
  TableHeadCellProps,
};
