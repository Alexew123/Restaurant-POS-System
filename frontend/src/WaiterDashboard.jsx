import { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";

export default function WaiterDashboard() {
    const navigate = useNavigate();

    const [isClockedIn, setIsClockedIn] = useState(false);
    const [userName, setUserName] = useState(localStorage.getItem("userName") || "Waiter"); 
    const userId = localStorage.getItem("userId");

    const handleLogout = () => {
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        navigate("/");
    };

    useEffect(() => {
        if (!userId) return;

        fetch(`http://localhost:8000/users/${userId}/shift/active`)
            .then(response => {
                if (response.ok){
                    setIsClockedIn(true);
                }else{
                    setIsClockedIn(false);
                }
            })
            .catch(error => {
                console.error("Error checking shift status: ", error);
                setIsClockedIn(false);
            });
    }, [userId]);

    const handleClockIn = async () => {
        try {
            const response = await fetch(`http://localhost:8000/users/${userId}/shift/clock-in`, {
                method: "POST",
            });
            if (response.ok) {
                setIsClockedIn(true);
            }else{
                const errorData = await response.json();
                console.error("Clock in failed: ", errorData.detail);
                alert("Unable to clock in: " + (errorData.detail || ""));
            }
        } catch (error) {
            console.error("Error connecting to server: ", error);
        }
    }

    const handleClockOut = async () => {
        try {
            const response = await fetch(`http://localhost:8000/users/${userId}/shift/clock-out`, {
                method: "PUT",
            });
            if (response.ok) {
                setIsClockedIn(false);
            }else{
                const errorData = await response.json();
                console.error("Clock out failed: ", errorData.detail);
                alert("Unable to clock out: " + (errorData.detail || ""));
            }
        } catch (error) {
            console.error("Error connecting to server: ", error);
        }
    }

    const [activeView, setActiveView] = useState("home");
    const [activeTable, setActiveTable] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [shifts, setShifts] = useState([]);

    const formatDisplayDate = (dateString) => {
        if (!dateString) return "Active Now";
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
    }

    useEffect(() => {
        if (activeView === "shifts" && userId) {
            fetch(`http://localhost:8000/users/${userId}/shifts/`)
                .then(response => response.json())
                .then(data => setShifts(data))
                .catch(error => console.error("Error fetching shifts: ", error));
        }
    }, [activeView, userId]);


    const [tables, setTables] = useState([]);

    const baseFloorplan = [
        { id: 1, seats: 4 },
        { id: 2, seats: 2 },
        { id: 3, seats: 4 },
        { id: 4, seats: 6 },
        { id: 5, seats: 2 },
        { id: 6, seats: 8 },
        { id: 7, seats: 4 },
        { id: 8, seats: 4 }
    ];

    useEffect(() => {
        if (activeView === "tables") {
            fetch("http://localhost:8000/orders/active", { cache: "no-store" })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(activeOrders => {
                    const mergedTables = baseFloorplan.map(table => {
                        const currentOrder = activeOrders.find(order => order.table_nr === table.id);

                        if (!currentOrder){
                            return { ...table, status: "available" };
                        }

                        if (currentOrder.waiter_id === parseInt(userId)){
                            return { ...table, status: "mine", orderId: currentOrder.id };
                        }

                        return { ...table, status: "occupied", owner: currentOrder.waiter_name, orderId: currentOrder.id };
                });
                    setTables(mergedTables);
                })
                .catch(error => {
                    console.error("Error fetching active orders: ", error);
                    setTables(baseFloorplan.map(table => ({ ...table, status: "available" })));
                });

        }
    }, [activeView, userId]);

    const [ticketItems, setTicketItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [activeCategory, setActiveCategory] = useState("");

    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [tempItem, setTempItem] = useState(null);


    useEffect(() => {
        Promise.all([
            fetch("http://localhost:8000/products/").then(res => res.json()),
            fetch("http://localhost:8000/item-types/").then(res => res.json())
        ])
        .then(([productsData, itemTypesData]) => {
            setProducts(productsData);
            setItemTypes(itemTypesData);

            if (itemTypesData.length > 0) {
                const uniqueCategories = [...new Set(itemTypesData.map(type => type.category))];
                if (uniqueCategories.length > 0) {
                    setActiveCategory(uniqueCategories[0]);
                }
            }
        })
        .catch(error => console.error("Error fetching menu: ", error));
    }, []);

    const categories = [...new Set(itemTypes.map(type => type.category))];
    const currentTypes = itemTypes
        .filter(type => type.category === activeCategory)
        .sort((a, b) => a.id - b.id);

    const handleTableClick = (table) => {
        if (isProcessing) return;
        if (table.status === "occupied") return;

        if (table.status === "mine") {
            setActiveTable(table.id);
            setActiveView("menu");
        }

        if (table.status === "available") {
            setIsProcessing(true);
            const newOrderPayload = {
                waiter_id: userId,
                table_nr: table.id,
                items: []
            };
            fetch("http://localhost:8000/orders/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newOrderPayload)
            })
            .then(response => response.json())
            .then(data => {
                setActiveTable(table.id);
                setActiveView("menu");
            })
            .catch(error => console.error("Error creating order:", error))
            .finally(() => setIsProcessing(false));
        }
    }

    const handleAddItem = (product) => {
        setTicketItems(prev => [...prev, { ...product, quantity: 1 }]);
    };

    const handleEditTicketItem = (index) => {
        setEditingIndex(index);
        setTempItem({ ...ticketItems[index] });
        setIsItemModalOpen(true);
    };

    const handleSaveItemEdit = (forceRemove = false) => {
        setTicketItems(prev => {
            const updatedTicket = [...prev];
            
            if (forceRemove || tempItem.quantity <= 0) {
                updatedTicket.splice(editingIndex, 1);
            } else {
                updatedTicket[editingIndex] = tempItem;
            }
            return updatedTicket;
        });
        setIsItemModalOpen(false);
        setTempItem(null);
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
            
            {/* Top Header */}
            <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center z-10">
                <div className="flex items-center gap-6">
                    <h1 className="text-3xl font-bold text-gray-800">Hello, {userName}</h1>
                    
                    {/* Status Badge & Action Button */}
                    <div className="flex items-center gap-3">
                        {isClockedIn ? (
                            <>
                                <span className="px-4 py-2 bg-green-100 text-green-700 text-lg font-bold rounded-full flex items-center gap-2 border border-green-200">
                                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                                    Clocked In
                                </span>
                                <button 
                                    onClick={handleClockOut}
                                    className="px-4 py-2 bg-white text-red-600 text-sm font-bold rounded-full border border-red-200 hover:bg-red-50 active:scale-95 transition-all duration-200 shadow-sm"
                                >
                                    Clock Out
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="px-4 py-2 bg-gray-100 text-gray-500 text-lg font-bold rounded-full flex items-center gap-2 border border-gray-200">
                                    <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                                    Off the Clock
                                </span>
                                <button 
                                    onClick={handleClockIn}
                                    className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full border border-green-600 hover:bg-green-600 active:scale-95 transition-all duration-200 shadow-sm"
                                >
                                    Clock In
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <button 
                        onClick={handleLogout}
                        className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 active:scale-95 transition-all duration-200"
                    >
                        Log Out
                    </button>
            </header>

            {/* Main Action Area */}
            {activeView === "home" && (
            <main className="flex-grow flex items-center justify-center p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
                    
                    {/* My Tables */}
                    <button 
                        onClick={() => setActiveView("tables")}
                        className="group flex flex-col items-center justify-center p-16 min-h-[400px] bg-white rounded-[2.5rem] shadow-xl border-4 border-transparent hover:border-purple-300 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                        <div className="w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-colors bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white">
                            {/* Table Icon */}
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </div>
                        <h2 className="text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">Tables</h2>
                    </button>

                    {/* My Shifts */}
                    <button 
                        onClick={() => setActiveView("shifts")}
                        className="group flex flex-col items-center justify-center p-16 min-h-[400px] bg-white rounded-[2.5rem] shadow-xl border-4 border-transparent hover:border-blue-300 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                        <div className="w-32 h-32 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center mb-8 transition-colors">
                            {/* Clock Icon */}
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h2 className="text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">My Shift</h2>
                    </button>

                </div>
            </main>
            )}

            {/*Shifts View */}
            {activeView === "shifts" && (
                <main className="flex-1 p-8 overflow-auto bg-gray-50">
                    
                    {/* Back Button */}
                    <button 
                        onClick={() => setActiveView("home")}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Back to Menu
                    </button>

                    {/* The Table Box */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-5xl mx-auto">
                        <div className="px-6 py-4 border-b border-gray-100 bg-white">
                            <h2 className="text-xl font-bold text-gray-800">My Shift History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Clock In</th>
                                        <th className="p-4 font-semibold">Clock Out</th>
                                        <th className="p-4 font-semibold">Hourly Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {shifts.map((shift) => (
                                        <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-800 font-medium">
                                                {formatDisplayDate(shift.clock_in_time)}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {shift.clock_out_time 
                                                    ? formatDisplayDate(shift.clock_out_time) 
                                                    : <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active Now</span>
                                                }
                                            </td>
                                            <td className="p-4 text-gray-600">${shift.hourly_rate}/hr</td>
                                        </tr>
                                    ))}
                                    {shifts.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-gray-500">
                                                No shifts found. Clock in to start your first shift!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            )}

            
            {activeView === "tables" && (
                <main className="flex-1 p-8 overflow-auto bg-gray-50 flex flex-col items-center">
                    
                    <div className="w-full max-w-5xl">
                        {/* Header & Back Button */}
                        <div className="flex justify-between items-center mb-8">
                            <button 
                                onClick={() => setActiveView("home")}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                Back to Menu
                            </button>
                            <h2 className="text-2xl font-bold text-gray-800">Main Floor</h2>
                        </div>

                        {/* Legend */}
                        <div className="flex gap-6 mb-8 p-4 bg-white rounded-xl shadow-sm border border-gray-100 justify-center">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-green-100 border border-green-300"></span>
                                <span className="text-sm font-medium text-gray-600">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-blue-100 border border-blue-400"></span>
                                <span className="text-sm font-medium text-gray-600">My Tables</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-orange-100 border border-orange-300"></span>
                                <span className="text-sm font-medium text-gray-600">Colleagues</span>
                            </div>
                        </div>

                        {/* The Table Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {tables.map((table) => (
                                <button
                                    key={table.id}
                                    onClick={() => handleTableClick(table)}
                                    className={`relative flex flex-col items-center justify-center p-8 h-40 rounded-2xl shadow-sm border-2 transition-all duration-200 cursor-pointer ${
                                        table.status === "available" 
                                            ? "bg-white border-green-200 hover:border-green-400 hover:shadow-md" 
                                            : table.status === "mine"
                                            ? "bg-blue-50 border-blue-400 shadow-md hover:bg-blue-100"
                                            : "bg-orange-50 border-orange-300 shadow-sm hover:bg-orange-100 hover:shadow-md"
                                    }`}
                                >
                                    <span className={`text-3xl font-black mb-1 ${
                                        table.status === "mine" ? "text-blue-700" 
                                        : table.status === "occupied" ? "text-orange-700" 
                                        : "text-gray-700"
                                    }`}>
                                        {table.id}
                                    </span>
                                    
                                    {/* Waiter Name for Occupied Tables */}
                                    {table.status === "occupied" && (
                                        <span className="text-xs font-bold text-orange-600 mb-1">
                                            {table.owner}
                                        </span>
                                    )}

                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {table.seats} Seats
                                    </span>

                                    {/* Action Label */}
                                    <span className={`absolute bottom-3 text-xs font-bold ${
                                        table.status === "available" ? "text-green-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" 
                                        : table.status === "mine" ? "text-blue-600"
                                        : "text-orange-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                                    }`}>
                                        {table.status === "available" ? "Open Table" 
                                        : table.status === "mine" ? "View Order" 
                                        : "Help Out"}
                                    </span>
                                </button>
                            ))}
                        </div>
                        
                    </div>
                </main>
            )}
            {/* Order Menu */}
            {activeView === "menu" && (
                <main className="flex-1 overflow-hidden flex bg-gray-50">
                                
                    {/* Left Side: Categories & Products */}
                    <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden">
                        
                        {/* Menu Header (Keep this the same) */}
                        <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-4 shrink-0">
                            <button 
                                onClick={() => {
                                    setActiveView("tables");
                                    setTicketItems([]); 
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <h2 className="text-xl font-bold text-gray-800">Menu</h2>
                        </div>

                        {/* Top Level: Categories Horizontal Scroll (e.g., Food, Drinks) */}
                        <div className="flex p-4 gap-2 overflow-x-auto bg-white shadow-sm z-10 shrink-0 border-b border-gray-100">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${
                                        activeCategory === cat 
                                            ? "bg-blue-600 text-white shadow-md" 
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Second Level: Dynamic Columns for Item Types (e.g., Appetizers, Salads) */}
                        <div className="flex-1 p-6 overflow-x-auto bg-gray-50 flex gap-6 items-start">
                            {currentTypes.map(type => {
                                // Find all products belonging strictly to this column's type
                                const typeProducts = products.filter(p => p.type_id === type.id);
                                
                                return (
                                    <div key={type.id} className="flex flex-col w-64 shrink-0">
                                        
                                        {/* Column Header */}
                                        <div className="mb-4 pb-2 border-b-2 border-gray-200">
                                            <h3 className="text-lg font-bold text-gray-700 uppercase tracking-wide">
                                                {type.type}
                                            </h3>
                                        </div>
                                        
                                        {/* Products List inside the Column */}
                                        <div className="flex flex-col gap-3">
                                            {typeProducts.length === 0 ? (
                                                <p className="text-sm text-gray-400 italic">No items added yet</p>
                                            ) : (
                                                typeProducts.map(product => (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => handleAddItem(product)}
                                                        className="flex flex-col items-start p-4 bg-white rounded-xl shadow-sm border-2 border-transparent hover:border-blue-300 hover:shadow-md active:scale-95 transition-all text-left"
                                                    >
                                                        <span className="font-bold text-gray-800 mb-1">{product.name}</span>
                                                        <span className="text-blue-600 font-bold">${parseFloat(product.price).toFixed(2)}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                        
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Side: The Ticket */}
                    <div className="w-96 bg-white flex flex-col shadow-xl z-20">
                        <div className="p-6 bg-gray-900 text-white">
                            <h2 className="text-2xl font-black mb-1">Table {activeTable}</h2>
                            <p className="text-gray-400 font-medium">New Order</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4">
                            {ticketItems.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400 font-medium">
                                    Ticket is empty
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                {ticketItems.map((item, idx) => (
                                    <li key={idx}>
                                        <button 
                                            onClick={() => handleEditTicketItem(idx)}
                                            className="w-full py-4 px-2 flex justify-between items-start text-left hover:bg-blue-50 active:bg-blue-100 transition-colors rounded-lg group"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-sm group-hover:bg-blue-200">
                                                        {item.quantity}x
                                                    </span>
                                                    <span className="font-bold text-gray-800">{item.name}</span>
                                                </div>
                                                {/* Display notes if they exist */}
                                                {item.description && (
                                                    <span className="text-sm text-gray-500 italic mt-1 ml-9">
                                                        "{item.description}"
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-600">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-lg font-bold text-gray-600">Total</span>
                                <span className="text-3xl font-black text-gray-900">
                                    ${ticketItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                                </span>
                            </div>
                            <button className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all active:scale-95">
                                Send to Kitchen
                            </button>
                        </div>
                    </div>
                </main>
            )}

            {/* Edit Ticket Item Modal */}
            {isItemModalOpen && tempItem && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60] transition-all duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
                        
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{tempItem.name}</h2>
                            <span className="text-xl font-bold text-blue-600">${tempItem.price.toFixed(2)}</span>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Quantity</label>
                            <div className="flex items-center justify-center gap-6">
                                <button 
                                    onClick={() => setTempItem({...tempItem, quantity: Math.max(0, tempItem.quantity - 1)})}
                                    className="w-14 h-14 rounded-full bg-gray-100 text-gray-600 text-2xl font-bold hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center"
                                >
                                    −
                                </button>
                                <span className="text-4xl font-black text-gray-900 w-12 text-center">
                                    {tempItem.quantity}
                                </span>
                                <button 
                                    onClick={() => setTempItem({...tempItem, quantity: tempItem.quantity + 1})}
                                    className="w-14 h-14 rounded-full bg-gray-100 text-gray-600 text-2xl font-bold hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Kitchen Notes */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kitchen Notes</label>
                            <textarea 
                                rows="3"
                                placeholder="e.g., No onions, extra crispy..."
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
                                value={tempItem.description || ""}
                                onChange={(e) => setTempItem({...tempItem, description: e.target.value})}
                            ></textarea>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center gap-4">
                            <button 
                                onClick={() => handleSaveItemEdit(true)}
                                className="px-6 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
                            >
                                Remove Item
                            </button>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => {
                                        setIsItemModalOpen(false);
                                        setTempItem(null);
                                    }}
                                    className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveItemEdit}
                                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all"
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}