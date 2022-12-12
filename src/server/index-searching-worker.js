const {workerData, parentPort} = require('worker_threads')
const {Hashtable} = require("./hashtable");

const word = workerData.word;
const invertedIndex = new Hashtable;
invertedIndex.table = workerData.table;
const result = invertedIndex.get(word).toString();

parentPort.postMessage(result);


