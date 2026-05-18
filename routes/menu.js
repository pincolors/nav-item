// routes/menu.js
const express = require('express');
const { db } = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// ========================================
// 获取所有菜单（带子菜单）
// ========================================
router.get('/', async (req, res) => {
  try {
    const menus = await db.query('SELECT * FROM menus ORDER BY order_num');
    
    // 🔥 启用子菜单查询（现在数据库表结构正确了）
    for (let menu of menus) {
      try {
        const subMenus = await db.query(
          'SELECT * FROM sub_menus WHERE menu_id = ? ORDER BY order_num',
          [menu.id]
        );
        menu.sub_menus = subMenus || [];
      } catch (subErr) {
        // 如果子菜单查询失败，设置为空数组（不影响主功能）
        console.warn(`⚠️ 菜单 ${menu.id} 子菜单查询失败:`, subErr.message);
        menu.sub_menus = [];
      }
    }
    
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

// ========================================
// 🔥 新增：创建子菜单（需要认证）
// ========================================
router.post('/:menuId/sub', auth, async (req, res) => {
  console.log('==================== 创建子菜单 ====================');
  console.log('🔵 菜单ID:', req.params.menuId);
  console.log('🔵 请求数据:', req.body);
  
  const { name, order_num } = req.body;
  const menuId = req.params.menuId;
  
  if (!name) {
    return res.status(400).json({ error: '子菜单名称不能为空' });
  }
  
  try {
    const result = await db.run(
      'INSERT INTO sub_menus (menu_id, name, order_num) VALUES (?, ?, ?)',
      [menuId, name, order_num || 0]
    );
    
    console.log('🟢 创建成功，ID:', result.lastID);
    console.log('====================');
    
    res.json({ id: result.lastID });
  } catch (error) {
    console.error('❌ 创建子菜单失败:', error);
    console.error('====================');
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 🔥 新增：获取指定菜单的子菜单
// ========================================
router.get('/:menuId/sub', async (req, res) => {
  try {
    const subMenus = await db.query(
      'SELECT * FROM sub_menus WHERE menu_id = ? ORDER BY order_num',
      [req.params.menuId]
    );
    res.json(subMenus);
  } catch (error) {
    console.error('❌ 获取子菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 🔥 新增：更新子菜单（需要认证）
// ========================================
router.put('/sub/:id', auth, async (req, res) => {
  const { name, order_num } = req.body;
  
  try {
    const result = await db.run(
      'UPDATE sub_menus SET name=?, order_num=? WHERE id=?',
      [name, order_num, req.params.id]
    );
    res.json({ changed: result.changes });
  } catch (error) {
    console.error('❌ 更新子菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 🔥 新增：删除子菜单（需要认证）
// ========================================
router.delete('/sub/:id', auth, async (req, res) => {
  try {
    const result = await db.run('DELETE FROM sub_menus WHERE id=?', [req.params.id]);
    res.json({ deleted: result.changes });
  } catch (error) {
    console.error('❌ 删除子菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
