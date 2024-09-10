const axios = require('axios');

// 退换成自己的tg_web_data和tg ID
const accounts = [
    {"initData":"query_id=AAHMDzg.....","id":674....,},
    {"initData":"query_id=AAHMDzg.....","id":674....,},
];

// 登录并获取多个账户的 token
async function loginAndGetTokens() {
    const loginUrl = 'https://byin.fun/api/tg/login';
    const headers = {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Host': 'byin.fun',
        'Origin': 'https://byin.fun',
        'Referer': 'https://byin.fun/influence',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
        'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128", "Microsoft Edge WebView2";v="128"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
    };

    try {
        const tokenPromises = accounts.map(account => 
            axios.post(loginUrl, account, { headers })
                .then(response => ({
                    username: account.username,
                    token: response.data.data.token
                }))
                .catch(error => {
                    console.error(`Login failed for ${account.username}:`, error.message);
                    return null;
                })
        );

        
        const tokens = await Promise.all(tokenPromises);
        console.log(tokens)
        return tokens.filter(tokenObj => tokenObj !== null); // 过滤掉登录失败的账户
    } catch (error) {
        console.error('Error during login:', error.message);
        return [];
    }
}


async function fetchTasks(tokens) {
    const urls = [
        'https://byin.fun/api/task/page?taskType=0&pageSize=10000&pageNum=1',
        'https://byin.fun/api/task/page?taskType=1&pageSize=10000&pageNum=1',
        'https://byin.fun/api/task/page?taskType=2&pageSize=10000&pageNum=1'
    ];

    try {
        const fetchPromises = tokens.map(({ username, token }) =>
            Promise.all(urls.map(url =>
                axios.get(url, {
                    headers: {
                        'Accept': '*/*',
                        'Accept-Encoding': 'gzip, deflate, br, zstd',
                        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                        'Connection': 'keep-alive',
                        'Content-Type': 'application/json',
                        'Host': 'byin.fun',
                        'Origin': 'https://byin.fun',
                        'Referer': 'https://byin.fun/influence',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
                        'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128", "Microsoft Edge WebView2";v="128"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'token': `${token}`
                    }
                })
                .then(response => ({ username, tasks: response.data.data.list }))
                .catch(error => {
                    console.error(`Error fetching tasks for ${username}:`, error.message);
                    return null;
                })
            ))
        );

        const allTasks = (await Promise.all(fetchPromises)).flatMap(userTasks => userTasks ? userTasks.flatMap(user => user.tasks) : []);
     
        const unfinishedTasks = allTasks.filter(task => !task.hasFinish);
        return unfinishedTasks.map(task => task.id);
    } catch (error) {
        console.error('Error fetching tasks:', error.message);
        return [];
    }
}

async function postTasks(ids, tokens) {
    const postPromises = ids.map((id, index) => {
        const { username, token } = tokens[index % tokens.length];

        return axios.post(
            'https://byin.fun/api/task/join',
            { id },
            {
                headers: {
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/json',
                    'Host': 'byin.fun',
                    'Origin': 'https://byin.fun',
                    'Referer': 'https://byin.fun/influence',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
                    'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128", "Microsoft Edge WebView2";v="128"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'token': `${token}`
                }
            }
        )
        .then(response => {
            console.log(`Response for id ${id} by ${username}:`, response.data);
        })
        .catch(error => {
            console.error(`Error posting task with id ${id} by ${username}:`, error.message);
        });
    });

    await Promise.all(postPromises);
}


async function main() {
    const tokens = await loginAndGetTokens();
    if (tokens.length === 0) {
        console.error('Failed to obtain any tokens. Exiting...');
        return;
    }

    const ids = await fetchTasks(tokens);
    if (ids.length > 0) {
        await postTasks(ids, tokens);
    } else {
        console.log('No unfinished tasks found.');
    }
}

main();
