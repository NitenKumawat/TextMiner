const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Worker } = require("worker_threads");
const { exec } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

const MAX_DEPTH = 3; // Limit recursive depth
const BATCH_SIZE = 10; // Process files in batches

function collectFiles(dir, allowedExtensions, depth = 0) {
    if (depth > MAX_DEPTH) return [];
    let filesList = [];

    try {
        console.log(`📂 Scanning directory: ${dir}`);

        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                console.log(`📁 Entering subdirectory: ${filePath}`);
                filesList = filesList.concat(collectFiles(filePath, allowedExtensions, depth + 1));
            } else if (stats.isFile() && stats.size < 50 * 1024 * 1024) {
                const fileExt = path.extname(filePath).toLowerCase();
                const normalizedExtensions = allowedExtensions.map(ext => ext.toLowerCase());

                if (normalizedExtensions.includes(fileExt)) {
                    console.log(`✅ Adding file: ${filePath}`);
                    filesList.push(filePath);
                } else {
                    console.log(`❌ Skipping file: ${filePath} (Not in allowed types)`);
                }
            }
        }
    } catch (e) {
        console.error("❌ Error reading directory:", e.message);
    }

    return filesList;
}

function splitIntoBatches(files, batchSize) {
    console.log(`🔹 Splitting ${files.length} files into batches of ${batchSize}`);
    const batches = [];
    for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
    }
    return batches;
}

app.post("/api/search", async (req, res) => {
    const { searchTerm, searchDir, allowedFileTypes } = req.body;
    console.log(`🔎 Search request received -> Term: "${searchTerm}", Directory: "${searchDir}", File Types: ${allowedFileTypes}`);

    if (!searchTerm || !searchDir || !Array.isArray(allowedFileTypes) || allowedFileTypes.length === 0) {
        console.error("❌ Invalid input. Please provide search term, directory, and file types.");
        return res.status(400).json({ error: "Invalid input. Please provide search term, directory, and file types." });
    }

    const allFiles = collectFiles(searchDir, allowedFileTypes);
    console.log(`📑 Total files found: ${allFiles.length}`);

    const batches = splitIntoBatches(allFiles, BATCH_SIZE);
    const workers = [];
    let matchedFiles = [];

    for (const batch of batches) {
        console.log(`🛠 Starting worker thread for batch of ${batch.length} files`);

        const worker = new Worker("./worker.js", {
            workerData: { searchTerm, filePaths: batch, allowedFileTypes },
        });

        workers.push(
            new Promise((resolve) => {
                worker.on("message", (result) => {
                    console.log(`✅ Worker found ${result.length} matching files`);
                    matchedFiles = matchedFiles.concat(result);
                    resolve();
                });

                worker.on("error", (error) => {
                    console.error("❌ Worker encountered an error:", error);
                    resolve();
                });
            })
        );
    }

    await Promise.all(workers);
    console.log(`📋 Final matched files: ${matchedFiles.length}`);
    res.json(matchedFiles);
});

// ✅ API to open files safely
app.post("/api/open-file", (req, res) => {
    const { filePath } = req.body;

    if (!filePath || !fs.existsSync(filePath)) {
        console.error("❌ Invalid file path:", filePath);
        return res.status(400).json({ error: "Invalid file path." });
    }

    const absolutePath = path.resolve(filePath);
    console.log(`📂 Opening file: ${absolutePath}`);

    const command = process.platform === "win32" ? "start" : "xdg-open";
    exec(`${command} "${absolutePath}"`);

    res.json({ message: "File opened successfully." });
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
