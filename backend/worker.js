const fs = require("fs");
const path = require("path");
const pdfParser = require("pdf-parse");
const mammoth = require("mammoth");
const { parentPort, workerData } = require("worker_threads");

const searchTerm = workerData.searchTerm.toLowerCase();
const filePaths = workerData.filePaths;
const allowedFileTypes = workerData.allowedFileTypes.map(ext => ext.toLowerCase());
const matchedFiles = [];

console.log(`🔍 Worker started: Searching for "${searchTerm}" in ${filePaths.length} files`);

async function checkFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (!allowedFileTypes.includes(ext)) {
        console.log(`⏭️ Worker skipping: ${filePath} (Not in allowed types)`);
        return;
    }

    try {
        let content = "";
        console.log(`📖 Reading file: ${filePath}`);

        if (ext === ".pdf") {
            const buffer = fs.readFileSync(filePath);
            const pdfData = await pdfParser(buffer);
            content = pdfData.text;
        } else if (ext === ".docx") {
            const buffer = fs.readFileSync(filePath);
            const result = await mammoth.extractRawText({ buffer });
            content = result.value;
        } else {
            content = fs.readFileSync(filePath, "utf-8");
        }

        if (content.toLowerCase().includes(searchTerm)) {
            console.log(`✅ Match found in: ${filePath}`);
            matchedFiles.push(filePath);
        }
    } catch (e) {
        console.error(`❌ Error reading file: ${filePath}`, e.message);
    }
}

(async () => {
    for (const filePath of filePaths) {
        await checkFile(filePath);
    }
    console.log(`🎯 Worker finished: Found ${matchedFiles.length} matches`);
    parentPort.postMessage(matchedFiles);
})();
