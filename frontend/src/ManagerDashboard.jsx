import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState("home");

    const getRoleName = (roleId) => {
        if (roleId === 1) return "Manager";
        if (roleId === 2) return "Kitchen";
        if (roleId === 3) return "Waiter";
        return "Unknown";
    };

    const handleLogout = () => {
        localStorage.removeItem("userRole");
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            
            {/* Top Navigation Bar */}
            <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
                    
                    {/* Tab Navigation */}
                    <nav className="flex gap-2">
                        <button 
                            onClick={() => setActiveTab("home")}
                            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                                activeTab === "home" 
                                    ? "bg-purple-100 text-purple-700" 
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab("employees")}
                            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                                activeTab === "employees" 
                                    ? "bg-purple-100 text-purple-700" 
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            Employees
                        </button>
                    </nav>
                </div>

                {/* The Logout Button */}
                <button 
                    onClick={handleLogout}
                    className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 active:scale-95 transition-all duration-200"
                >
                    Log Out
                </button>
            </header>

            {/* Main Content Area */}
            <main className="p-8">
                
                {/* View 1: The Default Home Tab */}
                {activeTab === "home" && (
                    <div className="flex flex-col items-center justify-center mt-20">
                        <p className="text-xl text-gray-600 mb-8">Welcome to the control center.</p>
                    </div>
                )}

                {/* View 2: The Employees Tab */}
                {activeTab === "employees" && (
                    <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Team Members</h2>
                            <button className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl shadow-sm hover:bg-purple-700 active:scale-95 transition-all duration-200">
                                + Add Employee
                            </button>
                        </div>
                        
                        {/* The Employee Table Shell */}
                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50">
                                    <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                                        <th className="p-4 font-medium">Name</th>
                                        <th className="p-4 font-medium">Role</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    
                                    {/* Placeholder Row */}
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">Loading names...</td>
                                        <td className="p-4 text-gray-500">-</td>
                                        <td className="p-4 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 mr-4 font-medium text-sm transition-colors">Edit</button>
                                            <button className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors">Remove</button>
                                        </td>
                                    </tr>
                                    
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

        </div>
    );
}