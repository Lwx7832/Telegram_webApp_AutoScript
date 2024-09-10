const axios = require('axios');
const crypto = require('crypto');

// 添加你自己账号的token
const tokens = [
  'eyJhbGciOi.....',
  'eyJhbGciOi.....',
];

const headersTemplate = {
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'origin': 'https://app.galacoin.xyz',
  'priority': 'u=1, i',
  'referer': 'https://app.galacoin.xyz/'
};

const collectSeqNos = [];

async function processToken(token) {
  const headers = {
    ...headersTemplate,
    'authorization': `Bearer ${token}`
  };

  try {
    let response = await axios.get('https://api.galacoin.xyz/miniapps/api/task/lists?', { headers });
    const tasks = response.data.data.lists;

    const unfinishedTaskIds = tasks.filter(task => task.isFinish === 0).map(task => task.id);
    console.log('读取可完成的任务列表:', unfinishedTaskIds);

    for (const taskId of unfinishedTaskIds) {
      try {
        const tasks1 = await axios.post(`https://api.galacoin.xyz/miniapps/api/task/finish_task?id=${taskId}`, `id=${taskId}`, { headers });
        console.log(`完成任务 ${taskId}:`, tasks1.data);
      } catch (error) {
        console.error(`完成任务失败 ${taskId}:`, error.message);
        continue;
      }
    }

    try {
      response = await axios.post('https://api.galacoin.xyz/miniapps/api/sign/sign?type=Premium', 'type=Premium', { headers });
      console.log('签到:', response.data);
    } catch (error) {
      console.error('签到失败:', error.message);
    }

    response = await axios.get('https://api.galacoin.xyz/miniapps/api/user_game_level/GetGameInfo', { headers });
    console.log('读取用户信息:', response.data);

    const collectSeqNo = response.data.data.collectSeqNo;
    collectSeqNos.push({ token, collectSeqNo });

  } catch (error) {
    console.error('读取用户信息失败:', error.message);
  }
}

async function main() {
  for (const token of tokens) {
    await processToken(token);
  }

  setInterval(async () => {
    for (let i = 0; i < collectSeqNos.length; i++) {
      const { token, collectSeqNo } = collectSeqNos[i];
      const collectAmount = Math.floor(Math.random() * (200 - 100 + 1)) + 100;
      const hashCode = crypto.createHash('md5').update(`${collectAmount}${collectSeqNo}7be2a16a82054ee58398c5edb7ac4a5a`).digest('hex');

      const headers = {
        ...headersTemplate,
        'authorization': `Bearer ${token}`
      };

      try {
        const response = await axios.post(
          `https://api.galacoin.xyz/miniapps/api/user_game/collectCoin?collectAmount=${collectAmount}&hashCode=${hashCode}&collectSeqNo=${collectSeqNo}`,
          `collectAmount=${collectAmount}&hashCode=${hashCode}&collectSeqNo=${collectSeqNo}`,
          { headers }
        );
        console.log('挖取金币:', response.data);
        collectSeqNos[i].collectSeqNo++;
      } catch (error) {
        console.error('挖取金币失败:', error.message);
      }
    }
  }, 5000);
}

main();
