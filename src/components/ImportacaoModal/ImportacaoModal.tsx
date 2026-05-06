import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../../services/api";
import { Modal } from "../Modal";
import styles from "./ImportacaoModal.module.scss";

interface EventoItem {
  id: number;
  nome: string;
}

interface ImportItem {
  id: number;
  nome: string;
  habilitaCombo?: boolean;
  produtosCombos?: { produto: string }[];
  selected: boolean;
  imported: boolean;
  error: string | null;
}

interface ImportResults {
  total: number;
  success: number;
  failed: number;
}

interface ImportacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvent: number | string;
  importType?: "P" | "G";
}

export default function ImportacaoModal({
  isOpen,
  onClose,
  currentEvent,
  importType = "P",
}: ImportacaoModalProps) {
  const [sourceEventId, setSourceEventId] = useState("");
  const [events, setEvents] = useState<EventoItem[]>([]);
  const [availableItems, setAvailableItems] = useState<ImportItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<ImportItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResults | null>(
    null,
  );
  const [importedCount, setImportedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState<
    { itemId: number; itemName: string; error: string }[]
  >([]);
  const [retryingErrors, setRetryingErrors] = useState(false);

  const typeName = importType === "G" ? "grupos" : "produtos";
  const singularTypeName = importType === "G" ? "grupo" : "produto";

  const resetStates = () => {
    setSourceEventId("");
    setAvailableItems([]);
    setSelectedItems([]);
    setImportResults(null);
    setImportProgress(0);
    setImportedCount(0);
    setErrorCount(0);
    setErrors([]);
  };

  useEffect(() => {
    if (isOpen) {
      loadAvailableEvents();
      resetStates();
    }
  }, [isOpen, importType]);

  const loadAvailableEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await api.get(
        `/events/available-for-import?eventId=${currentEvent}`,
      );
      if (response.status === 200) {
        setEvents(response.data);
      }
    } catch {
      toast.error("Erro ao carregar lista de eventos");
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadItemsFromEvent = async () => {
    if (!sourceEventId) {
      toast.warn("Selecione um evento fonte");
      return;
    }

    try {
      setLoadingItems(true);
      setAvailableItems([]);
      setSelectedItems([]);

      const endpoint =
        importType === "G"
          ? `/groups/from-event?eventId=${sourceEventId}`
          : `/products/from-event?eventId=${sourceEventId}`;

      const [sourceRes, currentRes] = await Promise.all([
        api.get(endpoint),
        api.get(
          importType === "G"
            ? `/groups/from-event?eventId=${currentEvent}`
            : `/products/from-event?eventId=${currentEvent}`,
        ),
      ]);

      let existingNames: string[] = [];
      if (currentRes.status === 200) {
        existingNames = currentRes.data.map((item: any) =>
          item.nome?.toLowerCase().trim(),
        );
      }

      const filtered: ImportItem[] = (sourceRes.data || [])
        .filter(
          (item: any) =>
            !existingNames.includes(item.nome?.toLowerCase().trim()),
        )
        .map((item: any) => ({
          ...item,
          selected: true,
          imported: false,
          error: null,
        }));

      setAvailableItems(filtered);
      setSelectedItems(filtered);
      toast.success(
        `Encontrados ${filtered.length} ${typeName} disponíveis para importação`,
      );
    } catch {
      toast.error(`Erro ao carregar ${typeName} do evento selecionado`);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleItemToggle = (itemId: number) => {
    let block = false;

    const updatedItems = availableItems.map((item) => {
      if (item.id !== itemId) return item;

      if (importType === "P") {
        // Tentando desmarcar: checar se algum combo depende desse produto
        if (item.selected) {
          const combosDependentes = availableItems.filter(
            (x) =>
              x.habilitaCombo &&
              x.selected &&
              x.id !== itemId &&
              x.produtosCombos?.some((c) => c.produto === item.nome),
          );
          if (combosDependentes.length > 0) {
            toast.info(
              `Desabilite o combo "${combosDependentes[0].nome}" primeiro!`,
            );
            block = true;
            return item;
          }
        } else {
          // Selecionando um combo: selecionar automaticamente seus itens
          if (item.habilitaCombo && item.produtosCombos) {
            const nomesCombo = item.produtosCombos.map((c) => c.produto);
            availableItems.forEach((av) => {
              if (nomesCombo.includes(av.nome) && !av.selected) {
                // marca abaixo
              }
            });
          }
        }
      }
      return { ...item, selected: !item.selected };
    });

    if (block) return;

    // Se selecionando um combo, marcar também seus itens
    const toggledItem = availableItems.find((x) => x.id === itemId);
    if (
      importType === "P" &&
      toggledItem &&
      !toggledItem.selected &&
      toggledItem.habilitaCombo &&
      toggledItem.produtosCombos
    ) {
      const nomesCombo = toggledItem.produtosCombos.map((c) => c.produto);
      const withComboItems = updatedItems.map((item) =>
        nomesCombo.includes(item.nome) ? { ...item, selected: true } : item,
      );
      setAvailableItems(withComboItems);
      setSelectedItems(withComboItems.filter((i) => i.selected));
      return;
    }

    setAvailableItems(updatedItems);
    setSelectedItems(updatedItems.filter((i) => i.selected));
  };

  const handleSelectAll = () => {
    const allSelected = availableItems.every((item) => item.selected);
    const updated = availableItems.map((item) => ({
      ...item,
      selected: !allSelected,
    }));
    setAvailableItems(updated);
    setSelectedItems(!allSelected ? updated : []);
  };

  const handleImport = async () => {
    if (selectedItems.length === 0) {
      toast.warn(`Selecione pelo menos um ${singularTypeName} para importar`);
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setImportResults(null);
    setImportedCount(0);
    setErrorCount(0);
    setErrors([]);

    const sorted = [...selectedItems].sort((a) => (a.habilitaCombo ? 1 : -1));
    const total = sorted.length;
    let successCount = 0;
    let failCount = 0;
    const newErrors: typeof errors = [];

    try {
      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        setImportProgress(Math.round(((i + 1) / total) * 100));

        try {
          const endpoint =
            importType === "G" ? "/groups/import" : "/products/import";
          const response = await api.post(endpoint, {
            item,
            eventId: currentEvent,
            buquetEvent: sourceEventId,
          });

          if (response.status === 200) {
            successCount++;
            setImportedCount(successCount);
            setAvailableItems((prev) =>
              prev.map((av) =>
                av.id === item.id ? { ...av, imported: true, error: null } : av,
              ),
            );
          } else {
            throw new Error("Erro na importação");
          }
        } catch (err: any) {
          failCount++;
          setErrorCount(failCount);
          const msg =
            err.response?.data?.message || err.message || "Erro desconhecido";
          newErrors.push({ itemId: item.id, itemName: item.nome, error: msg });
          setAvailableItems((prev) =>
            prev.map((av) =>
              av.id === item.id ? { ...av, imported: false, error: msg } : av,
            ),
          );
        }
      }

      setImportResults({ total, success: successCount, failed: failCount });
      setErrors(newErrors);

      if (failCount === 0) {
        toast.success(`${successCount} ${typeName} importados com sucesso!`);
      } else {
        toast.warning(
          `Importação parcial: ${successCount} sucesso, ${failCount} falhas.`,
        );
      }
    } finally {
      setImporting(false);
    }
  };

  const handleRetryErrors = async () => {
    if (errors.length === 0) return;
    setRetryingErrors(true);
    setImportProgress(0);

    const errorItems = availableItems.filter((item) => item.error);
    const total = errorItems.length;
    let successCount = 0;
    let failCount = 0;
    const newErrors: typeof errors = [];

    try {
      for (let i = 0; i < errorItems.length; i++) {
        const item = errorItems[i];
        setImportProgress(Math.round(((i + 1) / total) * 100));

        try {
          const endpoint =
            importType === "G" ? "/groups/import" : "/products/import";
          await api.post(endpoint, {
            item,
            eventId: currentEvent,
            buquetEvent: sourceEventId,
          });
          successCount++;
          setImportedCount((prev) => prev + 1);
          setErrorCount((prev) => prev - 1);
          setAvailableItems((prev) =>
            prev.map((av) =>
              av.id === item.id ? { ...av, imported: true, error: null } : av,
            ),
          );
        } catch (err: any) {
          failCount++;
          const msg =
            err.response?.data?.message || err.message || "Erro desconhecido";
          newErrors.push({ itemId: item.id, itemName: item.nome, error: msg });
        }
      }

      setErrors((prev) => [
        ...prev.filter((e) => !newErrors.some((ne) => ne.itemId === e.itemId)),
        ...newErrors,
      ]);

      if (failCount === 0) {
        toast.success(`Todos os erros foram resolvidos com sucesso!`);
        setErrors([]);
      } else {
        toast.warning(
          `Retentativa: ${successCount} sucesso, ${failCount} falhas.`,
        );
      }
    } finally {
      setRetryingErrors(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="static">
      <div className={styles.header}>
        <h5 className={styles.title}>
          Importar {typeName.charAt(0).toUpperCase() + typeName.slice(1)}
        </h5>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.body}>
        {/* Seleção do evento fonte */}
        <div className={styles.eventRow}>
          <label className={styles.label}>Evento Fonte</label>
          <div className={styles.eventSelectRow}>
            <select
              className={styles.select}
              value={sourceEventId}
              onChange={(e) => setSourceEventId(e.target.value)}
              disabled={loadingEvents}
            >
              <option value="">
                {loadingEvents ? "Carregando..." : "Selecione um evento..."}
              </option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nome} (ID: {ev.id})
                </option>
              ))}
            </select>
            <button
              className={styles.loadBtn}
              onClick={loadItemsFromEvent}
              disabled={!sourceEventId || loadingItems}
            >
              {loadingItems
                ? "Buscando..."
                : `Buscar ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}`}
            </button>
          </div>
        </div>

        {/* Lista de itens */}
        {availableItems.length > 0 && (
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <span className={styles.itemsCount}>
                {selectedItems.length} de {availableItems.length} {typeName}{" "}
                selecionados
              </span>
              <button className={styles.selectAllBtn} onClick={handleSelectAll}>
                {availableItems.every((i) => i.selected)
                  ? "Desmarcar Todos"
                  : "Selecionar Todos"}
              </button>
            </div>

            <div className={styles.itemsList}>
              {availableItems.map((item) => (
                <label key={item.id} className={styles.itemRow}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => handleItemToggle(item.id)}
                    disabled={item.imported || importing}
                  />
                  <span className={styles.itemName}>
                    {item.nome}
                    {importType === "P" && item.habilitaCombo && (
                      <span className={styles.comboBadge}>Combo</span>
                    )}
                  </span>
                  {item.imported && (
                    <span className={styles.statusSuccess}>✓ Importado</span>
                  )}
                  {item.error && !item.imported && (
                    <span className={styles.statusError}>✗ {item.error}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Progresso */}
        {(importing || retryingErrors) && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span>
                {retryingErrors ? "Retentando erros..." : "Importando..."}
              </span>
              <span>{importProgress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <div className={styles.progressStats}>
              <span className={styles.statusSuccess}>
                ✓ {importedCount} importados
              </span>
              {errorCount > 0 && (
                <span className={styles.statusError}>
                  ✗ {errorCount} com erro
                </span>
              )}
            </div>
          </div>
        )}

        {/* Resultados */}
        {importResults && !importing && !retryingErrors && (
          <div className={styles.results}>
            <div className={styles.resultStats}>
              <div className={styles.resultStat}>
                <div className={styles.statNum}>{importResults.total}</div>
                <div className={styles.statLabel}>Total</div>
              </div>
              <div className={styles.resultStat}>
                <div className={`${styles.statNum} ${styles.statusSuccess}`}>
                  {importResults.success}
                </div>
                <div className={styles.statLabel}>Sucesso</div>
              </div>
              <div className={styles.resultStat}>
                <div className={`${styles.statNum} ${styles.statusError}`}>
                  {importResults.failed}
                </div>
                <div className={styles.statLabel}>Falhas</div>
              </div>
            </div>
            {errors.length > 0 && (
              <div className={styles.errorsList}>
                {errors.slice(0, 3).map((e, i) => (
                  <div key={i} className={styles.errorItem}>
                    <span>{e.itemName}</span>
                    <span className={styles.statusError}>{e.error}</span>
                  </div>
                ))}
                {errors.length > 3 && (
                  <div className={styles.moreErrors}>
                    + {errors.length - 3} mais...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {!importResults ? (
          <>
            <button
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={importing || loadingItems}
            >
              Cancelar
            </button>
            <button
              className={styles.importBtn}
              onClick={handleImport}
              disabled={
                importing ||
                loadingItems ||
                selectedItems.length === 0 ||
                !sourceEventId
              }
            >
              {importing
                ? "Importando..."
                : `Importar ${selectedItems.length} ${typeName}`}
            </button>
          </>
        ) : (
          <>
            {errors.length > 0 && (
              <button
                className={styles.retryBtn}
                onClick={handleRetryErrors}
                disabled={retryingErrors}
              >
                {retryingErrors
                  ? "Retentando..."
                  : `Retentar ${errors.length} Erro(s)`}
              </button>
            )}
            <button className={styles.cancelBtn} onClick={resetStates}>
              Nova Importação
            </button>
            <button className={styles.importBtn} onClick={onClose}>
              Concluir
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
