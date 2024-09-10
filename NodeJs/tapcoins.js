const axios = require('axios');

// 添加你自己的tg_web_data
const tokens = [
    { 
        initData: 'query_id%3DAAHMDzg...',
        inviteCode:"",
        groupId:""
    },
    {
        initData: 'query_id%3DAAHMDzg...',
        inviteCode:"",
        groupId:""
    },
    // 可以添加更多 initData
];

const sessionData = [];

const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    'Connection': 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Host': 'xapi.tapcoins.app',
    'Origin': 'https://game.tapcoins.app',
    'Referer': 'https://game.tapcoins.app/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0'
};

async function login(initData) {
    try {
        const response = await axios.post('https://xapi.tapcoins.app/auth/login', `initData=${initData}`, { headers });
        if (response.data.code === 0) {
            const { token, collect } = response.data.data;
            console.log(`Login successful for user_id: ${collect.userInfo.id}, token: ${token}`);
            return { token, userInfo: collect.userInfo };
        } else {
            console.error(`Login failed with message: ${response.data.message}`);
            return null;
        }
    } catch (error) {
        console.error('Error during login:', error.message);
        return null;
    }
}

async function initializeSessions() {
    for (const tokenData of tokens) {
        const session = await login(tokenData.initData);
        if (session) {
            sessionData.push(session);
        }
    }
}

function startCoinCollectRequests() {
    setInterval(async () => {
        for (let i = 0; i < sessionData.length; i++) {
            const { token, userInfo } = sessionData[i];
            try {
                const response = await axios.post('https://xapi.tapcoins.app/coin/collect', 
                    `coin=20&power=0&turbo=0&_token=${token}`,
                    { headers });
                if (response.data.code === 401) {
                    console.error(`Session expired for user_id: ${userInfo.id}. Re-logging in...`);
                    const newSession = await login(tokens[i].initData);
                    if (newSession) {
                        sessionData[i] = newSession;
                        console.log(`Re-login successful for user_id: ${newSession.userInfo.id}`);
                    }
                } else {
                    console.log(`Coin collect successful for user_id: ${userInfo.id}, response: ${JSON.stringify(response.data)}`);
                }
            } catch (error) {
                console.error(`Error in coin collect request for user_id: ${userInfo.id}:`, error.message);
            }
        }
    }, 10000);
}

// 定时查询余额
function startBalanceChecks() {
    setInterval(async () => {
        for (let i = 0; i < sessionData.length; i++) {
            const { token, userInfo } = sessionData[i];
            try {
                const response = await axios.post('https://xapi.tapcoins.app/mine/earnings/increment', 
                    `_token=${token}`,
                    { headers });
                if (response.data.code === 401) {
                    console.error(`Session expired for user_id: ${userInfo.id}. Re-logging in...`);
                    const newSession = await login(tokens[i].initData);
                    if (newSession) {
                        sessionData[i] = newSession;
                        console.log(`Re-login successful for user_id: ${newSession.userInfo.id}`);
                    }
                } else {
                    console.log(`Balance check successful for user_id: ${userInfo.id}, response: ${JSON.stringify(response.data)}`);
                }
            } catch (error) {
                console.error(`Error in balance check request for user_id: ${userInfo.id}:`, error.message);
            }
        }
    }, 20000);
}

// 主函数
async function main() {
    await initializeSessions();
    startCoinCollectRequests();
    startBalanceChecks();
}

main();
