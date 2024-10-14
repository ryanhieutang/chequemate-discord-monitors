const { Task, TaskManager } = require('./taskManager');
const arbitrageFetcher = require('./arbitrage/arbitrageFetcher');
const evFetcher = require('./ev/evFetcher');
const middleFetcher = require('./middles/middlesFetcher');
const { readTokenFromFile } = require('./login/sessionHandler');
const { sendOtpRequest } = require('./login/loginRequest');
const compareArbitrageData = require('./arbitrage/compareData');
const compareEVData = require('./ev/compareData');
const compareMiddlesData = require('./middles/compareData');

async function reLogin() {
    console.log('Attempting re-login...');
    await sendOtpRequest();
    const newAccessToken = readTokenFromFile();
    
    if (newAccessToken) {
        console.log('New access token obtained.');
        return newAccessToken;
    } else {
        console.error('Failed to obtain new access token.');
        return null;
    }
}

async function executeTaskWithTokenCheck(taskName, fetcherFunction, compareFunction) {
    let accessToken = readTokenFromFile();
    
    if (!accessToken) {
        console.log(`No access token found. Starting login for task: ${taskName}`);
        accessToken = await reLogin();
        if (!accessToken) {
            console.error(`Failed to start ${taskName} due to login failure.`);
            return;
        }
    }

    try {
        const data = await fetcherFunction(accessToken);
        
        await compareFunction(data);
        
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log(`Access token expired for ${taskName}, re-logging in...`);

            accessToken = await reLogin();
            
            if (accessToken) {
                try {
                    const data = await fetcherFunction(accessToken);
                    await compareFunction(data);
                } catch (retryError) {
                    console.error(`Error retrying ${taskName} after re-login:`, retryError);
                }
            } else {
                console.error(`Failed to re-login for ${taskName}.`);
            }
        } else {
            console.error(`Error in ${taskName}:`, error);
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
}

main().catch(err => console.error(err));
