const axios = require('axios');
const crypto = require("crypto");

const url = 'https://oddsjam.com/api/backend/edge';

function generateSignature() {
    const secretKey = "-YlucqCFXFkUKkVF+NR0==Fg34W7<WHH";

    const timestamp = Math.floor(Date.now() / 1000).toString();

    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(timestamp);

    const signature = hmac.digest('base64');

    return signature;
}

async function processAllPages(accessToken) {
    let allData = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        const payload = {
            cross_line_comparison: true,
            is_mobile: true,
            max_odds: 0.4975124378109453,
            min_percentage: "4",
            multiway: true,
            new_serializer: true,
            page: currentPage,
            sort_field: "percentage",
            sort_order: "desc",
            sports: [
                "aussie rules", "basketball", "boxing", "cricket", "darts", 
                "esports", "football", "golf", "hockey", "lacrosse", 
                "mma", "motorsports", "olympics", "politics", "rugby league", 
                "soccer", "table tennis", "tennis", "wrestling", "baseball"
            ],
            sportsbooks: [
                "bet365", "Betfair", "Sportsbet", "Neds", "Ladbrokes (Australia)", 
                "PointsBet (Australia)", "TABtouch", "betr (Australia)", "TAB"
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
            if (error.response && error.response.status === 401) {
                console.log(`Received 401 Unauthorized for page ${currentPage}.`);
                throw error;
            } else {
                console.error(`Error fetching page ${currentPage}:`, error);
                return null;
            }
        }
    }
    console.log(`Total pages: ${currentPage}`);
    return allData;
}

module.exports = {
  processAllPages
};
