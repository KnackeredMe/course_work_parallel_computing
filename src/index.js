const {Worker, isMainThread, parentPort, workerData,} = require('worker_threads');
const fs = require("fs");

const invertedIndex = {};
const numberOfThreads = 2;

const dirPath = "./datasets/4";
let fileNames;

fs.readdir(dirPath, (err, files) => {
    fileNames = files;
    for(let i = 0; i < numberOfThreads; i++) {
        const leftover = fileNames.length % numberOfThreads;
        let filesPerThread = (fileNames.length - leftover) / numberOfThreads;
        if (i < leftover) { filesPerThread += 1 }
        const fileNamesForThread = fileNames.slice(i * filesPerThread, (i + 1) * filesPerThread);
        console.time(`Thread ${i + 1}`);
        createWorker(fileNamesForThread).then(result => {console.log(result); console.timeEnd(`Thread ${i + 1}`)})
    }
})

function createWorker(fileNamesForThread) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', {
            workerData: {invertedIndex: invertedIndex, dirPath: dirPath, fileNames: fileNamesForThread},
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}



