import { useState, useEffect, act } from "react";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState("home");

    const [employees, setEmployees] = useState([]);

    const getRoleName = (roleId) => {
        const foundRole = roles.find(role => role.id === roleId);
        return foundRole ? foundRole.name : "Unknown Role";
    };

    const handleLogout = () => {
        localStorage.removeItem("userRole");
        navigate("/");
    };

    useEffect(() => {
        if (activeTab === "employees") {
            fetch("http://localhost:8000/users/")
                .then(response => response.json())
                .then(data => setEmployees(data))
                .catch(error => console.error("Error fetching employees: ", error));
        }
    }, [activeTab]);
    
    // Add Employee Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        name: "",
        pin_code: "",
        role_id: 3,
        hourly_rate: ""
    });
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8000/roles/")
            .then(response => response.json())
            .then(data => {if (Array.isArray(data)) setRoles(data);})
            .catch(error => console.error("Error fetching roles: ", error));
    }, []); // The empty array [] means this only runs once when the dashboard first loads

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await fetch("http://localhost:8000/users/", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: newEmployee.name,
                    pin_code: newEmployee.pin_code,
                    role_id: parseInt(newEmployee.role_id),
                    hourly_rate: parseFloat(newEmployee.hourly_rate)
                }),
            });

            if (response.ok) {
                const addedUser = await response.json();
                setEmployees([...employees, addedUser]);
                setIsAddModalOpen(false);
                setNewEmployee({ name: "", pin_code: "", role_id: 3, hourly_rate: "" });
            }else{
                const errorData = await response.json();
                console.error("Error adding employee: ", errorData);
                alert("Failed to add employee. Please check the console for details.");
            }
        }catch(error){
            console.error("Error connecting to server: ", error);
        }
    }

    // Employee Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editEmployee, setEditEmployee] = useState(null);

    const handleOpenEdit = (emp) => {
        setEditEmployee({...emp, pin_code: "", hourly_rate: emp.hourly_rate || ""}); // Clear the PIN code for security reasons
        setIsEditModalOpen(true);
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await fetch(`http://localhost:8000/users/${editEmployee.id}/`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: editEmployee.name,
                    pin_code: editEmployee.pin_code, // If a new PIN is entered, use it; otherwise, keep the original
                    role_id: parseInt(editEmployee.role_id),
                    hourly_rate: parseFloat(editEmployee.hourly_rate)
                }),
            });
            if (response.ok) {
                const updatedUser = await response.json();

                setEmployees(employees.map(emp => emp.id === updatedUser.id ? updatedUser : emp));
                setIsEditModalOpen(false);
                setEditEmployee(null);
            }else{
                const errorData = await response.json();
                console.error("Error updating employee: ", errorData);
                alert("Failed to update employee. Please check the console for details.");  
            }
        }catch(error){
            console.error("Error connecting to server: ", error);
        }
    };

    // Delete State
    const handleDelete = async (empId, empName) => {
        const isConfimed = window.confirm(`Are you sure you want to remove ${empName}?`);
        if (!isConfimed) return;
        try{
            const response = await fetch(`http://localhost:8000/users/${empId}/`, {
                method: "DELETE"
            });

            if (response.ok) {
                setEmployees(employees.filter(emp => emp.id !== empId));
            }else{
                const errorData = await response.json();
                console.error("Error deleting employee: ", errorData);
                alert("Failed to delete employee. Please check the console for details.");
            }
        }catch(error){
            console.error("Error connecting to server: ", error);
        }
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
                            <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl shadow-sm hover:bg-purple-700 active:scale-95 transition-all duration-200">
                                + Add Employee
                            </button>
                        </div>
                        
                        {/* The Employee Table */}
                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50">
                                    <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                                        <th className="p-4 font-medium">Name</th>
                                        <th className="p-4 font-medium">Role</th>
                                        <th className="p-4 font-medium">Hourly Rate</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    
                                    {employees.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-4 text-center text-gray-500">No employees found.</td>
                                        </tr>
                                        ): (
                                            employees.map((emp) => (
                                                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-medium text-gray-800">{emp.name}</td>
                                                <td className="p-4 text-gray-500">{getRoleName(emp.role_id)}</td>
                                                <td className="p-4 text-gray-500">${parseFloat(emp.hourly_rate || 0).toFixed(2)}</td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => handleOpenEdit(emp)} 
                                                        className="text-blue-600 hover:text-blue-800 mr-4 font-medium text-sm transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(emp.id, emp.name)}
                                                        className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    
                                    
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Add Employee Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-grey-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Employee</h2>
                        
                        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newEmployee.name}
                                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN</label>
                                <input 
                                    type="text" 
                                    required
                                    maxLength="4"
                                    pattern="\d{4}"
                                    title="Must be exactly 4 digits"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newEmployee.pin_code}
                                    onChange={(e) => setNewEmployee({...newEmployee, pin_code: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newEmployee.role_id}
                                    onChange={(e) => setNewEmployee({...newEmployee, role_id: e.target.value})}
                                    required
                                >
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newEmployee.hourly_rate}
                                    onChange={(e) => setNewEmployee({...newEmployee, hourly_rate: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Save Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {isEditModalOpen && editEmployee && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Employee</h2>
                        
                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={editEmployee.name}
                                    onChange={(e) => setEditEmployee({...editEmployee, name: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN</label>
                                <input 
                                    type="text" 
                                    maxLength="4"
                                    pattern="\d{4}"
                                    title="Must be exactly 4 digits"
                                    placeholder="Leave blank to keep current PIN"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={editEmployee.pin_code}
                                    onChange={(e) => setEditEmployee({...editEmployee, pin_code: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={editEmployee.role_id}
                                    onChange={(e) => setEditEmployee({...editEmployee, role_id: e.target.value})}
                                    required
                                >
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={editEmployee.hourly_rate}
                                    onChange={(e) => setEditEmployee({...editEmployee, hourly_rate: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditEmployee(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Update Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}