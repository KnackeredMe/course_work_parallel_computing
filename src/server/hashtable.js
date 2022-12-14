class Hashtable {
    length = 49999;
    table = Array(this.length);

    hashFunction(word) {
        const chars = word.split('');
        let sum = 0;
        let mul = 1;
        chars.forEach((char, index) => {
            mul = (index % 4 === 0) ? 1 : mul * 256;
            sum += char.charCodeAt(0) * mul;
        })
        return Math.abs(sum) % this.table.length;

    }

    set(key, value) {
        const hash = this.hashFunction(key);
        if (!Array.isArray(this.table[hash])) {
            this.table[hash] = [{key: key, value: [value]}];
            return;
        }
        for (let i = 0; i < this.table[hash].length; i++) {
            if (this.table[hash][i].key === key && !this.table[hash][i].value.includes(value)) {
                this.table[hash][i].value.push(value);
                return;
            }
            if (this.table[hash][i].key === key) {
                return;
            }
        }
        this.table[hash].push({key: key, value: [value]});
    }

    get(key) {
        const hash = this.hashFunction(key);
        let value = null;
        if (Array.isArray(this.table[hash])) {
            this.table[hash].forEach(item => {
                if (item.key === key) {
                    value = item.value;
                }
            })
        }
        return value;

    }


}

// const table = new Hashtable()
// table.set('romeo', '123');
// console.log(table.table);
// console.log(table.get('romeo'));

module.exports = {Hashtable};
