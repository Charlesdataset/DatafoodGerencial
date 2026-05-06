// components/BottomActionBar/BottomActionBar.tsx
import { faCancel, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { FormButton } from "../../components/Inputs/Button/FormButton";
import { Flex } from "../../components/Layout";
import { useNavigation } from "../../contexts/NavigationContext";
import styles from "./BottomActionBar.module.scss";

interface BottomActionBarProps {
  onCancel?: () => void;
}

export const BottomActionBar = ({ onCancel }: BottomActionBarProps) => {
  const { emit, subscribe } = useNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // 👇 ESTADOS IGUAIS AO DO HEADER
  const [inAction, setInAction] = useState(false);
  const [inLoad, setInLoad] = useState(false);

  // Detecta se o teclado está aberto no mobile
  useEffect(() => {
    const handleResize = () => {
      const windowHeight = window.visualViewport?.height || window.innerHeight;
      const screenHeight = window.screen.height;
      const keyboardOpen = windowHeight < screenHeight * 0.75;
      setIsKeyboardOpen(keyboardOpen);
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 👇 LÓGICA DE SUBSCRIBE IGUAL AO HEADER
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const backAction = () => {
      setInAction(false);
      setInLoad(false);
      params.delete("action");
      navigate({ pathname: location.pathname, search: params.toString() });
    };

    const action = params.get("action");
    if (action === "register" || action === "update") {
      setInAction(true);
    } else {
      setInLoad(false);
    }

    const unsubscribeOnRegister = subscribe("onRegister", () => {
      setInAction(true);
    });

    const unsubscribeIsCommited = subscribe("isCommited", (v) => {
      setInLoad(false);
      if (v) {
        backAction();
      } else {
        setInAction(true);
      }
    });

    const unsubscribeRefresh = subscribe("refresh", () => {
      backAction();
    });
    if(inAction && !location.search.includes("action")) {
      setInAction(false);
    }

    return () => {
      unsubscribeOnRegister();
      unsubscribeIsCommited();
      unsubscribeRefresh();
    };
  }, [location.search, navigate, subscribe, inAction]);

  


  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    emit("onRollback");
    setInAction(false);
    setInLoad(false);
    const params = new URLSearchParams(location.search);
    params.delete("action");
    navigate({ pathname: location.pathname, search: params.toString() });
  };

  const handleSave = () => {
    emit("onRequestCommit");
  };

  // 👇 SÓ RENDERIZA SE ESTIVER EM AÇÃO
  if (!inAction) {
    return null;
  }

  return (
    <div
      className={`${styles.bottomBar} ${isKeyboardOpen ? styles.keyboardOpen : ""}`}
    >
      <Flex>
        <FormButton variant="secondary" onClick={handleCancel} fullWidth>
          <FontAwesomeIcon icon={faCancel} />
          Cancelar
        </FormButton>
        <FormButton
          variant="primary"
          onClick={handleSave}
          isLoading={inLoad}
          fullWidth
        >
          <FontAwesomeIcon icon={faSave} />
          Salvar
        </FormButton>
      </Flex>
    </div>
  );
};
