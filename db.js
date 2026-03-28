// db.js
const dbAdapter = require('./database/adapter');
const config = require('./config');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    await dbAdapter.init();

    // 1. 给 users 表添加 role 字段
   try {
  await dbAdapter.run("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'admin'");
  console.log('✅ users 表添加 role 字段成功');
} catch (e) {
  if (e.message && e.message.includes('already exists')) {
    console.log('✅ role 字段已存在，跳过');
  } else {
    console.error('❌ 添加 role 字段失败:', e.message);
  }
}


    // 2. 插入默认配置
    if (config.defaultConfigs) {
      for (const [key, value] of Object.entries(config.defaultConfigs)) {
        const existing = await dbAdapter.get('SELECT * FROM configs WHERE key = ?', [key]);
        if (!existing) {
          await dbAdapter.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
          console.log(`✅ 插入默认配置: ${key}`);
        }
      }
    } // 👈 原代码这里漏掉了闭合括号

    // 3. 管理员账号初始化
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const adminExists = await dbAdapter.get(
      'SELECT * FROM users WHERE username = ?', 
      [adminUsername]
    );
    
    if (!adminExists) {
      console.log(`👤 正在创建管理员账户: ${adminUsername}`);
      const hashedPw = await bcrypt.hash(adminPassword, 10);
      // 建议这里显式插入 role
      await dbAdapter.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
        [adminUsername, hashedPw, 'admin']
      );
      console.log(`✅ 管理员已创建: ${adminUsername} / ${adminPassword}`);
    } else {
      console.log(`✅ 管理员已存在: ${adminUsername}`);
    }
    
    console.log('✅ 数据库初始化完成');
  } catch (error) { // 👈 对应最外层的 try
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

module.exports = {
  db: dbAdapter,
  initDatabase
};
