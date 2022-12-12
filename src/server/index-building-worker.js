const fs = require("fs");
const {workerData, parentPort} = require('worker_threads')
const {Hashtable} = require("./hashtable");

const localInvertedIndex = new Hashtable();
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
        localInvertedIndex.set(word, fileName);
    })
    if (index === fileNames.length - 1) {parentPort.postMessage(localInvertedIndex)}
}

readDir();
