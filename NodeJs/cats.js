const axios = require('axios');

const accountsInfo = [
  'query_id=AAHMDzg...',
  'query_id=AAHMDzg...',
];

const headersTemplate = {
  'content-type': 'application/json',
  'origin': 'https://cats-frontend.tgapps.store',
  'referer': 'https://cats-frontend.tgapps.store/'
};

async function processAccount(accountInfo) {
  const headers = {
    ...headersTemplate,
    'authorization': `tma ${accountInfo}`
  };

  try {
    const response = await axios.get('https://cats-backend-cxblew-prod.up.railway.app/tasks/user?group=cats', { headers });
    const tasks = response.data.tasks;
    console.error(`获取任务`, tasks)
    const incompleteTaskIds = tasks.filter(task => !task.completed).map(task => task.id);
    
    for (const taskId of incompleteTaskIds) {
        try {
            const tasks2 = await axios.post(`https://cats-backend-cxblew-prod.up.railway.app/tasks/${taskId}/complete`, {}, { headers });
          console.error(`点击任务`, tasks2.data)
        } catch (error) {
          console.error(`Error completing task ${taskId} for account:`, error.message);
          continue;
        }
    }

    const tasks3 = await axios.get('https://cats-backend-cxblew-prod.up.railway.app/user', { headers });
    console.error(`用户信息`, tasks3.data)
  } catch (error) {
    console.error(`Error processing account:`, error.message);
  }
}

async function main() {
  for (const accountInfo of accountsInfo) {
    await processAccount(accountInfo);
  }
}

main();
