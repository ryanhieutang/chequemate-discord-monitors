const axios = require('axios');
const { saveData, readData } = require('./dataStorage');

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1295175572200230942/BryXbbb2VNK1nm_o7vuep_JOixQePlOCeDYNP2S2qrpl67QFWj1zdCK-pIGLEUCy2y6K';  // Middles Discord webhook

const sportsbookEmojis = {
    "bet365": "<:BET365:1231455502215548999>", 
    "Betfair": "<:BETFAIR:1231455502215548999>",
    "Ladbrokes (Australia)": "<:LADBROKES:1231455972606611668>", 
    "PointsBet (Australia)": "<:POINTSBET:1231455985353359392>", 
    "Sportsbet": "<:SPORTSBET:1235931797884502036>", 
    "TABtouch": "<:TABTOUCH:1231455766821474367>", 
    "Neds": "<:NEDS:1235931700354220082>"
};

const sportsbookUrls = {
    "bet365": "https://www.bet365.com.au/",
    "Betfair": "https://www.betfair.com.au/",
    "Ladbrokes (Australia)": "https://www.ladbrokes.com.au/",
    "PointsBet (Australia)": "https://pointsbet.com.au/",
    "Sportsbet": "https://www.sportsbet.com.au/",
    "TABtouch": "https://www.tabtouch.com.au/",
    "Neds": "https://www.neds.com.au/"
};

function convertAmericanToAussieOdds(americanOdds) {
    if (americanOdds < 0) {
        return (100 / Math.abs(americanOdds)) + 1;
    } else {
        return (americanOdds / 100) + 1;
    }
}

async function sendToDiscord(newElement) {
    const { percentage, sport, league, market, home_team, away_team, bets, start_date } = newElement;

    const bet1 = bets[0];
    const bet2 = bets[1];

    const bet1Emoji = sportsbookEmojis[bet1.sportsbooks[0]] || ':grey_question:';
    const bet2Emoji = sportsbookEmojis[bet2.sportsbooks[0]] || ':grey_question:';

    const bet1AussieOdds = convertAmericanToAussieOdds(bet1.price);
    const bet2AussieOdds = convertAmericanToAussieOdds(bet2.price);

    const bet1Link = bet1.deep_link_map?.bet365?.desktop || sportsbookUrls[bet1.sportsbooks[0]] || '#';
    const bet2Link = bet2.deep_link_map?.desktop || sportsbookUrls[bet2.sportsbooks[0]] || '#';

    const embedMessage = {
        embeds: [
            {
                title: `${percentage}% Middle Bet Found! :money_with_wings:`,
                description: `**${sport} | ${league} | ${home_team} vs ${away_team}**\n\n` +
                             `:clock3: Starts <t:${Math.floor(new Date(start_date).getTime() / 1000)}:R>\n\n` +
                             `> **Market:** ${market}\n\n` +
                             `> **Bet 1: ${bet1.bet_name}** @ ${bet1AussieOdds.toFixed(2)} on ${bet1Emoji} [${bet1.sportsbooks.join(', ')}](${bet1Link})\n` +
                             `> **Bet 2: ${bet2.bet_name}** @ ${bet2AussieOdds.toFixed(2)} on ${bet2Emoji} [${bet2.sportsbooks.join(', ')}](${bet2Link})\n\n` +
                             `**For optimal bet size, use this [calculator](https://chequemate.au/calculators)**`,
                color: 0xffdd00,
                footer: {
                    text: "Data provided by ChequeMate Middles Bot",
                    icon_url: "https://media.discordapp.net/attachments/1251388838115545119/1270568017016655943/Untitled_design_3.png?ex=670c80ad&is=670b2f2d&hm=30fcf45821ea937b2cc562418270368307ce8c8091f0750b6dcbe158aef40c48&=&format=webp&quality=lossless&width=1000&height=1000" // Author image URL
                },
            }
        ]
    };

    try {
        await axios.post(DISCORD_WEBHOOK_URL, embedMessage);
        console.log('New middles opportunity posted to Discord:', embedMessage);
    } catch (error) {
        console.error('Error sending middles opportunity to Discord:', error);
    }
}

async function compareData(newData) {
    try {
        const previousData = await readData();
        const previousDataIds = previousData.map(item => item.id);

        const newElements = newData.filter(item => !previousDataIds.includes(item.id));

        if (newElements.length > 0) {
            for (const newElement of newElements) {
                await sendToDiscord(newElement);
            }
        } else {
            console.log('No new elements found.');
        }

        await saveData(newData);
    } catch (error) {
        console.error('Error comparing data:', error);
    }
}

module.exports = compareData;
