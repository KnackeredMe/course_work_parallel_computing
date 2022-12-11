const {Worker} = require('worker_threads');
const fs = require("fs");
const webSocket = require('ws');

let invertedIndex = {};
const localIndexes = [];
const numberOfThreads = 5;
let workersFinished = 0;
const dirPath = "./datasets/5";
let fileNames;

fs.readdir('./', (err, files) => {
    if (files.includes('inverted-index.txt')) {
        getIndexFromFile();
    } else {
        buildIndex();
    }
})

function buildIndex() {
    fs.readdir(dirPath, (err, files) => {
        fileNames = files;
        const leftover = fileNames.length % numberOfThreads;
        let filesPerThread = (fileNames.length - leftover) / numberOfThreads;
        console.time('Total');
        for(let i = 0; i < numberOfThreads; i++) {
            if (i < leftover) { filesPerThread += 1 }
            const fileNamesForThread = fileNames.slice(i * filesPerThread, (i + 1) * filesPerThread);
            const workerPath = './server/index-building-worker.js';
            const workerOptions = {workerData: {dirPath: dirPath, fileNames: fileNamesForThread}}
            console.time(`Thread ${i + 1}`);
            createWorker(workerPath, workerOptions).then(result => {
                workersFinished += 1;
                console.timeEnd(`Thread ${i + 1}`);
                localIndexes.push(result)
                if (workersFinished === numberOfThreads) {
                    mergeIndexes();
                    console.timeEnd('Total');
                    saveIndex();
                    startServer();
                }
            })
        }
    })
}

function getIndexFromFile() {
    fs.readFile('./inverted-index.txt', (err, data) => {
        invertedIndex = JSON.parse(data.toString());
        startServer();
    })
}

function mergeIndexes() {
    localIndexes.forEach(localIndex => {
        for(const [key] of Object.entries(localIndex)) {
            if (invertedIndex[key]) {
                invertedIndex[key].push(localIndex[key]);
                return;
            }
            invertedIndex[key] = localIndex[key];
        }
    })
}

function saveIndex() {
    fs.writeFile("./inverted-index.txt", JSON.stringify(invertedIndex), () => {
        console.log('Index saved!');
    })
}

function createWorker(workerPath, workerOptions) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(workerPath, workerOptions);
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}

function startServer() {
    const server = new webSocket.Server({port: 9000});
    console.log('Server started');
    server.on('connection', (client) => {
        console.log('Client connected');
        client.on('message', (word) => {
            console.log(`Client requested word: ${word.toString()}`);
            const workerPath = './server/index-searching-worker.js';
            const workerOptions = {workerData: {invertedIndex: invertedIndex, word: word.toString()}}
            createWorker(workerPath, workerOptions).then(result => {
                console.log(`Result: ${result}`);
                client.send(result);
            })
        })
        client.on('close', () => {
            console.log('Client disconnected');
        })
    })
}


