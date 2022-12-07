const fs = require("fs");
const { workerData, parentPort, isMainThread } = require('worker_threads')

const localInvertedIndex = {};
const dirPath = workerData.dirPath;
const fileNames = workerData.fileNames;

function readDir() {
    fileNames.forEach((fileName, index) => {
        fs.readFile(`${dirPath}/${fileName}`, (err, data) => {
            addToIndex(data.toString(), fileName, index);
        })
    })
}

function addToIndex(textFromFile, fileName, index) {
    const keywords = textFromFile.toLowerCase().replace(/^[a-zA-Z\s]*$/, '').split(' ');
    keywords.forEach(word => {
        if (Array.isArray(localInvertedIndex[word])) {
            localInvertedIndex[word].push(fileName);
            return;
        }
        localInvertedIndex[word] = [fileName];
    })
    if (index === fileNames.length - 1) {parentPort.postMessage(localInvertedIndex)}
}

readDir();
