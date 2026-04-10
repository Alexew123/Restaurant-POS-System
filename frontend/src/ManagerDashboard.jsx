import { useState, useEffect } from "react";
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

    const [products, setProducts] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);

    const getItemTypeName = (typeId) => {
        const foundType = itemTypes.find(type => type.id === typeId);
        
        if (foundType) {
            return { name: foundType.type, category: foundType.category, isMissing: false };
        } else {
            return { name: "Deleted", category: "-", isMissing: true };
        }
    }

    useEffect(() => {
        if (activeTab === "employees") {
            fetch("http://localhost:8000/users/")
                .then(response => response.json())
                .then(data => setEmployees(data))
                .catch(error => console.error("Error fetching employees: ", error));
        }

        if (activeTab === "products") {
            Promise.all([
            fetch("http://localhost:8000/products/").then(res => res.json()),
            fetch("http://localhost:8000/item-types/").then(res => res.json())
            ])
            .then(([productsData, itemTypesData]) => {
                setProducts(productsData);
                setItemTypes(itemTypesData);
            })
            .catch(error => console.error("Error fetching products or item types: ", error));
        }
    }, [activeTab]);
    
    // Employee Add Modal State
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

    // Employee Delete State
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

    // Product Add Modal State
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: "",
        price: "",
        type_id: ""
    });

    const handleAddProductSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await fetch("http://localhost:8000/products/", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: newProduct.name,
                    price: parseFloat(newProduct.price),
                    type_id: parseInt(newProduct.type_id)
                }),
            });

            if (response.ok) {
                const addedProduct = await response.json();
                setProducts([...products, addedProduct]);
                setIsAddProductModalOpen(false);
                setNewProduct({ name: "", price: "", type_id: "" });
            }else{
                const errorData = await response.json();
                console.error("Error adding product: ", errorData);
                alert("Failed to add product. " + (errorData.detail || ""));
            }
        }catch(error){
            console.error("Error connecting to server: ", error);
        }
    }

    // Product Edit Modal State
    const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);

    const handleOpenEditProduct = (product) => {
        setEditProduct({...product});
        setIsEditProductModalOpen(true);
    };

    const handleEditProductSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:8000/products/${editProduct.id}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editProduct.name,
                    price: parseFloat(editProduct.price),
                    type_id: parseInt(editProduct.type_id)
                }),
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
                setIsEditProductModalOpen(false);
                setEditProduct(null);
            } else {
                const errorData = await response.json();
                console.error("Error editing product: ", errorData);
                alert("Failed to edit product. " + (errorData.detail || ""));
            }

        }
        catch (error) {
            console.error("Error connecting to server: ", error);
        }
    };

    // Product Delete State
    const handleDeleteProduct = async (productId, productName) => {
        const isConfirmed = window.confirm(`Are you sure you want to remove ${productName}?`);
        if (!isConfirmed) return;

        try {
            const response = await fetch(`http://localhost:8000/products/${productId}/`, {
                method: "DELETE"
            });

            if (response.ok) {
                setProducts(products.filter(p => p.id !== productId));
            } else {
                const errorData = await response.json();
                console.error("Error deleting product: ", errorData);
                alert("Failed to delete product. Please check the console for details.");
            }
        }catch (error) {
            console.error("Error connecting to server: ", error);
        }
    }

    // Manage Type Modal State
    const [isManageTypesModalOpen, setIsManageTypesModalOpen] = useState(false);

    const handleDeleteType = async (typeId, typeName) => {
        const isConfirmed = window.confirm(`Are you sure you want to remove the "${typeName}" type? `);
        if (!isConfirmed) return;

        try{
            const response = await fetch(`http://localhost:8000/item-types/${typeId}/`, {
                method: "DELETE"
            });

            if (response.ok) {
                setItemTypes(itemTypes.map(t => 
                    t.id === typeId ? { ...t, deleted_at: new Date().toISOString() } : t
                ));
            } else {
                const errorData = await response.json();
                console.error("Error deleting type: ", errorData);
                alert("Failed to delete type. Please check the console for details.");
            }
        }catch(error){
            console.error("Error connecting to server: ", error);
        }

    }

    const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
    const [newType, setNewType] = useState({
        type: "",
        category: ""
    });

    const handleAddTypeSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await fetch("http://localhost:8000/item-types/", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    type: newType.type,
                    category: newType.category  
                }),
            });
            
            if (response.ok) {
                const addedType = await response.json();
                setItemTypes([...itemTypes, addedType]);
                setIsAddTypeModalOpen(false);
                setNewType({ type: "", category: "" });
            }else{
                const errorData = await response.json();
                console.error("Error adding item type: ", errorData);
                alert("Failed to add item type. " + (errorData.detail || ""));
            }
        }catch(error){
            console.error("Error connecting to server: ", error);
        }
    };

    const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false);
    const [editType, setEditType] = useState(null);

    const handleOpenEditType = (type) => {
        setEditType({...type});
        setIsEditTypeModalOpen(true);
    };

    const handleEditTypeSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await fetch(`http://localhost:8000/item-types/${editType.id}/`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    type: editType.type,
                    category: editType.category
                }),
            });

            if (response.ok) {
                const updatedType = await response.json();
                setItemTypes(itemTypes.map(t => t.id === updatedType.id ? updatedType : t));
                setIsEditTypeModalOpen(false);
                setEditType(null);
            }else{
                const errorData = await response.json();
                console.error("Error updating item type: ", errorData);
                alert("Failed to update item type. " + (errorData.detail || ""));
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
                        <button
                            onClick={() => setActiveTab("products")}
                            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                                activeTab === "products" 
                                    ? "bg-purple-100 text-purple-700" 
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            Products
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

                {/* View 3: The Products Tab */}
                {activeTab === "products" && (
                    <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Products</h2>
                            <div className="flex gap-3">
                                <button 
                                    onClick={()=> setIsManageTypesModalOpen(true)}
                                    className="px-5 py-2.5 bg-gray-600 text-white font-semibold rounded-xl shadow-sm hover:bg-gray-700 active:scale-95 transition-all duration-200"
                                    >
                                    Manage Types
                                </button>
                                <button 
                                    onClick={() => setIsAddProductModalOpen(true)}
                                    className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl shadow-sm hover:bg-purple-700 active:scale-95 transition-all duration-200"
                                    >
                                    + Add Product
                                </button>
                            </div>
                        </div>
                        
                        {/* The Products Table */}
                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50">
                                    <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                                        <th className="p-4 font-medium">Name</th>
                                        <th className="p-4 font-medium">Price</th>
                                        <th className="p-4 font-medium">Type</th>
                                        <th className="p-4 font-medium">Category</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-4 text-center text-gray-500">No products found.</td>
                                        </tr>
                                    ) : (
                                        products.map((product) => {
                                            const typeDetails = getItemTypeName(product.type_id);
                                            return (
                                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 font-medium text-gray-800">{product.name}</td>
                                                    <td className="p-4 text-gray-500">${parseFloat(product.price || 0).toFixed(2)}</td>
                                                    <td className="p-4 font-medium">
                                                        {typeDetails.isMissing ? (
                                                            <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200 text-xs">
                                                                ⚠️ Assign New Type
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500">{typeDetails.name}</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-gray-500">{typeDetails.category}</td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => handleOpenEditProduct(product)}
                                                            className="text-blue-600 hover:text-blue-800 mr-4 font-medium text-sm transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id, product.name)}
                                                            className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
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
                                    onClick={() => {
                                        setIsAddModalOpen(false),
                                        setNewEmployee({ name: "", pin_code: "", role_id: 3, hourly_rate: "" });
                                    }}
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

            {/* Add Product Modal */}
            {isAddProductModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Product</h2>
                        
                        <form onSubmit={handleAddProductSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newProduct.price}
                                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newProduct.type_id}
                                    onChange={(e) => setNewProduct({...newProduct, type_id: e.target.value})}
                                    required
                                >
                                    <option value="" disabled>Select a type...</option>
                                        {itemTypes.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.type} ({type.category})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsAddProductModalOpen(false);
                                        setNewProduct({ name: "", price: "", type_id: "" });
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Save Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {isEditProductModalOpen && editProduct && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Product</h2>
                        
                        <form onSubmit={handleEditProductSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={editProduct.name}
                                    onChange={(e) => setEditProduct({...editProduct, name: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={editProduct.price}
                                    onChange={(e) => setEditProduct({...editProduct, price: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={editProduct.type_id}
                                    onChange={(e) => setEditProduct({...editProduct, type_id: e.target.value})}
                                    required
                                >
                                    {itemTypes.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.type} ({type.category})
                                            </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsEditProductModalOpen(false);
                                        setEditProduct(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Update Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Types List Modal */}
            {isManageTypesModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 max-h-[80vh] flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Manage Item Types</h2>
                            <button 
                                onClick={() => setIsManageTypesModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-medium transition-colors"
                            >
                                ✕ Close
                            </button>
                        </div>
                        
                        {/* Add Button Row */}
                        <div className="flex justify-end mb-4">
                            <button 
                                onClick={() => setIsAddTypeModalOpen(true)}
                                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">
                                + Add Type
                            </button>
                        </div>

                        {/* Types Table */}
                        <div className="overflow-y-auto rounded-xl border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                                        <th className="p-4 font-medium">Type Name</th>
                                        <th className="p-4 font-medium">Category</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {itemTypes.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="p-4 text-center text-gray-500">No item types found.</td>
                                        </tr>
                                    ) : (
                                        itemTypes.map((type) => (
                                            <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-medium text-gray-800">{type.type}</td>
                                                <td className="p-4 text-gray-500">{type.category}</td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => handleOpenEditType(type)}
                                                        className="text-blue-600 hover:text-blue-800 mr-4 font-medium text-sm transition-colors">
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteType(type.id, type.type)}
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
                </div>
            )}


            {/* Add Type Modal */}
            {isAddTypeModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[60] transition-all duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Item Type</h2>
                        
                        <form onSubmit={handleAddTypeSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type Name</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g., Appetizers"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newType.type}
                                    onChange={(e) => setNewType({...newType, type: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g., Food"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newType.category}
                                    onChange={(e) => setNewType({...newType, category: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsAddTypeModalOpen(false);
                                        setNewType({ type: "", category: "" });
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Save Type
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Type Modal */}
            {isEditTypeModalOpen && editType && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[60] transition-all duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Item Type</h2>
                        
                        <form onSubmit={handleEditTypeSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={editType.type}
                                    onChange={(e) => setEditType({...editType, type: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={editType.category}
                                    onChange={(e) => setEditType({...editType, category: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsEditTypeModalOpen(false);
                                        setEditType(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Update Type
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            
        </div>
    );
}