import type { CompanyInfo } from '../../contexts/AppContext';
import type { ReportV3 } from '../../types/v3.types';
import { maskCnpj, maskCpf } from '../../utils/format';
import { gerarRelatorioPdfV3 } from '../../wasm/pdfium_generator';

const handleGenerateBairroReport = async (dataset: any[], companyInfo: CompanyInfo, currLogoRelatorio: string) => {
  const getImageBase64FromPath = async (imagePath: string): Promise<string> => {
    const response = await fetch(imagePath);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const json: ReportV3 = {
    pageConfiguration: {
      backgroundColor: '#ffffff',
      margin: {
        four: [40, 35, 40, 35],
      },
    },
    header: {
      repeat: false,
      height: 60,
      backgroundColor: '#ffffff',
      content: [
        {
          type: 'fluidLayout',
          sizes: ['25%', '50%', '25%'],

          content: [
            {
              type: 'image-box' as const,
              variable: 'logoSistema',
              width: 120,
              height: 40,
            },
            {
              type: 'text',
              value: 'Relatório Bairros',

              fontSize: 20,
              bold: true,
              color: '#000',
              align: 'left',
              margin: {
                four: [30, 0, 0, 50],
              },
            },
            {
              type: 'text',
              value: "'$cnpj'  '$empresa'",

              fontSize: 8,

              color: '#000',
              align: 'left',
              margin: {
                four: [25, 0, 0, 50],
              },
            },
          ],
        },
      ],
    },
    footer: {
      repeat: true,
      minHeight: 40,

      border: [1, 0, 0, 0],
      borderColor: '#c0c0c0',
      borderStyle: 'solid',
      backgroundColor: '#ffffff',
      content: [
        {
          type: 'fluidLayout',
          sizes: ['40%', '52%', '33.33%'],
          gap: 0,
          content: [
            {
              type: 'text',
              value: "Gerado em : '$currDate'",

              fontSize: 10,
              color: '#303030',
              align: 'left',
              margin: {
                all: 5,
              },
            },
            {
              type: 'text',
              value: 'www.datasetsistemas.com.br',
              fontSize: 10,
              color: '#303030',
              align: 'left',
              margin: {
                all: 5,
              },
            },
            {
              type: 'text',
              value: "Página '$page'/'$pages'",
              fontSize: 10,
              color: '#303030',
              align: 'right',
              margin: {
                four: [5, 0, 0, 0],
              },
            },
          ],
        },
      ],
    },
    content: [
      {
        headerBackgroundColor: '#404040',

        type: 'table' as const,
        datasetName: 'bairros',
        tableHeader: [
          { key: 'idBairro', prefix: 'Código' },
          { key: 'descricao', prefix: 'Nome' },
          { key: 'dataCadastro', prefix: 'Data Cadastro', mask: 'date-time' as const, align: 'center' as const },
          {
            key: 'pausar',
            prefix: 'Pausar',
            align: 'center',
            // pill: true, pillCases: [{ case: 'false', color: '#f59e0b', transform: 'Não' }, { case: 'true', color: '#000', transform: 'Sim' }]
          },
          { key: 'taxaEntrega', prefix: 'Taxa', align: 'center' as const },
        ],
        widths: [60, 'expand', 100, 80, 80],
      },
    ],
  };

  json._datasets = {
    bairros: dataset,
  };

  const imageBase64 = await getImageBase64FromPath(currLogoRelatorio);
  json._variables = {
    data_geracao: new Date().toLocaleDateString('pf-BR'),
    empresa: companyInfo.nomeCli,
    cnpj: companyInfo.cnpj.length > 11 ? maskCnpj(companyInfo.cnpj) : maskCpf(companyInfo.cnpj),

    currDate: new Date().toLocaleDateString('pt-BR'),
    logoSistema: imageBase64,
  };

  const bufferArray = await gerarRelatorioPdfV3(json as any);
  return bufferArray;
};

export default handleGenerateBairroReport;
