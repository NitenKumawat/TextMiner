import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
// const API_URL = "http://localhost:5000";


console.log("url "+ API_URL); // Should log your Render backend URL

const FILE_TYPES = [
  ".txt", ".md", ".json", ".csv", ".log", ".xml", ".yaml", ".yml",
  ".pdf", ".docx", ".doc", ".odt", ".rtf",
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".cs", ".html", ".css"
];

const SearchForm = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDir, setSearchDir] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFileTypes, setSelectedFileTypes] = useState([]);

  const handleFileTypeChange = (fileType) => {
    setSelectedFileTypes((prev) =>
      prev.includes(fileType) ? prev.filter((t) => t !== fileType) : [...prev, fileType]
    );
  };

  const selectAllFileTypes = () => {
    setSelectedFileTypes(FILE_TYPES);
  };

  const clearFileTypes = () => {
    setSelectedFileTypes([]);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim() || !searchDir.trim() || selectedFileTypes.length === 0) {
      console.error("❌ Missing required fields for search");
      setError("Please provide search term, directory, and select at least one file type.");
      return;
    }
  
    console.log(`🔎 Searching for "${searchTerm}" in "${searchDir}" with file types: ${selectedFileTypes}`);
    setError("");
    setLoading(true);
    setResults([]);
  
    try {
      const response = await fetch( `${API_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm, searchDir, allowedFileTypes: selectedFileTypes }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch results.");
      }
  
      const data = await response.json();
      console.log(`📋 Search results: ${data.length} files found`);
      setResults(data.length ? data : []);
    } catch (err) {
      console.error("❌ API request failed:", err.message);
      setError("Failed to fetch results. Check backend logs.");
    }
  
    setLoading(false);
  };
  


  const openFile = (filePath) => {
    fetch(`${API_URL}/api/open-file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath }),
    })
      .then(() => console.log(`Opening: ${filePath}`))
      .catch(() => setError("Failed to open file."));
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Search Files</h1>

      <input
        type="text"
        placeholder="Enter search term"
        className="border px-3 py-2 w-full mb-3 rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <input
        type="text"
        placeholder="Enter directory path"
        className="border px-3 py-2 w-full mb-3 rounded"
        value={searchDir}
        onChange={(e) => setSearchDir(e.target.value)}
      />

      <div className="mb-3">
        <p className="font-semibold">Select File Types:</p>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
          {FILE_TYPES.map((type) => (
            <label key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedFileTypes.includes(type)}
                onChange={() => handleFileTypeChange(type)}
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
        <div className="mt-2 flex justify-between">
          <button
            className="bg-blue-500 text-white text-sm px-3 py-1 rounded"
            onClick={selectAllFileTypes}
          >
            Select All
          </button>
          <button
            className="bg-red-500 text-white text-sm px-3 py-1 rounded"
            onClick={clearFileTypes}
          >
            Clear All
          </button>
        </div>
      </div>

      <button
        onClick={handleSearch}
        className="bg-green-500 text-white font-semibold p-2 w-full rounded"
        disabled={loading}
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <div className="mt-4">
        {results.length > 0 ? (
          <ul>
            {results.map((file, index) => (
              <li key={index} className="border-b p-2">
                <button className="text-blue-500 underline" onClick={() => openFile(file)}>
                  {file}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No results found.</p>
        )}
      </div>
    </div>
  );
};

export default SearchForm;
