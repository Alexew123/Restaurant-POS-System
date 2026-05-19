import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
    const userRole = sessionStorage.getItem("userRole");

    if (!userRole || parseInt(userRole) !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
}