const axios = require('axios');

const tokens = [
  "eyJhbGciOiJ.....",
  "eyJhbGciOiJ.....",
  //更多账号...
];

const headers = {
  'content-type': 'application/json',
  'origin': 'https://telegram.blum.codes'
};

// 刷新token函数
async function refreshToken(token) {
  const url = 'https://gateway.blum.codes/v1/auth/refresh';
  const data = {
    refresh: token
  };
  try {
    const response = await axios.post(url, data, { headers });
    console.log('刷新token:', response.data);
    return response.data.access;
  } catch (error) {
    console.error('刷新token错误:', error.message);
    return null;
  }
}

// 获取任务列表函数
async function getTasks(accessToken) {
  const url = 'https://game-domain.blum.codes/api/v1/tasks';
  const headersWithAuth = {
    ...headers,
    'authorization': `Bearer ${accessToken}`
  };
  try {
    const response = await axios.get(url, { headers: headersWithAuth });
    console.log('获取任务:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取任务错误:', error.message);
    return [];
  }
}

// 开始任务函数
async function startTask(accessToken, task) {
  const url = `https://game-domain.blum.codes/api/v1/tasks/${task.id}/start`;
  const headersWithAuth = {
    ...headers,
    'authorization': `Bearer ${accessToken}`
  };
  task.status = 'STARTED'; // 修改状态为STARTED

  try {
    const response = await axios.post(url, task, { headers: headersWithAuth });
    console.log(`开始任务 ${task.id} Res:`, response.data);
  } catch (error) {
    console.error(`开始任务出错 ${task.id}:`, error.message);
  }
}

// 完成任务函数
async function finishTask(accessToken, task) {
  const url = `https://game-domain.blum.codes/api/v1/tasks/${task.id}/claim`;
  const headersWithAuth = {
    ...headers,
    'authorization': `Bearer ${accessToken}`
  };
  task.status = 'FINISHED';

  try {
    const response = await axios.post(url, task, { headers: headersWithAuth });
    console.log(`领取任务奖励 ${task.id} Res:`, response.data);
  } catch (error) {
    console.error(`开始任务出错 ${task.id}:`, error.message);
  }
}

// 启动 Farming 功能函数
async function startFarming(accessToken) {
    const url = 'https://game-domain.blum.codes/api/v1/farming/start';
    const headersWithAuth = {
      ...headers,
      'authorization': `Bearer ${accessToken}`
    };
  
    const startTime = Date.now(); // 当前时间戳
    const endTime = startTime + 8 * 60 * 60 * 1000; // 当前时间戳 + 8小时
  
    const data = {
      startTime: startTime,
      endTime: endTime,
      earningsRate: "0.002",
      balance: "0"
    };
  
    try {
      const response = await axios.post(url, data, { headers: headersWithAuth });
      console.log('Farming Start Response:', response.data);
    } catch (error) {
      console.error('Error starting farming:', error.message);
    }
  }

// 主函数
(async () => {
  for (let token of tokens) {
    // 1. 刷新token
    const accessToken = await refreshToken(token);
    if (!accessToken) continue; // 如果无法刷新token则跳过

    // 2. 获取任务列表
    const tasks = await getTasks(accessToken);

    // 3. 处理任务
    for (let group of tasks) {
      for (let task of group.tasks) {
        if (task.status === 'NOT_STARTED') {
          // 3.1 开始任务
          await startTask(accessToken, task);
          // 3.2 完成任务
          await finishTask(accessToken, task);
        }
      }
    }
    // 4. 所有任务执行完成后启动 Farming
    await startFarming(accessToken);
  }
})();
