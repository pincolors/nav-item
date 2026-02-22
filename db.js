// db.js
const dbAdapter = require('./database/adapter');

// 默认配置
const defaultConfigs = {
  'site.title': '导航站',
  'site.name': '导航站',
  'site.customCss': '',
  'site.backgroundImage': '',
  'site.backgroundOpacity': '0.15',
  'site.iconApi': 'https://www.google.com/s2/favicons?domain={domain}&sz=256',
  'site.searchBoxEnabled': 'true',
  'site.searchBoxGuestEnabled': 'true',
};

// 初始化数据库
async function initDatabase() {
  try {
    await dbAdapter.init();
    
    // 插入默认配置
    for (const [key, value] of Object.entries(defaultConfigs)) {
      const existing = await dbAdapter.get('SELECT * FROM configs WHERE key = ?', [key]);
      if (!existing) {
        await dbAdapter.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
        console.log(`✅ 插入默认配置: ${key}`);
      }
    }
    
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

// 导出数据库实例和初始化函数
module.exports = {
  db: dbAdapter,
  initDatabase,
  defaultConfigs
};
