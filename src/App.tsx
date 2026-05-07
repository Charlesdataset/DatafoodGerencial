import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppProvider } from "./contexts/AppContext";
import { MessageBoxProvider } from "./contexts/MessageBoxContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { AdminLayout } from "./layouts/Admin/AdminLayout";
import Dashboard from "./pages/Dashboard/dashboard";
import Login from "./pages/Login/Login";
import Relatorios from "./pages/Relatorios/Relatorios";


function App() {
  return (
    <AppProvider>
      <MessageBoxProvider>
        <NavigationProvider>
          <Routes>
            {/* Rota de login - sem wrapper, pois o Login já tem seu próprio layout */}
            <Route path="/Login" element={<Login />} />

            {/* Rotas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/reports" element={<Relatorios />} />
              
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
