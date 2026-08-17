import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppProvider } from "./contexts/AppContext";
import { MessageBoxProvider } from "./contexts/MessageBoxContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { AdminLayout } from "./layouts/Admin/AdminLayout";
import Dashboard from "./pages/Dashboard/dashboard";
import Login from "./pages/Login/Login";
import Clientes from "./pages/Clientes/clientes";
//import Cidades from "./pages/Cidades/cidades";
import Usuarios from "./pages/Usuarios/usuarios";
import Planos from "./pages/Planos/planos";

function App() {
  return (
    <AppProvider>
      <MessageBoxProvider>
        <NavigationProvider>
          <Routes>
            <Route path="/Login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clientes" element={<Clientes />} />
                {/* <Route path="/cidades" element={<Cidades />} /> */}
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/planos" element={<Planos />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NavigationProvider>
      </MessageBoxProvider>
    </AppProvider>
  );
}

export default App;