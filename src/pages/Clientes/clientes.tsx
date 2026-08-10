import { useLocation, useNavigate } from "react-router-dom";
import { useNavigation } from "../../contexts/NavigationContext";
import ClienteList from "./components/ClienteList";
import ClienteReg from "./components/ClienteReg";

const Clientes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { emit } = useNavigation();

  const action = new URLSearchParams(location.search).get("action");
  const isRegistering = action === "register" || action === "update";

  const handleBack = () => navigate("/clientes");

  const handleRegister = () => {
    navigate("/clientes?action=register");
    emit("onRegister");
  };

  const handleEdit = (row: any) => {
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