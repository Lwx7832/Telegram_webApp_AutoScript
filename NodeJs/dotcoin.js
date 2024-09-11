const axios = require('axios');

// 添加自己的账号
const accounts = [
    { "initData": "query_id=AAHMDzgoAAAAAM...", "hash": null },
    
    { "initData": "query_id=AAHMDzgoAAAAAM...", "hash": null },
];


const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqdm5tb3luY21jZXdudXlreWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg3MDE5ODIsImV4cCI6MjAyNDI3Nzk4Mn0.oZh_ECA6fA2NlwoUamf1TqF45lrMC0uIdJXvVitDbZ8',
    'content-type': 'application/json',
    'origin': 'https://app.dotcoin.bot',
    'priority': 'u=1, i',
    'referer': 'https://app.dotcoin.bot/'
};


async function getToken(account) {
    try {
        const response = await axios.post('https://api.dotcoin.bot/functions/v1/getToken', account, {
            headers:{
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqdm5tb3luY21jZXdudXlreWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg3MDE5ODIsImV4cCI6MjAyNDI3Nzk4Mn0.oZh_ECA6fA2NlwoUamf1TqF45lrMC0uIdJXvVitDbZ8',
            'content-type': 'application/json',
            'origin': 'https://app.dotcoin.bot',
            'referer': 'https://app.dotcoin.bot/'}
         });
        const { token, userId } = response.data;
        console.log('Token 和 UserID 获取成功:', response.data);
        return { token, userId };
    } catch (error) {
        console.error('获取 Token 失败:', error.message);
    }
}

async function getFilteredTasks(token) {
    try {
        const response = await axios.get('https://api.dotcoin.bot/rest/v1/rpc/get_filtered_tasks?platform=ios&locale=zh-hans&is_premium=false', {
            headers: {
                ...headers,
                'authorization': `Bearer ${token}`
            }
        });
        console.log('任务列表获取成功:', response.data);
        return response.data.filter(task => task.is_completed === null).map(task => task.id);
    } catch (error) {
        console.error('获取任务列表失败:', error.message);
    }
}

async function completeTask(token, taskId) {
    try {
        const response = await axios.post('https://api.dotcoin.bot/rest/v1/rpc/complete_task', { oid: taskId }, {
            headers: {
                ...headers,
                'authorization': `Bearer ${token}`
            }
        });
        console.log(`任务 ${taskId} 完成状态:`, response.data);
    } catch (error) {
        console.error(`完成任务 ${taskId} 失败:`, error.message);
    }
}

async function saveCoins(token) {
    while (true) {
        try {
            const response = await axios.post('https://api.dotcoin.bot/rest/v1/rpc/save_coins', { coins: 20000 }, {
                headers: {
                    ...headers,
                    'authorization': `Bearer ${token}`
                }
            });
            console.log('保存金币结果:', response.data);
            if (response.data.success === false) break;
        } catch (error) {
            console.error('保存金币失败:', error.message);
            break;
        }
    }
}

async function getUserInfo(token) {
    try {
        const response = await axios.get('https://api.dotcoin.bot/rest/v1/rpc/get_user_info', {
            headers: {
                ...headers,
                'authorization': `Bearer ${token}`
            }
        });
        console.log('用户信息:', response.data);
    } catch (error) {
        console.error('获取用户信息失败:', error.message);
    }
}

async function main() {
    for (const account of accounts) {
        const { token, userId } = await getToken(account);

        if (!token) continue;

        const taskIds = await getFilteredTasks(token);
        for (const taskId of taskIds) {
            await completeTask(token, taskId);
        }

        await saveCoins(token);

        await getUserInfo(token);
    }
}


main();
