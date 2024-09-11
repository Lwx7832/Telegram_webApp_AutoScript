const axios = require('axios');

const queryIds = [
    'query_id=AAHMDzgoAAAAA....',
    'query_id=AAEyuHZlAAAAADK...',
];


const userTokens = {};

async function fetchAccessToken(queryId) {
    try {
        const response = await axios.get(`https://api.djdog.io/telegram/login?${queryId}`);
        if (response.data.returnCode === 200) {
            const data = response.data.data;
            const telegramUsername = data.telegramUsername;
            const accessToken = data.accessToken;

            // 保存 telegramUsername 和 accessToken
            userTokens[telegramUsername] = accessToken;
            console.log(`已成功获取Token ${telegramUsername}: ${accessToken}`);
        } else {
            console.error(`无法获取Token令牌: ${queryId}, Reason: ${response.data.returnDesc}`);
        }
    } catch (error) {
        console.error(`获取Token出错: ${queryId}`, error.message);
    }
}

// 自定义请求头函数
const createHeaders = (token) => ({
    'Authorization': `${token}`,
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
    'origin': 'https://djdog.io',
});

// 获取任务列表
async function fetchTasks(token) {
    try {
        const response = await axios.get('https://api.djdog.io/check/in/user/list', {
            headers: createHeaders(token)
        });
        return response.data.data.filter(task => !task.finished).map(task => task.id); // 过滤出 finished 为 false 的 id
    } catch (error) {
        console.error('Error fetching tasks:', error.message);
        return [];
    }
}


async function fetchPartnerTasks(token) {
    try {
        const response = await axios.get('https://api.djdog.io/mission/partners', {
            headers: createHeaders(token)
        });
        console.log(response.data.data.missionRows.filter(task => !task.finished).map(task => task.taskId))
        return response.data.data.missionRows.filter(task => !task.finished).map(task => task.taskId); // 过滤出 finished 为 false 的 taskId
    } catch (error) {
        console.error('Error fetching partner tasks:', error.message);
        return [];
    }
}

async function fetchPartnerTasks1(token) {
    try {
        const response = await axios.get('https://api.djdog.io/mission/walkFinds', {
            headers: createHeaders(token)
        });
        console.log(response.data.data.missionRows.filter(task => !task.finished).map(task => task.taskId))
        return response.data.data.missionRows.filter(task => !task.finished).map(task => task.taskId); // 过滤出 finished 为 false 的 taskId
    } catch (error) {
        console.error('Error fetching partner tasks:', error.message);
        return [];
    }
}

async function fetchGroupTasks(token) {
    try {
        const response = await axios.get('https://api.djdog.io/mission/group', {
            headers: createHeaders(token)
        });
        const tasks = response.data.data.flatMap(group => 
            group.missionRows.filter(row => !row.finished).map(row => row.taskId)
        );
        return tasks;
    } catch (error) {
        console.error('Error fetching group tasks:', error.message);
        return [];
    }
}



// 执行任务
async function executeTasks(token, taskIds) {
    for (const taskId of taskIds) {
        try {
            const response = await axios.post(`https://api.djdog.io/check/in?id=${taskId}`, 
                { id: taskId },
                { headers: createHeaders(token) }
            );
            console.log(`开始执行任务: ${taskId}, response: ${JSON.stringify(response.data)}`);
        } catch (error) {
            console.error(`执行任务出错: ${taskId}`, error.message);
        }
    }
}

// 执行合作伙伴任务
async function executePartnerTasks(token, partnerTaskIds) {
    for (const taskId of partnerTaskIds) {
        try {
            const response = await axios.post(`https://api.djdog.io/mission/finish?id=${taskId}`, 
                { id: taskId },
                { headers: createHeaders(token) }
            );
            console.log(`开始执行任务: ${taskId}, response: ${JSON.stringify(response.data)}`);
        } catch (error) {
            console.error(`执行任务出错: ${taskId}`, error.message);
        }
    }
}



async function startCollecting(token) {
    //while (true) {
        try {
            const response = await axios.post(
                'https://api.djdog.io/pet/collect?clicks=5000',
                { clicks: 10000 },
                { headers: createHeaders(token) }
            );

            console.log(`Collecting clicks for token: ${token}, response: ${JSON.stringify(response.data)}`);

            if (response.data.returnCode === 403  && response.data.returnDesc === "Access Denied" && response.data.returnCode === 400200 && response.data.returnDesc === "Harvest limit reached for today") {
                console.log("Harvest limit reached for this token.");
           //     break; // 停止当前 token 的采集
            } else {
                await new Promise(resolve => setTimeout(resolve, 5000)); // 每5秒执行一次
            }
        } catch (error) {
            console.error(`Error collecting clicks for token: ${token}`, error.message);
            await new Promise(resolve => setTimeout(resolve, 5000)); // 出现错误时也等待5秒
        }
   // }
}


async function main() {
    // 第一步：获取所有 accessToken
    for (const queryId of queryIds) {
        await fetchAccessToken(queryId);
    }
    
    // 第二步：使用获取到的 accessToken 处理任务
    for (const [telegramUsername, token] of Object.entries(userTokens)) {
        const taskIds = await fetchTasks(token); // 获取任务列表
        const partnerTaskIds = await fetchPartnerTasks(token); // 获取合作伙伴任务列表
        const partnerTaskIds1 = await fetchPartnerTasks1(token); // 获取合作伙伴任务列表
        const groupTask = await fetchGroupTasks(token); // 获取合作伙伴任务列表
        

        if (taskIds.length > 0) {
            console.log(`开始执行任务: ${telegramUsername}, 任务ID: ${taskIds}`);
            await executeTasks(token, taskIds); // 执行任务
        } else {
            console.log(`没有任务: ${telegramUsername}`);
        }

        if (partnerTaskIds.length > 0) {
            console.log(`开始执行任务: ${telegramUsername}, 任务ID: ${partnerTaskIds}`);
            await executePartnerTasks(token, partnerTaskIds); // 执行合作伙伴任务
        } else {
            console.log(`没有任务: ${telegramUsername}`);
        }

        if (partnerTaskIds1.length > 0) {
            console.log(`开始执行任务: ${telegramUsername}, 任务ID: ${partnerTaskIds1}`);
            await executePartnerTasks(token, partnerTaskIds1); // 执行合作伙伴任务
        } else {
            console.log(`没有任务: ${telegramUsername}`);
        }
        if (groupTask.length > 0) {
            console.log(`开始执行任务: ${telegramUsername}, 任务ID: ${groupTask}`);
            await executePartnerTasks(token, groupTask); // 执行合作伙伴任务
        } else {
            console.log(`没有任务: ${telegramUsername}`);
        }

        // 当所有任务执行完毕后，开始循环收集 clicks
        await startCollecting(token);
        
    }

    console.log("All tokens processed. Pausing for 1 hour...");
    await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
    await main(); // 1小时后继续处理
}



main();
