import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";
import ManagerDashboard from "./ManagerDashboard";
import WaiterDashboard from "./WaiterDashboard";

function App() {
    return (
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<Login />} />
            
            <Route path="/manager-dashboard" element={<ProtectedRoute requiredRole={1}> <ManagerDashboard /> </ProtectedRoute>} />
            <Route path="/waiter-dashboard" element={<ProtectedRoute requiredRole={2}> <WaiterDashboard /> </ProtectedRoute>} />

        </Routes>
        </BrowserRouter>
    );
}

export default App;