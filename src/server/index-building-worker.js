const fs = require("fs");
const {workerData, parentPort} = require('worker_threads')
const {Hashtable} = require("./hashtable");

const localInvertedIndex = new Hashtable();
const dirPath = workerData.dirPath;
const fileNames = workerData.fileNames;
let fileCounter = 0;

function readDir() {
    fileNames.forEach((fileName) => {
        fs.readFile(`${dirPath}/${fileName}`, (err, data) => {
            addToIndex(data.toString(), fileName);
        })
    })
}

function addToIndex(textFromFile, fileName) {
    fileCounter += 1;
    const keywords = textFromFile.toLowerCase().replace(/[\W_]+/g, ' ').split(' ');
    keywords.forEach(word => {
        localInvertedIndex.set(word, fileName);
    })
    if (fileCounter === fileNames.length) {
        parentPort.postMessage(localInvertedIndex)}
}

readDir();
