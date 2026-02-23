// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const authMiddleware = require('./authMiddleware');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ========================================
// 注册用户
// ========================================
router.post('/register', async (req, res) => {
  console.log('==================== 用户注册 ====================');
  const { username, password } = req.body;
  
  // 输入验证
  if (!username || !password) {
    console.error('❌ 缺少用户名或密码');
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  if (username.length < 3) {
    return res.status(400).json({ error: '用户名长度至少3位' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少6位' });
  }
  
  // 用户名格式验证（只允许字母、数字、下划线）
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: '用户名只能包含字母、数字和下划线' });
  }
  
  try {
    // 检查用户是否已存在
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      console.error('❌ 用户名已存在:', username);
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 插入新用户
    const result = await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    
    console.log('🟢 注册成功，用户 ID:', result.lastID, '用户名:', username);
    console.log('====================');
    
    res.json({ 
      message: '注册成功', 
      id: result.lastID,
      username 
    });
  } catch (error) {
    console.error('❌ 注册失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 登录
// ========================================
router.post('/login', async (req, res) => {
  console.log('==================== 用户登录 ====================');
  const { username, password, remember } = req.body;
  
  if (!username || !password) {
    console.error('❌ 缺少用户名或密码');
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  try {
    // 查找用户
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      console.error('❌ 用户不存在:', username);
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.error('❌ 密码错误，用户:', username);
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 更新最后登录时间和 IP（如果表结构支持）
    const loginIp = req.ip || req.connection.remoteAddress;
    try {
      await db.run(
        'UPDATE users SET last_login_time = CURRENT_TIMESTAMP, last_login_ip = ? WHERE id = ?',
        [loginIp, user.id]
      );
    } catch (updateError) {
      // 如果表没有这些字段，忽略错误
      console.warn('⚠️ 更新登录信息失败（可能是表结构不支持）');
    }
    
    // 生成 JWT
    const expiresIn = remember ? '30d' : '7d'; // 记住我：30天，否则7天
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn }
    );
    
    console.log('🟢 登录成功，用户:', username, 'ID:', user.id);
    console.log('====================');
    
    res.json({
      success: true,
      message: '登录成功',
      token,
      expiresIn,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('❌ 登录失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 验证 token
// ========================================
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      valid: false, 
      error: '未提供 token' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get('SELECT id, username FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({ 
        valid: false, 
        error: '用户不存在' 
      });
    }
    
    res.json({ 
      valid: true, 
      user,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        valid: false, 
        error: 'Token 已过期',
        expired: true
      });
    }
    res.status(401).json({ 
      valid: false, 
      error: 'Token 无效' 
    });
  }
});

// ========================================
// 刷新 token
// ========================================
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    // 从中间件获取用户信息
    const user = await db.get(
      'SELECT id, username FROM users WHERE id = ?', 
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 生成新 token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('🟢 Token 刷新成功，用户:', user.username);
    
    res.json({
      success: true,
      message: 'Token 刷新成功',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Token 刷新失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 登出（可选，如果需要服务端记录）
// ========================================
router.post('/logout', authMiddleware, async (req, res) => {
  // 如果需要在服务端记录登出，可以在这里实现
  // 例如：将 token 加入黑名单
  
  console.log('🟢 用户登出，ID:', req.user.id, '用户名:', req.user.username);
  
  res.json({ 
    success: true,
    message: '登出成功' 
  });
});

// ========================================
// 修改密码（已登录用户）
// ========================================
router.post('/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请提供旧密码和新密码' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少6位' });
  }
  
  try {
    // 获取当前用户
    const user = await db.get(
      'SELECT password FROM users WHERE id = ?', 
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证旧密码
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: '旧密码错误' });
    }
    
    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await db.run(
      'UPDATE users SET password = ? WHERE id = ?', 
      [newPasswordHash, req.user.id]
    );
    
    console.log('🟢 密码修改成功，用户 ID:', req.user.id);
    res.json({ 
      success: true,
      message: '密码修改成功' 
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 检查用户名是否可用（注册前检查）
// ========================================
router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;
  
  if (!username || username.length < 3) {
    return res.status(400).json({ 
      available: false, 
      error: '用户名长度至少3位' 
    });
  }
  
  try {
    const user = await db.get(
      'SELECT id FROM users WHERE username = ?', 
      [username]
    );
    
    res.json({ 
      available: !user,
      message: user ? '用户名已被占用' : '用户名可用'
    });
  } catch (error) {
    console.error('检查用户名失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 忘记密码 - 发送重置邮件（示例，需要配置邮件服务）
// ========================================
router.post('/forgot-password', async (req, res) => {
  const { username, email } = req.body;
  
  if (!username && !email) {
    return res.status(400).json({ error: '请提供用户名或邮箱' });
  }
  
  try {
    // 查找用户（这里假设有 email 字段）
    const user = await db.get(
      'SELECT id, username FROM users WHERE username = ? OR email = ?', 
      [username, email]
    );
    
    if (!user) {
      // 安全考虑：即使用户不存在也返回成功消息
      return res.json({ 
        success: true,
        message: '如果该账号存在，重置链接已发送到您的邮箱' 
      });
    }
    
    // 生成重置 token（这里简化处理）
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // TODO: 发送邮件
    // await sendResetEmail(user.email, resetToken);
    
    console.log('🟢 密码重置请求，用户:', user.username);
    console.log('🔑 重置 Token:', resetToken);
    
    res.json({ 
      success: true,
      message: '重置链接已发送到您的邮箱',
      // 开发环境可以返回 token，生产环境应该移除
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    console.error('密码重置请求失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 重置密码（使用 token）
// ========================================
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: '请提供重置 token 和新密码' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '密码长度至少6位' });
  }
  
  try {
    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.purpose !== 'reset-password') {
      return res.status(400).json({ error: '无效的重置 token' });
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    const result = await db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, decoded.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    console.log('🟢 密码重置成功，用户 ID:', decoded.id);
    res.json({ 
      success: true,
      message: '密码重置成功，请使用新密码登录' 
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: '重置链接已过期，请重新申请' });
    }
    console.error('密码重置失败:', error);
    res.status(400).json({ error: '无效的重置 token' });
  }
});

module.exports = router;
