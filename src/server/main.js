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
    testIterations = 4;
    testCurrentIteration = 1;
    testCurrentThread = 0;
    testThreadSequence = [1, 2, 4, 8, 10, 25, 50, 100, 200, 300];
    dirPath = "./datasets/unsup";
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    constructor() {
        fs.readdir('./', (err, files) => {
            this.rl.question(`Enter number of threads(workers) to build inverted index ${files.includes('inverted-index.txt') ? 'or press "enter" key to read pre-saved index from file' : '(5 by default)'}. Type "test" to run test sequence: `, (res) => {
                if (res === 'test') {
                    console.log(`Running test sequence. Number of iterations: ${this.testIterations}`)
                    this.numberOfThreads = this.testThreadSequence[this.testCurrentThread];
                    this.buildIndex(true);
                    return;
                }
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

    buildIndex(isTest) {
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
                if (!isTest) console.time(`Thread ${i + 1}`);
                this.createWorker(workerPath, workerOptions).then(result => {
                    this.workersFinished += 1;
                    if (!isTest) console.timeEnd(`Thread ${i + 1}`);
                    this.localIndexes.push(result)
                    if (this.workersFinished === this.numberOfThreads) {
                        this.mergeIndexes();
                        console.log(`Inverted index size: ${this.invertedIndex.size}`);
                        console.timeEnd('Total');
                        if (isTest) {
                            this.nextTest()
                            return;
                        }
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
        this.optimizeIndexLength();
        this.localIndexes.forEach(localIndex => {
            localIndex.table.forEach((localEntry) => {
                if (Array.isArray(localEntry)) {
                    localEntry.forEach(localItem => {
                        this.invertedIndex.set(localItem.key, localItem.value, true);
                    })
                }
            })
        })
    }

    optimizeIndexLength() {
        let length = 0;
        this.localIndexes.forEach(localIndex => {
            length += localIndex.size;
        })
        this.invertedIndex.table = new Array(length);
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
                const result = this.invertedIndex.get(word);
                client.send(result ? result.toString() : result);
            })
            client.on('close', () => {
                this.clientsConnected -= 1;
                console.log(`Client ${clientId} disconnected. Current number of clients: ${this.clientsConnected}`);
            })
        })
    }

    reinitializeIndex() {
        this.invertedIndex = new Hashtable();
        this.localIndexes = [];
        this.workersFinished = 0;
    }

    nextTest() {
        if (this.testCurrentIteration < this.testIterations) {
            this.testCurrentIteration += 1;
        } else {
            this.testCurrentIteration = 1;
            this.testCurrentThread += 1;
        }
        this.numberOfThreads = this.testThreadSequence[this.testCurrentThread];
        if (!this.numberOfThreads) return;
        this.reinitializeIndex();
        this.buildIndex(true);
    }
}

new Server();


