import {
  faBox,
  faCancel,
  faChartPie,
  faChartSimple,
  faFilter,
  faMagnifyingGlass,
  faMap,
  faMobileRetro,
  faNoteSticky,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { FormButton } from "../../components/Inputs/Button/FormButton";
import MultiTextBox from "../../components/Inputs/MultiTextBox/MultiTextBox";
import { Flex } from "../../components/Layout";
import Fluid from "../../components/Layout/Fluid";
import { Modal } from "../../components/Modal";
import SelectModal from "../../components/Modal/SelectModal/SelectModal";
import { useApp } from "../../contexts/AppContext";
import { api } from "../../services/api";
import styles from "./MobileHeader.module.scss";

export const pageIcons: Record<string, any> = {
  "/": faChartPie,
  "/dashboard": faChartSimple,
  "/reports": faChartPie,
  "/reports?listing=nota-entrada": faNoteSticky,
  "/reports?listing=nfce": faNoteSticky,
  "/reports?listing=cliente": faUsers,
  "/reports?listing=bairro": faMap,
  "/reports?listing=produto": faBox,
  "/reports?listing=auditoria": faMagnifyingGlass,
  "/reports?listing=saida-por-produto": faBox,

};

export const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/reports": 'Relatórios',
  "/reports?listing=nota-entrada": 'Nota de entrada',
  "/reports?listing=nfce": 'NFC-e',
  "/reports?listing=cliente": 'Clientes',
  "/reports?listing=bairro": 'Bairros',
  "/reports?listing=produto": 'Produtos',
  "/reports?listing=auditoria": 'Auditoria',
  "/reports?listing=saida-por-produto": 'Saida por produto',
};
const MobileHeader = () => {
  const location = useLocation();
  const { dataInicial, setDataInicial, setDataFinal, dataFinal, turnosSelecionados, setTurnosSelecionados, canShowTurnoTipo } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [oldDataIni, setOldDataIni] = useState(null);
  const [oldDataFim, setOldDataFim] = useState(null);
  const [oldTurnos, setOldTurnos] = useState([])
  const [searchTurnoOpen, setSearchTurnoOpen] = useState(false)
  const currentIcon = pageIcons[`${location.pathname}${location.search}`] || "📌";
  const currentTitle = pageTitles[`${location.pathname}${location.search}`] || "TicketFlow";


  useEffect(() => {

    setOldDataFim(dataInicial);
    setOldDataFim(dataFinal);
    setOldTurnos(turnosSelecionados)
  }, [isModalOpen])

  return (
    <>
      <SelectModal
        isOpen={searchTurnoOpen}
        onClose={() => {
          setSearchTurnoOpen(false);
        }}
        icon={<FontAwesomeIcon icon={faMobileRetro} />}
        key={'id'}
        keyShow={{
          primary: [
            {
              key: "id",
              prefix: "Cód.  ",
              mask: "number",
              padChar: "0",
              padStart: 6,
            },

          ],
          secondary: [{ key: "label", prefix: "Descrição : ", marginStart: 5 },]
        }}
        mode="multi"
        selectedData={oldTurnos}
        title="Selecione as turnos"
        fetchItems={() =>
          api.get(`/turnos/tipo-turnos`).then((r) => r.data.tipoTurnos.map(x => ({ id: x.value, label: x.name })) || [])
        }
        onMultiSelect={(e) => {
          setOldTurnos((prev) => [...prev, ...e.map((x) => x.raw)]);
        }}
      />

      <Modal isOpen={isModalOpen} onClose={() => { }} >
        <Modal.Header onClose={() => {
          setIsModalOpen(false)
        }}>
          <Flex>
            <FontAwesomeIcon icon={faFilter} />
            Filtros

          </Flex>
        </Modal.Header>
        <Modal.Body>
          <Fluid
            xs={[100, 100]}
            gap={0}
            rowGap={0}
            columnGap={0}
          >
            <DatePicker value={oldDataIni} label="Período Inicial" onChange={(e) => {
              setOldDataIni(e)

            }} />
            <DatePicker value={oldDataFim} label="Período Final" onChange={(e) => {
              setOldDataFim(e)
            }} />
            {canShowTurnoTipo && (


              <MultiTextBox
                label="Selecione o turno"
                colorMode="multicolor"

                onChange={(labels) => {
                  setOldTurnos((prev) =>
                    prev.filter((t) => labels.includes(`${t.label}`))
                  )
                }}
                values={oldTurnos.map((t) => `${t.label}`)} boxHeight={200} className="mb-0" placeholder="Tipos de turnos"
                onInputClick={() => {
                  setSearchTurnoOpen(true);
                }} />
            )}


          </Fluid>
        </Modal.Body>
        <Modal.Footer>
          <Fluid
            xs={[50, 50]}
          >

            <FormButton variant="outline-secondary" className="justify-content-center" onClick={() => { setIsModalOpen(false) }}>
              <FontAwesomeIcon icon={faCancel} />
              Fechar
            </FormButton>

            <FormButton variant="secondary" className="justify-content-center" onClick={() => {
              setDataInicial(oldDataIni);
              setDataFinal(oldDataFim)
              setTurnosSelecionados(oldTurnos)
              setIsModalOpen(false)
            }}>
              <FontAwesomeIcon icon={faFilter} />
              Filtrar
            </FormButton>
          </Fluid>
        </Modal.Footer>
      </Modal>

      <div className={styles.mobileHeader}>
        <Flex justify="between" align="center" >

          <div className={styles.pageTitle}>
            <span className={styles.pageIcon}>
              <FontAwesomeIcon icon={currentIcon} />
            </span>
            <h2>{currentTitle}</h2>
          </div>
          <FormButton variant="secondary" onClick={() => { setIsModalOpen(true) }}>
            <FontAwesomeIcon icon={faFilter} />
            Filtros
          </FormButton>
        </Flex>


      </div>
    </>
  );
};

export default MobileHeader;
