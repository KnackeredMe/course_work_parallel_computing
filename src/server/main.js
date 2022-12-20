const {Worker} = require('worker_threads');
const fs = require("fs");
const readline = require("readline");
const webSocket = require('ws');
const {Hashtable} = require("./hashtable");

class Server {
    invertedIndex = new Hashtable;
    localIndexes = [];
    numberOfThreads = 5;
    workersFinished = 0;
    clientsConnected = 0;
    dirPath = "./datasets/unsup";
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    constructor() {
        fs.readdir('./', (err, files) => {
            this.rl.question(`Enter number of threads(workers) to build inverted index ${files.includes('inverted-index.txt') ? 'or press "Enter" to read pre-saved index from file' : '(5 by default)'}: `, (res) => {
                const number = Number(res);
                if (number && Number.isInteger(number)) {
                    this.numberOfThreads = number;
                    this.buildIndex();
                    return;
                }
                if (files.includes('inverted-index.txt')) {
                    this.getIndexFromFile();
                    return;
                }
                this.buildIndex();
            })
        })
    }

    buildIndex() {
        console.log(`Number of threads(workers): ${this.numberOfThreads}`);
        fs.readdir(this.dirPath, (err, files) => {
            const fileNames = files;
            const leftover = fileNames.length % this.numberOfThreads;
            let filesPerThread = (fileNames.length - leftover) / this.numberOfThreads;
            let acc = 0;
            console.time('Total');
            for(let i = 0; i < this.numberOfThreads; i++) {
                const filesPerCurrentThread = i < leftover ? filesPerThread + 1 : filesPerThread;
                const fileNamesForThread = fileNames.slice(acc, acc + filesPerCurrentThread);
                acc += filesPerCurrentThread;
                const workerPath = './server/index-building-worker.js';
                const workerOptions = {workerData: {dirPath: this.dirPath, fileNames: fileNamesForThread}}
                console.time(`Thread ${i + 1}`);
                this.createWorker(workerPath, workerOptions).then(result => {
                    this.workersFinished += 1;
                    console.timeEnd(`Thread ${i + 1}`);
                    this.localIndexes.push(result)
                    if (this.workersFinished === this.numberOfThreads) {
                        this.mergeIndexes();
                        console.timeEnd('Total');
                        this.saveIndex();
                        this.startServer();
                    }
                })
            }
        })
    }

    getIndexFromFile() {
        fs.readFile('./inverted-index.txt', (err, data) => {
            this.invertedIndex.table = JSON.parse(data.toString());
            this.startServer();
        })
    }

    mergeIndexes() {
        this.localIndexes.forEach(localIndex => {
            localIndex.table.forEach((localItem, index) => {
                if (Array.isArray(this.invertedIndex.table[index])) {
                    this.invertedIndex.table[index].forEach(globalItem => {
                        if (globalItem.key === localItem.key) {
                            globalItem.value.push(localItem.value);
                        }
                    })
                    return;
                }
                this.invertedIndex.table[index] = localIndex.table[index];
            })
        })
    }

    saveIndex() {
        fs.writeFile("./inverted-index.txt", JSON.stringify(this.invertedIndex.table), () => {
            console.log('Index saved!');
        })
    }

    createWorker(workerPath, workerOptions) {
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

    startServer() {
        const server = new webSocket.Server({port: 9000});
        console.log('Server started');
        server.on('connection', (client) => {
            this.clientsConnected += 1;
            const clientId = this.clientsConnected;
            console.log(`New client connected. Current number of clients: ${this.clientsConnected}`);
            client.on('message', (request) => {
                const word = request.toString();
                console.log(`Client ${clientId} requested word: ${word}`);
                const result = this.invertedIndex.get(word).toString();
                client.send(result);
            })
            client.on('close', () => {
                this.clientsConnected -= 1;
                console.log(`Client ${clientId} disconnected. Current number of clients: ${this.clientsConnected}`);
            })
        })
    }
}

new Server();


