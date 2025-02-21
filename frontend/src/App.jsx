import SearchForm from "./components/SearchForm";

function App() {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col justify-center items-center bg-gradient-to-tl from-green-400 to-blue-500">
    
    <h1 className="text-4xl font-bold text-white mb-3">TextMiner</h1>

      <div className=" flex p-6 max-w-lg mx-auto
      bg-gradient-to-tl from-green-100 to-blue-200 rounded-lg shadow-lg 
      border border-gray-300 border-opacity-50 "> 

      <SearchForm />
    </div>
    </div>
   

  );
}

export default App;
