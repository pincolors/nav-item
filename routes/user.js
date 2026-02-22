// routes/user.js
const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../db');
const authMiddleware = require('./authMiddleware');

const router = express.Router();

// ========================================
// 获取当前用户信息
// ========================================
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, username FROM users WHERE id = ?', 
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json({ data: user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ========================================
// 获取当前用户详细信息（包括登录信息）
// ========================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, username, last_login_time, last_login_ip FROM users WHERE id = ?', 
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      last_login_time: user.last_login_time,
      last_login_ip: user.last_login_ip
    });
  } catch (error) {
    console.error('获取用户详细信息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ========================================
// 修改密码
// ========================================
router.put('/password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  // 输入验证
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: '请提供旧密码和新密码' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: '新密码长度至少6位' });
  }
  
  try {
    // 获取当前用户
    const user = await db.get(
      'SELECT password FROM users WHERE id = ?', 
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: '旧密码错误' });
    }
    
    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    const result = await db.run(
      'UPDATE users SET password = ? WHERE id = ?', 
      [newPasswordHash, req.user.id]
    );
    
    if (result.changes === 0) {
      return res.status(500).json({ message: '密码更新失败' });
    }
    
    console.log('🟢 用户 ID', req.user.id, '密码修改成功');
    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ========================================
// 获取所有用户（管理员功能）
// ========================================
router.get('/', authMiddleware, async (req, res) => {
  const { page, pageSize } = req.query;
  
  try {
    // 不分页查询
    if (!page && !pageSize) {
      const users = await db.query('SELECT id, username FROM users');
      return res.json({ data: users });
    }
    
    // 分页查询
    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * size;
    
    // 获取总数
    const countRow = await db.get('SELECT COUNT(*) as total FROM users');
    const total = countRow.total;
    
    // 获取分页数据
    const users = await db.query(
      'SELECT id, username FROM users LIMIT ? OFFSET ?', 
      [size, offset]
    );
    
    res.json({
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size),
      data: users
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ========================================
// 创建新用户（管理员功能）
// ========================================
router.post('/', authMiddleware, async (req, res) => {
  const { username, password } = req.body;
  
  // 输入验证
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }
  
  if (username.length < 3) {
    return res.status(400).json({ message: '用户名长度至少3位' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: '密码长度至少6位' });
  }
  
  try {
    // 检查用户名是否已存在
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ?', 
      [username]
    );
    
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建用户
    const result = await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)', 
      [username, passwordHash]
    );
    
    console.log('🟢 新用户创建成功，ID:', result.lastID);
    res.json({ 
      message: '用户创建成功', 
      data: { 
        id: result.lastID, 
        username 
      } 
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ========================================
// 获取单个用户信息（管理员功能）
// ========================================
router.get('/:id', authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id);
  
  try {
    const user = await db.get(
      'SELECT id, username, last_login_time, last_login_ip, created_at FROM users WHERE id = ?', 
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json({ data: user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ========================================
// 更新用户信息（管理员功能）
// ========================================
router.put('/:id', authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id);
  const { username, password } = req.body;
  
  // 不能修改自己的账号（可选限制）
  if (userId === req.user.id) {
    return res.status(403).json({ message: '不能修改自己的账号，请使用修改密码接口' });
  }
  
  try {
    // 检查用户是否存在
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 构建更新语句
    const updates = [];
    const params = [];
    
    if (username) {
      // 检查用户名是否被占用
      const existingUser = await db.get(
        'SELECT id FROM users WHERE username = ? AND id != ?', 
        [username, userId]
      );
      if (existingUser) {
        return res.status(400).json({ message: '用户名已存在' });
      }
      updates.push('username = ?');
      params.push(username);
    }
    
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: '密码长度至少6位' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(passwordHash);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: '没有要更新的内容' });
    }
    
    params.push(userId);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    const result = await db.run(sql, params);
    
    if (result.changes === 0) {
      return res.status(500).json({ message: '更新失败' });
    }
    
    console.log('🟢 用户 ID', userId, '信息更新成功');
    res.json({ message: '用户信息更新成功' });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ========================================
// 删除用户（管理员功能）
// ========================================
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id);
  
  // 不能删除自己的账号
  if (userId === req.user.id) {
    return res.status(403).json({ message: '不能删除自己的账号' });
  }
  
  try {
    // 检查用户是否存在
    const user = await db.get('SELECT id, username FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 删除用户
    const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.changes === 0) {
      return res.status(500).json({ message: '删除失败' });
    }
    
    console.log('🟢 用户 ID', userId, '(', user.username, ') 已删除');
    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ========================================
// 搜索用户（管理员功能）
// ========================================
router.get('/search', authMiddleware, async (req, res) => {
  const { keyword } = req.query;
  
  if (!keyword) {
    return res.status(400).json({ message: '请提供搜索关键词' });
  }
  
  try {
    const users = await db.query(
      'SELECT id, username, last_login_time FROM users WHERE username LIKE ?', 
      [`%${keyword}%`]
    );
    
    res.json({ 
      count: users.length, 
      data: users 
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ========================================
// 用户统计信息（管理员功能）
// ========================================
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const activeUsers = await db.get(
      `SELECT COUNT(*) as count FROM users 
       WHERE last_login_time > datetime('now', '-30 days')`
    );
    
    res.json({
      total_users: totalUsers.count,
      active_users_30d: activeUsers.count,
      inactive_users: totalUsers.count - activeUsers.count
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ========================================
// 批量删除用户（管理员功能）
// ========================================
router.post('/batch-delete', authMiddleware, async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Invalid data format' });
  }
  
  // 不能删除自己
  if (ids.includes(req.user.id)) {
    return res.status(403).json({ message: '不能删除自己的账号' });
  }
  
  try {
    let deletedCount = 0;
    
    await db.transaction(async () => {
      for (const id of ids) {
        const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
        deletedCount += result.changes;
      }
    });
    
    console.log('🟢 批量删除用户成功，删除数量:', deletedCount);
    res.json({ 
      message: '批量删除成功', 
      deleted: deletedCount 
    });
  } catch (error) {
    console.error('批量删除用户失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
