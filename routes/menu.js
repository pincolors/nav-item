// routes/menu.js
const express = require('express');
const { db } = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// ========================================
// 获取所有菜单（不查询子菜单）
// ========================================
router.get('/', async (req, res) => {
  try {
    const menus = await db.query('SELECT * FROM menus ORDER BY order_num');
    
    // 🔥 完全移除子菜单查询，直接返回菜单
    console.log(`✅ 成功返回 ${menus.length} 个菜单`);
    res.json(menus);
    
  } catch (error) {
    console.error('❌ 获取菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 创建菜单（需要认证）
// ========================================
router.post('/', auth, async (req, res) => {
  console.log('==================== 创建菜单 ====================');
  console.log('🔵 请求数据:', req.body);
  
  const { name, order_num, is_public } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '菜单名称不能为空' });
  }
  
  try {
    const result = await db.run(
      'INSERT INTO menus (name, order_num, is_public) VALUES (?, ?, ?)',
      [name, order_num || 0, is_public !== undefined ? is_public : 1]
    );
    
    console.log('🟢 创建成功，ID:', result.lastID);
    console.log('====================');
    
    res.json({ 
      id: result.lastID,
      name,
      order_num: order_num || 0,
      is_public: is_public !== undefined ? is_public : 1
    });
  } catch (error) {
    console.error('❌ 创建菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 更新菜单（需要认证）
// ========================================
router.put('/:id', auth, async (req, res) => {
  const { name, order_num, is_public } = req.body;
  
  try {
    const result = await db.run(
      'UPDATE menus SET name=?, order_num=?, is_public=? WHERE id=?',
      [name, order_num, is_public, req.params.id]
    );
    res.json({ changed: result.changes });
  } catch (error) {
    console.error('❌ 更新菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 删除菜单（需要认证）
// ========================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.run('DELETE FROM menus WHERE id=?', [req.params.id]);
    res.json({ deleted: result.changes });
  } catch (error) {
    console.error('❌ 删除菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 菜单排序（需要认证）
// ========================================
router.post('/sort', auth, async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  
  try {
    await db.transaction(async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.run('UPDATE menus SET order_num = ? WHERE id = ?', [i, ids[i]]);
      }
    });
    
    res.json({ message: '顺序保存成功' });
  } catch (error) {
    console.error('❌ 菜单排序失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
