import { useState } from "react";

const SearchForm = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDir, setSearchDir] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!searchTerm.trim() || !searchDir.trim()) {
      setError("Both search term and directory are required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm, searchDir }),
      });

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError("Failed to fetch results. Check backend logs.");
    }

    setLoading(false);
  };

  const openFile = (filePath) => {
    fetch("http://localhost:5000/api/open-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath }),
    })
      .then(() => console.log(`Opening: ${filePath}`))
      .catch(() => setError("Failed to open file."));
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">TextMiner</h1>

      <input
        type="text"
        placeholder="Enter search term"
        className="border p-2 w-full mb-3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <input
        type="text"
        placeholder="Enter directory path"
        className="border p-2 w-full mb-3"
        value={searchDir}
        onChange={(e) => setSearchDir(e.target.value)}
      />

      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white p-2 w-full"
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
                <button
                  className="text-blue-500 underline"
                  onClick={() => openFile(file)}
                >
                  {file}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No results found.</p>
        )}
      </div>
    </div>
  );
};

export default SearchForm;
