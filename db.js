// db.js
const dbAdapter = require('./database/adapter');
const config = require('./config');

// 初始化数据库
async function initDatabase() {
  try {
    await dbAdapter.init();
    
    // 插入默认配置（如果 config.js 中有默认配置）
    if (config.defaultConfigs) {
      for (const [key, value] of Object.entries(config.defaultConfigs)) {
        const existing = await dbAdapter.get('SELECT * FROM configs WHERE key = ?', [key]);
        if (!existing) {
          await dbAdapter.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
          console.log(`✅ 插入默认配置: ${key}`);
        }
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
  initDatabase
};
