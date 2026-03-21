// db.js
const dbAdapter = require('./database/adapter');
const config = require('./config');
const bcrypt = require('bcrypt');  // 👈 加这行

async function initDatabase() {
  try {
    await dbAdapter.init();
    
    // 插入默认配置
    if (config.defaultConfigs) {
      for (const [key, value] of Object.entries(config.defaultConfigs)) {
        const existing = await dbAdapter.get('SELECT * FROM configs WHERE key = ?', [key]);
        if (!existing) {
          await dbAdapter.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
          console.log(`✅ 插入默认配置: ${key}`);
        }
      }
    }

    // 👇 新增：管理员账号初始化
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const adminExists = await dbAdapter.get(
      'SELECT * FROM users WHERE username = ?', 
      [adminUsername]
    );
    
    if (!adminExists) {
      console.log(`👤 正在创建管理员账户: ${adminUsername}`);
      const hashedPw = await bcrypt.hash(adminPassword, 10);
      await dbAdapter.run(
        'INSERT INTO users (username, password) VALUES (?, ?)', 
        [adminUsername, hashedPw]
      );
      console.log(`✅ 管理员已创建: ${adminUsername} / ${adminPassword}`);
    } else {
      console.log(`✅ 管理员已存在: ${adminUsername}`);
    }
    
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

module.exports = {
  db: dbAdapter,
  initDatabase
};
