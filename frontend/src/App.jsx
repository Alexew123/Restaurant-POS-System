import { useState } from 'react'

function App() {
  const [pin, setPin] = useState("");

  const handleNumberClick = (number) => {
    if (pin.length < 4) {
      setPin(pin + number);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pin.length === 4) {
      console.log("Submitting PIN to backend:", pin);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-950 font-sans">
      
      {/* Login Card */}
      <div className="w-[24rem] flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl">
        
        <h1 className="text-purple-200 text-base font-medium mb-4 tracking-[0.2em]">ENTER PIN</h1>

        {/* PIN Display */}
        <div className="text-4xl tracking-[0.5em] pl-[0.5em] mb-6 font-mono bg-purple-950/50 rounded-xl shadow-inner min-h-[64px] w-full flex items-center justify-center text-purple-100 border border-purple-800/50">
          {pin.padEnd(4, '○').replace(/[0-9]/g, '●')}
        </div>

        {/*Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button 
              key={num} 
              onClick={() => handleNumberClick(num.toString())}
              className="active:scale-95 w-full h-16 text-2xl font-light text-white bg-purple-800/60 rounded-xl shadow-md hover:bg-purple-700 active:bg-purple-500 transition-all duration-75 border border-purple-700/50"
            >
              {num}
            </button>
          ))}
          
          {/* Empty space for grid alignment */}
          <div></div> 
          
          <button 
            onClick={() => handleNumberClick("0")}
            className="active:scale-95 w-full h-16 text-2xl font-light text-white bg-purple-800/60 rounded-xl shadow-md hover:bg-purple-700 active:bg-purple-500 transition-all duration-75 border border-purple-700/50"
          >
            0
          </button>
          
          <button 
            onClick={handleDelete}
            className="active:scale-95 w-full h-16 text-lg font-medium text-fuchsia-300 bg-fuchsia-900/40 rounded-xl shadow-md hover:bg-fuchsia-800/60 active:bg-fuchsia-700 transition-all duration-75 border border-fuchsia-800/50"
          >
            DEL
          </button>
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit}
          disabled={pin.length !== 4}
          className={`mt-6 w-full py-3 text-xl font-semibold rounded-xl shadow-lg transition-all duration-300 ${
            pin.length === 4 
              ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-500 active:scale-95' 
              : 'bg-purple-900/50 text-purple-400 cursor-not-allowed'
          }`}
        >
          Log In
        </button>
      </div>
    </div>
  )
}

export default App