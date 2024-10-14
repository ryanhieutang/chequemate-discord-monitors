const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '/arbitrageData.json');

async function saveData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
        console.log('Data saved to file:', dataFilePath);
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
