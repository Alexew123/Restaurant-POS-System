import { useState, useEffect } from "react";
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
                    className="px-8 py-3 text-lg bg-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-300 active:scale-95 transition-all duration-200"
                >
                    Log Out
                </button>
            </header>

            {/* Main Action Area */}
            <main className="flex-grow flex items-center justify-center p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
                    
                    {/* Big Button 1: My Tables */}
                    <button 
                        className="group flex flex-col items-center justify-center p-16 min-h-[400px] bg-white rounded-[2.5rem] shadow-xl border-4 border-transparent hover:border-purple-300 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                        <div className="w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-colors bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white">
                            {/* Table Icon */}
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </div>
                        <h2 className="text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">My Tables</h2>
                        <p className="text-xl text-gray-500 font-medium">Take orders & manage the floor</p>
                    </button>

                    {/* Big Button 2: My Shift */}
                    <button 
                        className="group flex flex-col items-center justify-center p-16 min-h-[400px] bg-white rounded-[2.5rem] shadow-xl border-4 border-transparent hover:border-blue-300 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                        <div className="w-32 h-32 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center mb-8 transition-colors">
                            {/* Clock Icon */}
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h2 className="text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">My Shift</h2>
                        <p className="text-xl text-gray-500 font-medium">View your hours & earnings</p>
                    </button>

                </div>
            </main>
        </div>
    );
}