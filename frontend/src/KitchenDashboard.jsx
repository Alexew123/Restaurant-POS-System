import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function KitchenDashboard() {
    const navigate = useNavigate();

    const [isClockedIn, setIsClockedIn] = useState(false);
    const [userName, setUserName] = useState(sessionStorage.getItem("userName") || "Chef"); 
    const userId = sessionStorage.getItem("userId");

    const handleLogout = () => {
        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("userId");
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

    const [activeOrders, setActiveOrders] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8000/products/")
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error("Error fetching products:", err));
    }, []);

    const getProductName = (item) => {
        if (item.name) return item.name;
        if (item.product?.name) return item.product.name;
        
        const matchedProduct = products.find(p => p.id === item.product_id || p.id === item.id);
        return matchedProduct ? matchedProduct.name : "Unknown Item";
    };

    useEffect(() => {
        if (activeView === "orders") {
            fetch("http://localhost:8000/orders/active", { cache: "no-store" })
                .then(res => res.json())
                .then(data => {
                    const kitchenOrders = data.filter(order => 
                        order.status === "In Progress" || order.status === "Ready"
                    );
                    setActiveOrders(kitchenOrders);
                })
                .catch(err => console.error("Error fetching kitchen orders:", err));
        }
    }, [activeView]);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/kitchen");

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            
            if (data.type === "NEW_ORDER") {
                setActiveOrders(prevOrders => {
                    if (data.order.status === "Completed") {
                        return prevOrders.filter(o => o.id !== data.order.id);
                    }

                    const exists = prevOrders.find(o => o.id === data.order.id);
                    if (exists) {
                        return prevOrders.map(o => o.id === data.order.id ? data.order : o);
                    } else {
                        return [...prevOrders, data.order];
                    }
                });
            }
        };

        return () => ws.close();
    }, []);

    const handleOrderDoubleClick = (order) => {
        const newStatus = order.status === "In Progress" ? "Ready" : "Completed";

        if (newStatus === "Completed") {
            setActiveOrders(prev => prev.filter(o => o.id !== order.id));
        } else {
            setActiveOrders(prev => prev.map(o => 
                o.id === order.id ? { ...o, status: newStatus } : o
            ));
        }

        fetch(`http://localhost:8000/orders/${order.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        }).catch(err => console.error("Error updating order status:", err));
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
            
            {/* Top Header (Identical to WaiterDashboard) */}
            <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center z-10 shrink-0">
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

            {/* VIEW 1: HOME */}
            {activeView === "home" && (
            <main className="flex-grow flex items-center justify-center p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
                    
                    {/* Orders Button (Replaces Tables) */}
                    <button 
                        onClick={() => setActiveView("orders")}
                        className="group flex flex-col items-center justify-center p-16 min-h-[400px] bg-white rounded-[2.5rem] shadow-xl border-4 border-transparent hover:border-orange-300 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                        <div className="w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-colors bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white">
                            {/* Receipt / Order Icon */}
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        </div>
                        <h2 className="text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">Orders</h2>
                    </button>

                    {/* My Shifts Button (Identical to Waiter) */}
                    <button 
                        onClick={() => setActiveView("shifts")}
                        className="group flex flex-col items-center justify-center p-16 min-h-[400px] bg-white rounded-[2.5rem] shadow-xl border-4 border-transparent hover:border-blue-300 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                        <div className="w-32 h-32 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center mb-8 transition-colors">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h2 className="text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">My Shift</h2>
                    </button>

                </div>
            </main>
            )}

            {/* VIEW 2: SHIFTS (Identical to WaiterDashboard) */}
            {activeView === "shifts" && (
                <main className="flex-1 p-8 overflow-auto bg-gray-50">
                    <button 
                        onClick={() => setActiveView("home")}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Back to Menu
                    </button>

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

            {/* VIEW 3: KITCHEN DISPLAY SYSTEM (Active Orders) */}
            {activeView === "orders" && (
                <main className="flex-1 p-8 overflow-auto bg-gray-50">
                    
                    {/* Header & Back Button */}
                    <div className="flex justify-between items-center mb-8 max-w-[1400px] mx-auto">
                        <button 
                            onClick={() => setActiveView("home")}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Back to Menu
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800">Active Kitchen Tickets</h2>
                    </div>

                    {/* Tickets Grid */}
                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                        {activeOrders.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                                <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5 13l4 4L19 7"></path></svg>
                                <span className="text-xl font-bold">No active orders. The kitchen is clear!</span>
                            </div>
                        ) : (
                            activeOrders.map(order => (
                                <div 
                                    key={order.id} 
                                    onDoubleClick={() => handleOrderDoubleClick(order)}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[70vh] cursor-pointer select-none transition-all hover:shadow-md active:scale-[0.98]"
                                >
                                    
                                    {/* Ticket Header (Changes color based on status!) */}
                                    <div className={`p-5 border-b flex justify-between items-center shrink-0 transition-colors ${
                                        order.status === "Ready" 
                                            ? "bg-green-100 border-green-200" 
                                            : "bg-orange-50 border-orange-100"
                                    }`}>
                                        <div className="flex flex-col">
                                            <span className="text-3xl font-black text-gray-800">Table {order.table_nr}</span>
                                            <span className={`text-sm font-bold uppercase tracking-wider ${
                                                order.status === "Ready" ? "text-green-700" : "text-orange-600"
                                            }`}>
                                                Order #{order.id} • {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Ticket Items */}
                                    <div className="p-2 overflow-y-auto flex-1 bg-white">
                                        <ul className="divide-y divide-gray-100">
                                            {order.items && order.items.map((item, idx) => (
                                                <li key={idx} className="p-3">
                                                    <div className="flex items-start gap-3">
                                                        <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-md text-sm mt-0.5">
                                                            {item.quantity}x
                                                        </span>
                                                        <div className="flex flex-col flex-1">
                                                            <span className="text-lg font-bold text-gray-800 leading-tight">
                                                                {getProductName(item)}
                                                            </span>
                                                            {item.description && (
                                                                <span className="text-red-600 font-medium text-sm mt-1.5 bg-red-50 p-2 rounded-lg border border-red-100">
                                                                    Note: {item.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                            {(!order.items || order.items.length === 0) && (
                                                <li className="text-center text-gray-400 italic py-6">No items attached.</li>
                                            )}
                                        </ul>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>
                </main>
            )}

        </div>
    );
}