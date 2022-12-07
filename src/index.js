const {Worker, isMainThread, parentPort, workerData,} = require('worker_threads');
const fs = require("fs");

const invertedIndex = {};
const numberOfThreads = 4;
let workersFinished = 0;

const dirPath = "./datasets/unsup";
let fileNames;

fs.readdir(dirPath, (err, files) => {
    fileNames = files;
    console.time('Total');
    for(let i = 0; i < numberOfThreads; i++) {
        const leftover = fileNames.length % numberOfThreads;
        let filesPerThread = (fileNames.length - leftover) / numberOfThreads;
        if (i < leftover) { filesPerThread += 1 }
        const fileNamesForThread = fileNames.slice(i * filesPerThread, (i + 1) * filesPerThread);
        console.time(`Thread ${i + 1}`);
        createWorker(fileNamesForThread).then(result => {
            workersFinished += 1;
            mergeIndex(result);
            console.timeEnd(`Thread ${i + 1}`);
            if (workersFinished === numberOfThreads) {
                console.timeEnd('Total');
            }
        })
    }
})

function mergeIndex(localIndex) {
    for(const entry of Object.entries(localIndex)) {
        if (invertedIndex[entry.key]) {
            invertedIndex[entry.key].push(localIndex[entry.key]);
            return;
        }
        invertedIndex[entry.key] = localIndex[entry.key];
    }
}

function createWorker(fileNamesForThread) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', {
            workerData: {dirPath: dirPath, fileNames: fileNamesForThread},
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}



