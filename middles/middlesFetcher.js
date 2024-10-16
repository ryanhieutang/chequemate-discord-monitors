const axios = require('axios');
const crypto = require("crypto");

const url = 'https://oddsjam.com/api/backend/middle';
const DISCORD_DEBUG_URL = 'https://discord.com/api/webhooks/1296059738638909470/BgFtlUG7m1jM6vViHsQZwVXRzpSkz0AcFLL-ZwlZUWswWG3oElEuitr6mJ_Dtd3oopdx';

function generateSignature() {
    const secretKey = "-YlucqCFXFkUKkVF+NR0==Fg34W7<WHH";
    
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(timestamp);
    
    const signature = hmac.digest('base64');
    
    return signature;
}

// Function to send an embedded message to Discord
async function sendDiscordMessage(color, title, description) {
    const currentTime = new Date().toLocaleString(); // Get current time in local string format

    const embed = {
        embeds: [{
            title: title,
            description: description,
            color: color,
            footer: {
                text: `Sent at ${currentTime}`,  // Include time in the footer
            }
        }]
    };

    try {
        await axios.post(DISCORD_DEBUG_URL, embed, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error sending Discord message:", error);
    }
}

async function processAllPages(accessToken) {
    let allData = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        const payload = {
            is_mobile: true,
            min_percentage: "-1",
            new_serializer: true,
            sportsbooks: [
                "bet365",
                "Betfair",
                "Ladbrokes (Australia)",
                "Neds",
                "PointsBet (Australia)",
                "Sportsbet",
                "TABtouch"
            ],
            state: "AU-AU"
        };

        const timestamp = Math.floor(Date.now() / 1000);

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `${accessToken}`,
                    'Timestamp': timestamp.toString(),
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
                    'Signature': generateSignature()
                }
            });

            const pageData = response.data.data || [];
            allData = allData.concat(pageData);

            if (!response.data.has_more) {
                hasMorePages = false;
            } else {
                currentPage++;
            }

        } catch (error) {
            // Handle 401 Unauthorized error with a red embedded message
            if (error.response && error.response.status === 401) {
                await sendDiscordMessage(0xE95046, 'Error: 401 Unauthorized', `Received 401 Unauthorized for page ${currentPage}.`);
                throw error;
            } else {
                await sendDiscordMessage(0xE95046, 'Error Fetching Data', `Error fetching page ${currentPage}: ${error.message}`);
                return null;
            }
        }
    }

    return allData;
}

module.exports = {
    processAllPages
};
