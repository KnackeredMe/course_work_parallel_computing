const { workerData, parentPort } = require('worker_threads')

const invertedIndex = workerData.invertedIndex;
const word = workerData.word;
const result = invertedIndex[word].toString();

parentPort.postMessage(result);


