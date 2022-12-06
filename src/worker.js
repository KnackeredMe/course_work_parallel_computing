const fs = require("fs");
const { workerData, parentPort, isMainThread } = require('worker_threads')

const invertedIndex = workerData.invertedIndex;
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
        if (invertedIndex[word]) {
            if (invertedIndex[word].includes(fileName)) return;
            invertedIndex[word].push(fileName);
            return;
        }
        invertedIndex[word] = [fileName];
    })
    if (index === fileNames.length - 1) {parentPort.postMessage(invertedIndex['relationship'])}
}

readDir();
