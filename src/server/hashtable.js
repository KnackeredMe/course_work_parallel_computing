class Hashtable {
    initialLength = 49999;
    table = new Array(this.initialLength);
    size = 0;
    loadFactor = 0.75;


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

    set(key, value, isMerge) {
        if (this.size/this.table.length > this.loadFactor) this.resize();
        const hash = this.hashFunction(key);
        if (!Array.isArray(this.table[hash])) {
            this.size += 1;
            this.table[hash] = [{key: key, value: isMerge ? value : [value]}];
            return;
        }
        for (let i = 0; i < this.table[hash].length; i++) {
            if (this.table[hash][i].key === key) {
                if (isMerge) {
                    this.table[hash][i].value.push(...value);
                } else {
                    if (!this.table[hash][i].value.includes(value)) {
                        this.table[hash][i].value.push(value);
                    }
                }
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

    resize() {
        const prevTable = JSON.parse(JSON.stringify(this.table));
        this.table = new Array(prevTable.length * 2);
        prevTable.forEach(entry => {
            if (Array.isArray(entry)) {
                entry.forEach(item => {
                    this.set(item.key, item.value);
                })
            }
        })
    }


}

// const table = new Hashtable()
// table.set('romeo', '123');
// console.log(table.table);
// console.log(table.get('romeo'));

module.exports = {Hashtable};
