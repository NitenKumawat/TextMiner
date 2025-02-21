const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pdfParser = require("pdf-parse");
const { exec } = require("child_process"); // For opening files

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ✅ Open File API
app.post("/api/open-file", (req, res) => {
    const { filePath } = req.body;
    if (!filePath) {
        return res.status(400).json({ error: "File path is required." });
    }

    console.log(`Opening file: ${filePath}`);

    // Open file using default application
    exec(`"${filePath}"`, (err) => {
        if (err) {
            console.error("Error opening file:", err);
            return res.status(500).json({ error: "Failed to open file." });
        }
        res.status(200).json({ message: "File opened successfully." });
    });
});

// ✅ Search Files API
app.post("/api/search", async (req, res) => {
    const { searchTerm, searchDir } = req.body;

    if (!searchTerm || !searchDir) {
        return res.status(400).json({ error: "Both search term and directory are required." });
    }

    try {
        const results = await searchFiles(searchDir, searchTerm.toLowerCase());
        res.json(results);
    } catch (error) {
        console.error("Error searching files:", error);
        res.status(500).json({ error: "Failed to search files." });
    }
});

// ✅ Function to Search Files in a Directory
async function searchFiles(directory, searchTerm) {
    let matchedFiles = [];
    let workerPromises = [];

    try {
        const files = fs.readdirSync(directory);
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                matchedFiles = matchedFiles.concat(await searchFiles(filePath, searchTerm));
            } else if (stats.isFile() && stats.size < 100 * 1024 * 1024) {
                workerPromises.push(searchWorker(filePath, searchTerm));
            }
        }
    } catch (e) {
        console.error("Error reading directory:", e);
    }

    const results = await Promise.all(workerPromises);
    matchedFiles = matchedFiles.concat(results.filter(Boolean));
    return matchedFiles;
}

// ✅ Function to Search Inside Files
function searchWorker(filePath, searchTerm) {
    return new Promise((resolve) => {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === ".pdf") {
            let chunks = [];
            const stream = fs.createReadStream(filePath);
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.on("end", async () => {
                try {
                    const buffer = Buffer.concat(chunks);
                    const pdfData = await pdfParser(buffer);
                    if (pdfData.text.toLowerCase().includes(searchTerm)) {
                        resolve(filePath);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    console.error("Error parsing PDF:", e);
                    resolve(null);
                }
            });
            stream.on("error", () => resolve(null));
        } else {
            let found = false;
            const stream = fs.createReadStream(filePath, { encoding: "utf-8" });

            stream.on("data", (chunk) => {
                if (chunk.toLowerCase().includes(searchTerm)) {
                    found = true;
                    stream.destroy();
                }
            });

            stream.on("close", () => resolve(found ? filePath : null));
            stream.on("error", () => resolve(null));
        }
    });
}

// ✅ Start Server
app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
});
