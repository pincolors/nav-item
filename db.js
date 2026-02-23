const dbAdapter = require('./database/adapter');
const config = require('./config');

// 初始化数据库
async function initDatabase() {
  try {
    // 1. 先建立基础连接
    await dbAdapter.init();

    // 2. 【核心修复】强制清理旧表结构 (解决 column "id" does not exist)
    // 注意：只需在修复时运行一次，修复后请将下面这行代码注释掉，否则每次启动都会清空数据
    const isPostgres = process.env.DB_TYPE === 'postgres';
    if (isPostgres) {
        console.log('⚠️ 正在尝试清理旧表结构以修复字段冲突...');
        // 使用 CASCADE 强制删除所有关联表
        await dbAdapter.run('DROP TABLE IF EXISTS cards, sub_menus, menus, users, ads, friends, configs CASCADE');
        
        // 重新调用 adapter 的初始化来重建正确的表结构
        // 这一步确保 adapter.js 里的 CREATE TABLE 语句重新执行
        await dbAdapter.init(); 
    }
    
    // 3. 插入默认配置
    if (config.defaultConfigs) {
      for (const [key, value] of Object.entries(config.defaultConfigs)) {
        // 兼容处理：确保查询和插入语句在不同数据库下正常
        const existing = await dbAdapter.get('SELECT * FROM configs WHERE key = ?', [key]);
        if (!existing) {
          await dbAdapter.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
          console.log(`✅ 插入默认配置: ${key}`);
        }
      }
    }
    
    // 4. 确保管理员账号存在 (防止 401 错误)
    if (config.admin) {
        const adminExists = await dbAdapter.get('SELECT * FROM users WHERE username = ?', [config.admin.username]);
        if (!adminExists) {
            const bcrypt = require('bcrypt');
            const hashedPw = await bcrypt.hash(config.admin.password, 10);
            await dbAdapter.run('INSERT INTO users (username, password) VALUES (?, ?)', [config.admin.username, hashedPw]);
            console.log('👤 已重新创建管理员账户');
        }
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
