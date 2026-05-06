import styles from "./PageSkeleton.module.scss";

const ROWS = 8;
// Widths variados para parecer dados reais (sem ser uniformes demais)
const rowWidths: Array<[string, string, string]> = [
  ["80%", "65%", "55%"],
  ["70%", "80%", "45%"],
  ["90%", "50%", "70%"],
  ["65%", "75%", "60%"],
  ["75%", "60%", "80%"],
  ["85%", "70%", "50%"],
  ["60%", "85%", "65%"],
  ["78%", "55%", "75%"],
];

export default function PageSkeleton() {
  return (
    <div className={styles.skeleton}>
      {/* Toolbar / filtros */}
      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchBar} />
          <div className={styles.filterChip} />
          <div className={styles.filterChipSm} />
          <div className={styles.spacer} />
          <div className={styles.btnPrimary} />
        </div>
      </div>

      {/* Tabela */}
      <div className={styles.tableCard}>
        {/* Header da grid */}
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle} />
          <div className={styles.tableSub} />
          <div className={styles.tableHeaderSpacer} />
          <div className={styles.tableCog} />
        </div>

        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr className={styles.thRow}>
              <th className={styles.th} style={{ width: 56 }}>
                <div className={styles.thBar} />
              </th>
              <th className={styles.th} style={{ width: 56 }}>
                <div className={styles.thBar} />
              </th>
              <th className={styles.th}>
                <div className={styles.thBar} />
              </th>
              <th className={styles.th} style={{ width: 90 }}>
                <div className={styles.thBar} />
              </th>
              <th className={styles.th} style={{ width: 110 }}>
                <div className={styles.thBar} />
              </th>
              <th className={styles.th} style={{ width: 130 }}>
                <div className={styles.thBar} />
              </th>
              <th className={styles.th} style={{ width: 110 }}>
                <div className={styles.thBar} />
              </th>
              <th className={styles.th} style={{ width: 100 }}>
                <div className={styles.thBar} />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }).map((_, i) => {
              const [w1, w2, w3] = rowWidths[i % rowWidths.length];
              return (
                <tr key={i} className={styles.tr}>
                  {/* Código */}
                  <td className={styles.td}>
                    <div className={styles.tdBarXs} />
                  </td>
                  {/* Thumb */}
                  <td className={styles.td}>
                    <div className={styles.tdThumb} />
                  </td>
                  {/* Descrição */}
                  <td className={styles.td}>
                    <div className={styles.tdBar} style={{ width: w1 }} />
                  </td>
                  {/* Qtd */}
                  <td className={styles.td}>
                    <div className={styles.tdBarXs} />
                  </td>
                  {/* Preço */}
                  <td className={styles.td}>
                    <div
                      className={styles.tdBarSm}
                      style={{ width: w2, marginLeft: "auto" }}
                    />
                  </td>
                  {/* Grupo */}
                  <td className={styles.td}>
                    <div className={styles.tdBarSm} style={{ width: w3 }} />
                  </td>
                  {/* Status badge */}
                  <td className={styles.td}>
                    <div className={styles.tdBadge} />
                  </td>
                  {/* Ações */}
                  <td className={styles.td}>
                    <div className={styles.tdBarXs} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer com paginação */}
        <div className={styles.tableFooter}>
          <div className={styles.footerInfo} />
          <div className={styles.footerPagination}>
            <div className={styles.pgBtn} />
            <div className={styles.pgBtn} />
            <div className={styles.pgBtn} />
            <div className={styles.pgBtn} />
            <div className={styles.pgBtn} />
          </div>
        </div>
      </div>
    </div>
  );
}
