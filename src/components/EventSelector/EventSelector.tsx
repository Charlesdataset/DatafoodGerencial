import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { api } from "../../services/api";
import Select from "../Inputs/Select/Select";

export const EventSelector = () => {
  const { eventsList, setEventsList, currentEvent, setCurrentEvent, setDataInicial, setDataFinal } = useApp();
  const { emit, subscribe } = useNavigation();

  const navigate = useNavigate();

  const setarDatasComOffset = (dataInicial: string, dataFinal: string) => {
    const dataInicialOffset = new Date(dataInicial);
    dataInicialOffset.setMinutes(dataInicialOffset.getMinutes() - 1);
    const dataFinalOffset = new Date(dataFinal);
    dataFinalOffset.setMinutes(dataFinalOffset.getMinutes() + 1);

    setDataInicial(formatDateTime(dataInicialOffset));
    setDataFinal(formatDateTime(dataFinalOffset));
  };

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const searchEvents = async () => {
    try {
      const response = await api.get("/events-select");
      if (response?.status === 200 && response.data.length > 0) {
        setEventsList(response.data);
        const currEvent = response.data[0];
        setCurrentEvent(currEvent.value);
        if (currEvent.data_abertura && currEvent.data_fechamento) {
          setarDatasComOffset(currEvent.data_abertura, currEvent.data_fechamento);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    }
  };

  const getDataEvents = async (eventId: number) => {
    try {
      const response = await api.get("/select-data-event", {
        params: { eventId },
      });
      if (response?.status === 200) {
        const datasEncontradas = response.data;
        if (datasEncontradas) {
          setarDatasComOffset(datasEncontradas.data_inicial, datasEncontradas.data_final);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar datas:", error);
    }
  };

  useEffect(() => {
    if (currentEvent) {
      getDataEvents(currentEvent);
    }
  }, [currentEvent]);

  useEffect(() => {
    const unsubscribeOnReloadEvent = subscribe("OnReloadEvent", () => {
      searchEvents();
    });
    searchEvents();
    return unsubscribeOnReloadEvent;
  }, []);

  const handleSelect = (eventId: number, event: any) => {
    setCurrentEvent(eventId);
    if (event.data_abertura && event.data_fechamento) {
      setarDatasComOffset(event.data_abertura, event.data_fechamento);
    }
    emit("OnEventChange", eventId);
    navigate("/");
  };

  const selectedEvent = eventsList.find((e) => e.value === currentEvent);

  if (!eventsList.length) return null;

  return (
    <>
      <Select
        options={eventsList.map((x) => {
          return { value: x.value, label: x.label };
        })}
        value={selectedEvent.value}
        onChange={(e) => {
          console.log(e);
          const currEvent = eventsList.find((x) => x.value == e);
          //console.log("Evnto encontrado foi o ==>", currEvent);
          handleSelect(Number(e), currEvent);
        }}
      />
    </>
  );
};
