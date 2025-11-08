import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (role && role !== user.role) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
