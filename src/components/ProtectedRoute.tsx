import { Navigate, Outlet } from "react-router-dom";
import { useRememberMe } from "../hooks/userRememberMe";

export function ProtectedRoute() {
  const {credentials} = useRememberMe();
  const token = localStorage.getItem("tokenDataFood");

  if (!credentials || !token) {
   console.log(credentials, token)
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
