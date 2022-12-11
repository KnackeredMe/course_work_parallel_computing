const webSocket = require("ws");
const readline = require("readline");
const client = new webSocket('ws://localhost:9000');
client.onopen = () => {
    console.log('Connected to server');
    searchWord();
}

function searchWord() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question("Enter the word to find a files that include it: ", function (word) {
        client.send(word);
        client.onmessage = (message) => {
            console.log(message.data);
        };
        rl.close();
    });
}
