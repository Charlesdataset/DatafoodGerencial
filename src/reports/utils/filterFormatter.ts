/**
 * Formatter para exibir filtros aplicados de forma elegante no header dos relatórios
 * Padrão de indústria: compacto, legível e profissional
 */

export interface FilterConfig {
  label: string;
  values: string[];
  showAll?: boolean; // Se true, mostra todos; se false, mostra até 2 + "mais X"
}

/**
 * Formata um conjunto de filtros para exibição no header
 * @param filters Array de configurações de filtro
 * @param maxCharsPerFilter Máximo de caracteres por linha de filtro
 * @returns String formatada para exibição
 */
export function formatFiltersForHeader(
  filters: FilterConfig[],
  maxCharsPerFilter: number = 120,
): string {
  const formattedFilters = filters
    .filter((f) => f.values && f.values.length > 0) // Remove filtros vazios
    .map((filter) => {
      const values = filter.values.slice(0, 3); // Máximo 3 valores vistos
      let text = `${filter.label}: ${values.join(", ")}`;

      // Se tem mais de 3 valores e showAll é false, adiciona "e mais X"
      if (filter.values.length > 3 && !filter.showAll) {
        text += ` e mais ${filter.values.length - 3}`;
      }

      // Se ultrapassa o limite de caracteres, trunca elegantemente
      if (text.length > maxCharsPerFilter) {
        text = text.substring(0, maxCharsPerFilter - 3) + "...";
      }

      return text;
    });

  return formattedFilters.length > 0
    ? formattedFilters.join("  •  ")
    : "Sem filtros aplicados";
}

/**
 * Formata filtros para exibição em múltiplas linhas (mais detalhado)
 */
export function formatFiltersMultiline(filters: FilterConfig[]): string {
  return filters
    .filter((f) => f.values && f.values.length > 0)
    .map((filter) => {
      return `${filter.label}: ${filter.values.join(", ")}`;
    })
    .join("\n");
}

/**
 * Formata período de data para exibição legível
 */
export function formatPeriod(
  periodoInicial: string,
  periodoFinal: string,
): string {
  if (!periodoInicial && !periodoFinal) return "";

  const formatDate = (date: string) => {
    // Esperado: YYYY-MM-DD
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const inicio = periodoInicial ? formatDate(periodoInicial) : "?";
  const fim = periodoFinal ? formatDate(periodoFinal) : "?";

  return `${inicio} a ${fim}`;
}

/**
 * Cria um objeto de variáveis de filtro para usar no template do relatório
 */
export function createFilterVariables(
  filters: Record<string, any>,
  companyInfo: any,
) {
  const buildFilterConfigs = (): FilterConfig[] => {
    const configs: FilterConfig[] = [];

    if (filters.periodoInicial || filters.periodoFinal) {
      configs.push({
        label: "Período",
        values: [formatPeriod(filters.periodoInicial, filters.periodoFinal)],
        showAll: true,
      });
    }

    if (filters.funcionarios && filters.funcionarios.length > 0) {
      configs.push({
        label: "Funcionários",
        values: filters.funcionarios,
      });
    }

    if (filters.grupos && filters.grupos.length > 0) {
      configs.push({
        label: "Grupos",
        values: filters.grupos,
      });
    }

    if (filters.maquinas && filters.maquinas.length > 0) {
      configs.push({
        label: "Máquinas",
        values: filters.maquinas,
      });
    }

    if (filters.produtos && filters.produtos.length > 0) {
      configs.push({
        label: "Produtos",
        values: filters.produtos,
      });
    }

    if (filters.agrupadoPor) {
      configs.push({
        label: "Agrupado Por",
        values: [filters.agrupadoPor],
        showAll: true,
      });
    }

    return configs;
  };

  const filterConfigs = buildFilterConfigs();
  const filtrosHeader = formatFiltersForHeader(filterConfigs, 140);
  const filtrosDetalhados = formatFiltersMultiline(filterConfigs);

  return {
    filtros_header: filtrosHeader,
    filtros_detalhados: filtrosDetalhados,
    tem_filtros: filterConfigs.length > 0 ? "Sim" : "Não",
  };
}
