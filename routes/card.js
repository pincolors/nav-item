// routes/card.js
const express = require('express');
const { db } = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// ========================================
// 获取指定菜单的卡片
// ========================================
router.get('/:menuId', async (req, res) => {
  const { menuId } = req.params;
  const { subMenuId } = req.query;
  
  console.log('==================== 获取卡片 ====================');
  console.log('🔵 菜单ID:', menuId);
  console.log('🔵 子菜单ID:', subMenuId);
  
  try {
    let sql, params;
    
    if (subMenuId) {
      sql = 'SELECT * FROM cards WHERE menu_id = ? AND sub_menu_id = ? ORDER BY "order"';
      params = [menuId, subMenuId];
    } else {
      // 🔥 关键：使用带引号的 "order"
      sql = 'SELECT * FROM cards WHERE menu_id = ? ORDER BY "order"';
      params = [menuId];
    }
    
    console.log('🔵 SQL:', sql);
    console.log('🔵 参数:', params);
    
    const cards = await db.query(sql, params);
    
    console.log(`🟢 返回 ${cards.length} 张卡片`);
    console.log('====================');
    
    res.json(cards);
  } catch (error) {
    console.error('❌ 获取卡片失败:', error);
    console.error('====================');
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 创建卡片（需要认证）
// ========================================
router.post('/', auth, async (req, res) => {
  console.log('==================== 创建卡片 ====================');
  console.log('🔵 请求数据:', req.body);
  
  const { menu_id, sub_menu_id, title, url, logo_url, desc, order } = req.body;
  
  if (!menu_id || !title || !url) {
    return res.status(400).json({ error: '菜单ID、标题和URL不能为空' });
  }
  
  try {
    // 🔥 使用带引号的 "order"
    const result = await db.run(
      'INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, "desc", "order") VALUES (?, ?, ?, ?, ?, ?, ?)',
      [menu_id, sub_menu_id || null, title, url, logo_url || null, desc || null, order || 0]
    );
    
    console.log('🟢 创建成功，ID:', result.lastID);
    console.log('====================');
    
    res.json({ id: result.lastID });
  } catch (error) {
    console.error('❌ 创建卡片失败:', error);
    console.error('====================');
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 更新卡片（需要认证）
// ========================================
router.put('/:id', auth, async (req, res) => {
  const { title, url, logo_url, desc, order } = req.body;
  
  try {
    // 🔥 使用带引号的 "order"
    const result = await db.run(
      'UPDATE cards SET title=?, url=?, logo_url=?, "desc"=?, "order"=? WHERE id=?',
      [title, url, logo_url, desc, order, req.params.id]
    );
    res.json({ changed: result.changes });
  } catch (error) {
    console.error('❌ 更新卡片失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 删除卡片（需要认证）
// ========================================
router.delete('/:id', auth, async (req, res) => {
  console.log('==================== 删除卡片 ====================');
  console.log('🔵 卡片ID:', req.params.id);
  
  try {
    const result = await db.run('DELETE FROM cards WHERE id=?', [req.params.id]);
    
    console.log('🟢 删除成功，影响行数:', result.changes);
    console.log('====================');
    
    res.json({ deleted: result.changes });
  } catch (error) {
    console.error('❌ 删除卡片失败:', error);
    console.error('====================');
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 卡片排序（需要认证）
// ========================================
router.post('/sort', auth, async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  
  try {
    await db.transaction(async () => {
      for (let i = 0; i < ids.length; i++) {
        // 🔥 使用带引号的 "order"
        await db.run('UPDATE cards SET "order" = ? WHERE id = ?', [i, ids[i]]);
      }
    });
    
    res.json({ message: '顺序保存成功' });
  } catch (error) {
    console.error('❌ 卡片排序失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
