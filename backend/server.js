const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Worker } = require("worker_threads");

const app = express();
app.use(cors());
app.use(express.json());

const MAX_DEPTH = 3; // Limit search depth

// Recursive function to collect file paths
function collectFiles(dir, depth = 0) {
    if (depth > MAX_DEPTH) return [];
    let filesList = [];

    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                filesList = filesList.concat(collectFiles(filePath, depth + 1));
            } else if (stats.isFile() && stats.size < 100 * 1024 * 1024) {
                filesList.push(filePath);
            }
        }
    } catch (e) {
        console.error("Error reading directory:", e);
    }

    return filesList;
}

// Search API
app.post("/api/search", async (req, res) => {
    const { searchTerm, searchDir } = req.body;

    if (!searchTerm || !searchDir) {
        return res.status(400).json({ error: "Search term and directory required." });
    }

    const allFiles = collectFiles(searchDir);
    const worker = new Worker("./worker.js");

    worker.postMessage({ filePaths: allFiles, searchTerm });

    worker.on("message", (matchedFiles) => {
        res.json(matchedFiles);
    });

    worker.on("error", (err) => {
        console.error("Worker error:", err);
        res.status(500).json({ error: "Search failed." });
    });
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
