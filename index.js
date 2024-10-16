const { Task, TaskManager } = require('./taskManager');
const arbitrageFetcher = require('./arbitrage/arbitrageFetcher');
const evFetcher = require('./ev/evFetcher');
const middleFetcher = require('./middles/middlesFetcher');
const { readTokenFromFile } = require('./login/sessionHandler');
const { sendOtpRequest } = require('./login/loginRequest');
const compareArbitrageData = require('./arbitrage/compareData');
const compareEVData = require('./ev/compareData');
const compareMiddlesData = require('./middles/compareData');
const axios = require('axios');

const DISCORD_DEBUG_URL = 'https://discord.com/api/webhooks/1296059738638909470/BgFtlUG7m1jM6vViHsQZwVXRzpSkz0AcFLL-ZwlZUWswWG3oElEuitr6mJ_Dtd3oopdx';

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

async function reLogin() {
    await sendDiscordMessage(0x33B97C, 'Re-login Attempt', 'Attempting re-login...');
    await sendOtpRequest();
    const newAccessToken = readTokenFromFile();
    
    if (newAccessToken) {
        await sendDiscordMessage(0x33B97C, 'Access Token', 'New access token obtained.');
        return newAccessToken;
    } else {
        await sendDiscordMessage(0xE95046, 'Access Token Error', 'Failed to obtain new access token.');
        return null;
    }
}

async function executeTaskWithTokenCheck(taskName, fetcherFunction, compareFunction) {
    let accessToken = readTokenFromFile();
    
    if (!accessToken) {
        await sendDiscordMessage(0x33B97C, `No Access Token`, `No access token found. Starting login for task: ${taskName}`);
        accessToken = await reLogin();
        if (!accessToken) {
            await sendDiscordMessage(0xE95046, `Login Failure`, `Failed to start ${taskName} due to login failure.`);
            return;
        }
    }

    try {
        const data = await fetcherFunction(accessToken);
        await compareFunction(data);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            await sendDiscordMessage(0xE95046, `${taskName} Token Expired`, `Access token expired for ${taskName}, re-logging in...`);

            accessToken = await reLogin();
            
            if (accessToken) {
                try {
                    const data = await fetcherFunction(accessToken);
                    await compareFunction(data);
                    await sendDiscordMessage(0x33B97C, `${taskName} Retry Success`, `Successfully retried ${taskName} after re-login.`);
                } catch (retryError) {
                    await sendDiscordMessage(0xE95046, `Retry Error`, `Error retrying ${taskName} after re-login: ${retryError.message}`);
                }
            } else {
                await sendDiscordMessage(0xE95046, `Re-login Failure`, `Failed to re-login for ${taskName}.`);
            }
        } else {
            await sendDiscordMessage(0xE95046, `${taskName} Error`, `Error in ${taskName}: ${error.message}`);
        }
    }
}

async function main() {
    const taskManager = new TaskManager();

    const arbitrageTask = new Task('ArbitrageFetcher', async () => {
        await executeTaskWithTokenCheck('ArbitrageFetcher', arbitrageFetcher.processAllPages, compareArbitrageData);
    });

    const evTask = new Task('EVFetcher', async () => {
        await executeTaskWithTokenCheck('EVFetcher', evFetcher.processAllPages, compareEVData);
    });

    const middleTask = new Task('MiddlesFetcher', async () => {
        await executeTaskWithTokenCheck('MiddlesFetcher', middleFetcher.processAllPages, compareMiddlesData);
    });

    taskManager.addTask(arbitrageTask);
    taskManager.addTask(evTask);
    taskManager.addTask(middleTask);

    taskManager.startAll(30000);
    await sendDiscordMessage(0x33B97C, 'Task Manager Started', 'All tasks started with a 30-second interval.');
}

main().catch(err => sendDiscordMessage(0xE95046, 'Main Error', `Main process error: ${err.message}`));
