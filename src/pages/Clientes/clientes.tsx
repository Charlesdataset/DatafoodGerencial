import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { useNavigation } from "../../contexts/NavigationContext";
import ClienteList from "./components/ClienteList";
import ClienteReg from "./components/ClienteReg";

const Clientes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { emit } = useNavigation();

  const action = new URLSearchParams(location.search).get("action");
  const isRegistering = action === "register" || action === "update";

  const dataRoute = JSON.parse(localStorage.getItem('dataRoute') || '{}');
  const podeIncluir = dataRoute.incluir || false;
  const podeEditar = dataRoute.editar || false;
  const podeEntrar = dataRoute.entrar || false;

  // 🔥 PROTEGE A TELA DE EDIÇÃO COM A PERMISSÃO "entrar"
  useEffect(() => {
    if (action === "update" && !podeEntrar) {
      toast.error("Você não tem permissão para acessar a tela de edição");
      navigate("/clientes", { replace: true });
      return;
    }

    if (action === "register" && !podeIncluir) {
      toast.error("Você não tem permissão para incluir clientes");
      navigate("/clientes", { replace: true });
      return;
    }
  }, [action, podeEntrar, podeIncluir, navigate]);

  const handleBack = () => navigate("/clientes");

  const handleRegister = () => {
    if (!podeIncluir) {
      toast.error("Você não tem permissão para incluir clientes");
      return;
    }
    navigate("/clientes?action=register");
    emit("onRegister");
  };

  const handleEdit = (row: any) => {
    // 🔥 USA "entrar" PARA PERMITIR ACESSAR A TELA DE EDIÇÃO
    if (!podeEntrar) {
      toast.error("Você não tem permissão para acessar a tela de edição");
      return;
    }
    navigate("/clientes?action=update", { state: { row } });
    emit("onRegister");
  };

  return (
    <div style={{ paddingBottom: "139px" }}>
      {!isRegistering ? (
        <ClienteList onRegister={handleRegister} onEdit={handleEdit} />
      ) : (
        <ClienteReg onBack={handleBack} />
      )}
    </div>
  );
};

export default Clientes;