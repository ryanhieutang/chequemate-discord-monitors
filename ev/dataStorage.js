const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '/evData.json');

async function saveData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error saving data:', err);
    }
}

async function readData() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const rawData = fs.readFileSync(dataFilePath);
            return JSON.parse(rawData);
        } else {
            return [];
        }
    } catch (err) {
        console.error('Error reading data:', err);
        return [];
    }
}

module.exports = { saveData, readData };
