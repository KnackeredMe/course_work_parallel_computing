const webSocket = require("ws");
const readline = require("readline");

class Client {
    client = new webSocket('ws://localhost:9000');
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    constructor() {
        this.client.onopen = () => {
            console.log('Connected to server')
            this.showMenu();
        }
    }

    showMenu() {
        this.rl.question('List of commands: \nsearch -- find files that include particular word\nexit -- disconnect from the server\n', (word) => {
            switch (word) {
                case 'search':
                    this.searchWord();
                    break;
                case 'exit':
                    this.client.close()
                    console.log('Disconnected from the server');
                    break;
                default:
                    console.log('Invalid command.');
                    this.showMenu();
            }
        })
    }

    searchWord() {
        this.rl.question("Enter a word to find a files that include it: ", (word) => {
            this.client.send(word);
            this.client.onmessage = (message) => {
                if (message.data.toString()) {
                    console.log(`Result: ${message.data}`);
                } else {
                    console.log('No results');
                }
                this.showMenu();
            };
        });
    }
}

new Client();
