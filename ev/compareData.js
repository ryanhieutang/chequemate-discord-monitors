const axios = require('axios');
const { saveData, readData } = require('./dataStorage');

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1294867102397759529/lgPTs1u-J0Z_Q2KsCtfdgELjAuysuIr6puvJ15JMQLuzMAMC_A_EnR0Oe3P0AA_noYpo';
const DISCORD_DEBUG_URL = 'https://discord.com/api/webhooks/1296059738638909470/BgFtlUG7m1jM6vViHsQZwVXRzpSkz0AcFLL-ZwlZUWswWG3oElEuitr6mJ_Dtd3oopdx';

const sportsbookEmojis = {
    "bet365": "<:BET365:1231455502215548999>", 
    "betr (Australia)": "<:BETR:1248599134869524510>",
    "Ladbrokes (Australia)": "<:LADBROKES:1231455972606611668>", 
    "PointsBet (Australia)": "<:POINTSBET:1231455985353359392>", 
    "TAB": "<:TAB:1235932151405478009>",
    "TAB (New Zealand)": "<:TAB:1235932151405478009>", 
    "Unibet (Australia)": "<:UNIBET:1231455951954120794>", 
    "TABtouch": "<:TABTOUCH:1231455766821474367>",
    "Sportsbet": "<:SPORTSBET:1235931797884502036>",
    "Neds": "<:NEDS:1235931700354220082>"
};

const sportsbookUrls = {
    "bet365": "https://www.bet365.com.au/",
    "betr (Australia)": "https://www.betr.com.au/",
    "Ladbrokes (Australia)": "https://www.ladbrokes.com.au/",
    "PointsBet (Australia)": "https://pointsbet.com.au/",
    "TAB": "https://www.tab.com.au/",
    "TAB (New Zealand)": "https://www.tab.co.nz/",
    "Unibet (Australia)": "https://www.unibet.com.au/",
    "TABtouch": "https://www.tabtouch.com.au/",
    "Sportsbet": "https://www.sportsbet.com.au/",
    "Neds": "https://www.neds.com.au/"
};

function getDeepLink(bet, sportsbook) {
    // Check for a deep link in the bet's deep_link_map
    if (bet.deep_link_map?.[sportsbook]?.desktop) {
        return bet.deep_link_map[sportsbook].desktop;
    } else if (bet.deep_link_map?.desktop) {
        return bet.deep_link_map.desktop;
    }
    // Fall back to the default sportsbook URL if no deep link is found
    return sportsbookUrls[sportsbook] || '#';
}

// Send a Discord message with custom color and text
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

function convertAmericanToAussieOdds(americanOdds) {
    if (americanOdds < 0) {
        return (100 / Math.abs(americanOdds)) + 1;
    } else {
        return (americanOdds / 100) + 1;
    }
}

function calculateUnitSize(recSize) {
    return recSize / 5;
}

async function sendToDiscord(newElement) {
    const { percentage, sport, league, market, home_team, away_team, bets, start_date } = newElement;

    const highestEdgeBet = bets.reduce((prev, curr) => {
        return (curr.edge_percent || 0) > (prev.edge_percent || 0) ? curr : prev;
    }, bets[0]);

    const betEmoji = sportsbookEmojis[highestEdgeBet.sportsbooks[0]] || ':grey_question:';
    const betAussieOdds = convertAmericanToAussieOdds(highestEdgeBet.price);
    const betLink = getDeepLink(highestEdgeBet, highestEdgeBet.sportsbooks[0]);

    const unitSize = calculateUnitSize(highestEdgeBet.rec_size);

    const currentTimestamp = new Date().toLocaleString();
    const startTimestamp = Math.floor(new Date(start_date).getTime() / 1000);

    const embedMessage = {
        embeds: [
            {
                title: `${percentage}% EV Bet Found! :chart_with_upwards_trend:`,
                description: `**${sport} | ${league} | ${home_team} vs ${away_team}**\n\n` +
                             `:clock3: Starts <t:${startTimestamp}:R>\n\n` +
                             `> **Market:** ${market}\n\n` +
                             `> **Bet:** ${highestEdgeBet.bet_name} @ ${betAussieOdds.toFixed(2)} on ${betEmoji} [${highestEdgeBet.sportsbooks.join(', ')}](${betLink})\n\n` +
                             `> **Unit Size: ${unitSize.toFixed(2)} units**\n\n` +
                             `**Please ensure you are following the 1% bankroll unit size**`,
                color: 0xffdd00,
                footer: {
                    text: `Data provided by ChequeMate EV Bot | ${currentTimestamp}`,
                    icon_url: "https://media.discordapp.net/attachments/1251388838115545119/1270568017016655943/Untitled_design_3.png?ex=670c80ad&is=670b2f2d&hm=30fcf45821ea937b2cc562418270368307ce8c8091f0750b6dcbe158aef40c48&=&format=webp&quality=lossless&width=1000&height=1000"
                }
            }
        ]
    };

    try {
        await axios.post(DISCORD_WEBHOOK_URL, embedMessage);
    } catch (error) {
        await sendDiscordMessage(0xE95046, 'Error Posting to Discord', `Error sending EV opportunity to Discord: ${error.message}`);
    }
}

async function compareData(newData) {
    try {
        const previousData = await readData();
        const previousDataIds = previousData.map(item => item.id);

        // Filter out games more than 72 hours away
        const currentTime = Date.now();
        const maxTimeInFuture = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

        const newElements = newData.filter(item => {
            const startTime = new Date(item.start_date).getTime();
            return !previousDataIds.includes(item.id) && (startTime - currentTime <= maxTimeInFuture);
        });

        if (newElements.length > 0) {
            for (const newElement of newElements) {
                await sendDiscordMessage(0x33B97C, 'New EV Opportunity Found', `${JSON.stringify(newElement, null, 2)}`);
                await sendToDiscord(newElement);
            }
        } else {
            await sendDiscordMessage(0xF6A000, 'No new ev opportunity found or all new are more than 72 hours away.', null);
        }

        await saveData(newData);
    } catch (error) {
        await sendDiscordMessage(0xE95046, 'Error Comparing Data', `Error comparing data: ${error.message}`);
    }
}

module.exports = compareData;
