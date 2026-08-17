import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { useNavigation } from "../../contexts/NavigationContext";
import PlanoList from "./components/PlanoList";
import PlanoReg from "./components/PlanoReg";

const Planos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { emit } = useNavigation();

  const action = new URLSearchParams(location.search).get("action");
  const isRegistering = action === "register" || action === "update";

  // 🔥 USA A PERMISSÃO ESPECÍFICA DE PLANO
  const dataRoute = JSON.parse(localStorage.getItem('dataRoutePlano') || '{}');
  const podeIncluir = dataRoute.incluir || false;
  const podeEntrar = dataRoute.entrar || false;

  useEffect(() => {
    if (action === "update" && !podeEntrar) {
      toast.error("Você não tem permissão para acessar a tela de edição");
      navigate("/planos", { replace: true });
      return;
    }

    if (action === "register" && !podeIncluir) {
      toast.error("Você não tem permissão para incluir planos");
      navigate("/planos", { replace: true });
      return;
    }
  }, [action, podeEntrar, podeIncluir, navigate]);

  const handleBack = () => navigate("/planos");

  const handleRegister = () => {
    if (!podeIncluir) {
      toast.error("Você não tem permissão para incluir planos");
      return;
    }
    navigate("/planos?action=register");
    emit("onRegister");
  };

  const handleEdit = (row: any) => {
    if (!podeEntrar) {
      toast.error("Você não tem permissão para acessar a tela de edição");
      return;
    }
    navigate("/planos?action=update", { state: { row } });
    emit("onRegister");
  };

  return (
    <div style={{ paddingBottom: "139px" }}>
      {!isRegistering ? (
        <PlanoList onRegister={handleRegister} onEdit={handleEdit} />
      ) : (
        <PlanoReg onBack={handleBack} />
      )}
    </div>
  );
};

export default Planos;