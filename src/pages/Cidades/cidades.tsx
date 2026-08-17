import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { useNavigation } from "../../contexts/NavigationContext";
import CidadeList from "./components/CidadeList";
import CidadeReg from "./components/CidadeReg";

const Cidades = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { emit } = useNavigation();

  const action = new URLSearchParams(location.search).get("action");
  const isRegistering = action === "register" || action === "update";

  // 🔥 USA A PERMISSÃO ESPECÍFICA DE CIDADE
  const dataRoute = JSON.parse(localStorage.getItem('dataRouteCidade') || '{}');
  const podeIncluir = dataRoute.incluir || false;
  const podeEntrar = dataRoute.entrar || false;

  // 🔥 PROTEGE AS ROTAS
  useEffect(() => {
    if (action === "update" && !podeEntrar) {
      toast.error("Você não tem permissão para acessar a tela de edição");
      navigate("/cidades", { replace: true });
      return;
    }

    if (action === "register" && !podeIncluir) {
      toast.error("Você não tem permissão para incluir cidades");
      navigate("/cidades", { replace: true });
      return;
    }
  }, [action, podeEntrar, podeIncluir, navigate]);

  const handleBack = () => navigate("/cidades");

  const handleRegister = () => {
    if (!podeIncluir) {
      toast.error("Você não tem permissão para incluir cidades");
      return;
    }
    navigate("/cidades?action=register");
    emit("onRegister");
  };

  const handleEdit = (row: any) => {
    if (!podeEntrar) {
      toast.error("Você não tem permissão para acessar a tela de edição");
      return;
    }
    navigate("/cidades?action=update", { state: { row } });
    emit("onRegister");
  };

  return (
    <div style={{ paddingBottom: "139px" }}>
      {!isRegistering ? (
        <CidadeList onRegister={handleRegister} onEdit={handleEdit} />
      ) : (
        <CidadeReg onBack={handleBack} />
      )}
    </div>
  );
};

export default Cidades;