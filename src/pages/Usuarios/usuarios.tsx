import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { useNavigation } from "../../contexts/NavigationContext";
import UsuarioList from "./components/UsuarioList";
import UsuarioReg from "./components/UsuarioReg.tsx";

const Usuarios = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { emit } = useNavigation();

  const action = new URLSearchParams(location.search).get("action");
  const isRegistering = action === "register" || action === "update";

  // 🔥 USA A PERMISSÃO ESPECÍFICA DE USUÁRIO
  const dataRoute = JSON.parse(localStorage.getItem('dataRouteUsuario') || '{}');
  const podeIncluir = dataRoute.incluir || false;
  const podeEntrar = dataRoute.entrar || false;

  useEffect(() => {
    if (action === "update" && !podeEntrar) {
      toast.error("Você não tem permissão para acessar a tela de edição");
      navigate("/usuarios", { replace: true });
      return;
    }

    if (action === "register" && !podeIncluir) {
      toast.error("Você não tem permissão para incluir usuários");
      navigate("/usuarios", { replace: true });
      return;
    }
  }, [action, podeEntrar, podeIncluir, navigate]);

  const handleBack = () => navigate("/usuarios");

  const handleRegister = () => {
    if (!podeIncluir) {
      toast.error("Você não tem permissão para incluir usuários");
      return;
    }
    navigate("/usuarios?action=register");
    emit("onRegister");
  };

  const handleEdit = (row: any) => {
    if (!podeEntrar) {
      toast.error("Você não tem permissão para acessar a tela de edição");
      return;
    }
    navigate("/usuarios?action=update", { state: { row } });
    emit("onRegister");
  };

  return (
    <div style={{ paddingBottom: "139px" }}>
      {!isRegistering ? (
        <UsuarioList onRegister={handleRegister} onEdit={handleEdit} />
      ) : (
        <UsuarioReg onBack={handleBack} />
      )}
    </div>
  );
};

export default Usuarios;