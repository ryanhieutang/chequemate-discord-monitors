const fs = require('fs');
const path = require('path');

const tokenFilePath = path.join(__dirname, '/session_token.txt');

function saveTokenToFile(token) {
    try {
        fs.writeFileSync(tokenFilePath, token);
    } catch (error) {
        console.error('Error saving token to file:', error);
    }
}

function readTokenFromFile() {
    if (fs.existsSync(tokenFilePath)) {
        const token = fs.readFileSync(tokenFilePath, 'utf-8');
        return token.trim();
    } else {
        console.log('Token file not found.');
        return null;
    }
}

module.exports = {
  saveTokenToFile,
  readTokenFromFile
};
