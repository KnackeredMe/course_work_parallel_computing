const fs = require("fs");

const invertedIndex = {};
const path = "./datasets/5";
let dirSize;

fs.readdir(path, (err, files) => {
    dirSize = files.length;
})

fs.opendir(path, (err, dir) => {
    readDir(dir);
});

function readDir(dir) {
    dir.read().then(value => {
        if (!value) return;
        fs.readFile(`${path}/${value.name}`, (err, data) => {
            addToIndex(data.toString(), value.name);
        })
        readDir(dir);
    });
}

function addToIndex(textFromFile, fileName) {
    const keywords = textFromFile.toLowerCase().replace(/^[a-zA-Z\s]*$/, '').split(' ');
    keywords.forEach(word => {
        if (invertedIndex[word]) {
            if (invertedIndex[word].includes(fileName)) return;
            invertedIndex[word].push(fileName);
            return;
        }
        invertedIndex[word] = [fileName];
    })
}

setTimeout(() => {console.log(invertedIndex['apple'])}, 1000);




