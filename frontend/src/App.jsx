import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";
import ManagerDashboard from "./ManagerDashboard";

function App() {
    return (
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<Login />} />
            
            <Route path="/manager-dashboard" element={<ProtectedRoute requiredRole={1}> <ManagerDashboard /> </ProtectedRoute>} />

        </Routes>
        </BrowserRouter>
    );
}

export default App;