// routes/menu.js
const express = require('express');
const { db } = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// === 获取所有菜单及其子菜单 ===
router.get('/', async (req, res) => {
  try {
    const menus = await db.query('SELECT * FROM menus ORDER BY order_num');
    
    // 获取每个菜单的子菜单
    for (let menu of menus) {
      const subMenus = await db.query('SELECT * FROM sub_menus WHERE menu_id = ? ORDER BY order_num', [menu.id]);
      menu.sub_menus = subMenus;
    }
    
    res.json(menus);
  } catch (error) {
    console.error('获取菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 创建菜单 ===
router.post('/', auth, async (req, res) => {
  const { name, order_num, is_public } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '菜单名称不能为空' });
  }
  
  try {
    const result = await db.run(
      'INSERT INTO menus (name, order_num, is_public) VALUES (?, ?, ?)',
      [name, order_num || 0, is_public !== undefined ? is_public : 1]
    );
    res.json({ id: result.lastID });
  } catch (error) {
    console.error('创建菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 更新菜单 ===
router.put('/:id', auth, async (req, res) => {
  const { name, order_num, is_public } = req.body;
  
  try {
    const result = await db.run(
      'UPDATE menus SET name=?, order_num=?, is_public=? WHERE id=?',
      [name, order_num, is_public, req.params.id]
    );
    res.json({ changed: result.changes });
  } catch (error) {
    console.error('更新菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 删除菜单 ===
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.run('DELETE FROM menus WHERE id=?', [req.params.id]);
    res.json({ deleted: result.changes });
  } catch (error) {
    console.error('删除菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 菜单排序 ===
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
    console.error('菜单排序失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 创建子菜单 ===
router.post('/:menuId/sub', auth, async (req, res) => {
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
    res.json({ id: result.lastID });
  } catch (error) {
    console.error('创建子菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 更新子菜单 ===
router.put('/sub/:id', auth, async (req, res) => {
  const { name, order_num } = req.body;
  
  try {
    const result = await db.run(
      'UPDATE sub_menus SET name=?, order_num=? WHERE id=?',
      [name, order_num, req.params.id]
    );
    res.json({ changed: result.changes });
  } catch (error) {
    console.error('更新子菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 删除子菜单 ===
router.delete('/sub/:id', auth, async (req, res) => {
  try {
    const result = await db.run('DELETE FROM sub_menus WHERE id=?', [req.params.id]);
    res.json({ deleted: result.changes });
  } catch (error) {
    console.error('删除子菜单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
