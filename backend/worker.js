const fs = require("fs");
const path = require("path");
const pdfParser = require("pdf-parse");
const { parentPort, workerData } = require("worker_threads");

const searchTerm = workerData.searchTerm.toLowerCase();
const filePaths = workerData.filePaths;
const matchedFiles = [];

// Function to check file content
async function checkFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    try {
        if (ext === ".pdf") {
            const buffer = fs.readFileSync(filePath);
            const pdfData = await pdfParser(buffer);
            if (pdfData.text.toLowerCase().includes(searchTerm)) matchedFiles.push(filePath);
        } else {
            const content = fs.readFileSync(filePath, "utf-8").toLowerCase();
            if (content.includes(searchTerm)) matchedFiles.push(filePath);
        }
    } catch (e) {
        console.error("Error reading file:", filePath);
    }
}

(async () => {
    for (const filePath of filePaths) {
        await checkFile(filePath);
    }
    parentPort.postMessage(matchedFiles);
})();
