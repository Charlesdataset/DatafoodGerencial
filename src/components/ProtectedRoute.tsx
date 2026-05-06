import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const user = localStorage.getItem("user");
  const token = localStorage.getItem("tokenTicket");

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
