// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const { db, initDatabase } = require('./db');

// 导入路由
const menuRoutes = require('./routes/menu');
const cardRoutes = require('./routes/card');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ad');
const friendRoutes = require('./routes/friend');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 8080;

// ==============================
// 中间件
// ==============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ==============================
// 静态资源
// ==============================

// 上传目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 前端打包目录
app.use(express.static(path.join(__dirname, 'web/dist')));

// ==============================
// API 路由（必须放在 fallback 前面）
// ==============================
app.use('/api/menus', menuRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);

// ==============================
// 健康检查（用于 Koyeb 等平台）
// ==============================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: process.env.DB_TYPE || 'sqlite'
  });
});

// ==============================
// 前端 SPA fallback（必须放最后）
// ==============================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/dist', 'index.html'));
});

// ==============================
// 错误处理中间件
// ==============================
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);

  if (req.path.startsWith('/api')) {
    res.status(err.status || 500).json({
      error:
        process.env.NODE_ENV === 'production'
          ? '服务器内部错误'
          : err.message
    });
  } else {
    res.status(500).send('服务器内部错误');
  }
});

// ==============================
// 启动服务器
// ==============================
async function startServer() {
  try {
    console.log('\n========================================');
    console.log('🚀 正在启动服务器...');
    console.log('========================================');

    console.log('🔄 正在初始化数据库...');
    await initDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n========================================');
      console.log('✅ 服务器启动成功！');
      console.log('----------------------------------------');
      console.log(`🌐 访问地址: http://localhost:${PORT}`);
      console.log(`📊 数据库类型: ${process.env.DB_TYPE || 'sqlite'}`);
      console.log(
        `🗄️  数据库: ${
          process.env.DB_TYPE === 'postgres'
            ? 'PostgreSQL'
            : process.env.DB_PATH || './database/nav.db'
        }`
      );
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ 服务器启动失败！');
    console.error('========================================');
    console.error(error);
    process.exit(1);
  }
}

// ==============================
// 优雅关闭
// ==============================
async function gracefulShutdown(signal) {
  console.log(`\n🛑 收到 ${signal}，正在关闭服务器...`);
  try {
    await db.close();
    console.log('✅ 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭时发生错误:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('未捕获异常:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('未处理 Promise 拒绝:', reason);
  gracefulShutdown('unhandledRejection');
});

// 启动
if (require.main === module) {
  startServer();
}

module.exports = app;
