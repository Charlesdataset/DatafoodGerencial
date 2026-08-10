import { useLocation, useNavigate } from "react-router-dom";
import { useNavigation } from "../../contexts/NavigationContext";
import CidadeList from "./components/CidadeList";
import CidadeReg from "./components/CidadeReg";

const Cidades = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { emit } = useNavigation();

  const action = new URLSearchParams(location.search).get("action");
  const isRegistering = action === "register" || action === "update";

  const handleBack = () => navigate("/cidades");

  const handleRegister = () => {
    navigate("/cidades?action=register");
    emit("onRegister");
  };

  const handleEdit = (row: any) => {
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