// routes/card.js
const express = require('express');
const { db } = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// === 卡片排序接口 ===
router.post('/sort', auth, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  try {
    // 使用事务批量更新
    await db.transaction(async (client) => {
      for (let i = 0; i < ids.length; i++) {
        await db.run('UPDATE cards SET "order" = ? WHERE id = ?', [i, ids[i]]);
      }
    });

    res.json({ message: '顺序保存成功' });
  } catch (error) {
    console.error('排序失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 获取指定菜单的卡片 ===
router.get('/:menuId', async (req, res) => {
  const { subMenuId } = req.query;
  let query, params;
  
  try {
    if (subMenuId) {
      query = 'SELECT * FROM cards WHERE sub_menu_id = ? ORDER BY "order"';
      params = [subMenuId];
    } else {
      query = 'SELECT * FROM cards WHERE menu_id = ? AND sub_menu_id IS NULL ORDER BY "order"';
      params = [req.params.menuId];
    }
    
    const rows = await db.query(query, params);
    
    // 处理图标 URL
    rows.forEach(card => {
      if (!card.custom_logo_path) {
        card.display_logo = card.logo_url || (card.url.replace(/\/+$/, '') + '/favicon.ico');
      } else {
        card.display_logo = '/uploads/' + card.custom_logo_path;
      }
    });
    
    res.json(rows);
  } catch (error) {
    console.error('获取卡片失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 新增卡片 ===
router.post('/', auth, async (req, res) => {
  console.log('==================== 新增卡片 ====================');
  console.log('🔵 完整请求体:', JSON.stringify(req.body, null, 2));
  
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc } = req.body;
  
  // 验证必填字段
  if (!title || !url) {
    console.error('❌ 缺少必填字段');
    return res.status(400).json({ error: '标题和 URL 不能为空' });
  }
  
  // 兼容 order 和 sort_order
  const order = req.body.order !== undefined ? req.body.order : (req.body.sort_order || 0);
  
  console.log('🔵 menu_id:', menu_id);
  console.log('🔵 sub_menu_id:', sub_menu_id);
  console.log('🔵 title:', title);
  console.log('🔵 url:', url);
  console.log('🔵 使用 order 值:', order);
  
  const sql = 'INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const params = [menu_id, sub_menu_id || null, title, url, logo_url || '', custom_logo_path || '', desc || '', order];
  
  console.log('🔵 SQL:', sql);
  console.log('🔵 参数:', params);
  
  try {
    const result = await db.run(sql, params);
    const insertId = result.lastID;
    console.log('🟢 新增成功，ID:', insertId);
    
    // 返回完整数据
    const row = await db.get('SELECT * FROM cards WHERE id = ?', [insertId]);
    console.log('🟢 返回数据:', row);
    console.log('====================');
    res.json({ id: insertId, data: row });
  } catch (error) {
    console.error('新增卡片失败:', error.message);
    console.error('完整错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 修改卡片 ===
router.put('/:id', auth, async (req, res) => {
  console.log('==================== 修改卡片 ====================');
  console.log('🔵 卡片 ID:', req.params.id);
  console.log('🔵 完整请求体:', JSON.stringify(req.body, null, 2));
  
  const cardId = parseInt(req.params.id);
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc } = req.body;
  
  // 验证必填字段
  if (!title || !url) {
    console.error('❌ 缺少必填字段');
    return res.status(400).json({ error: '标题和 URL 不能为空' });
  }
  
  // 兼容 order 和 sort_order
  const order = req.body.order !== undefined ? req.body.order : (req.body.sort_order || 0);
  
  console.log('🔵 使用 order 值:', order);
  
  try {
    // 先查询原始数据
    const oldRow = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
    if (!oldRow) {
      console.error('❌ 未找到 ID 为', cardId, '的卡片');
      return res.status(404).json({ error: '卡片不存在' });
    }
    console.log('🟡 编辑前数据:', oldRow);
    
    const sql = 'UPDATE cards SET menu_id=?, sub_menu_id=?, title=?, url=?, logo_url=?, custom_logo_path=?, desc=?, "order"=? WHERE id=?';
    const params = [menu_id, sub_menu_id || null, title, url, logo_url || '', custom_logo_path || '', desc || '', order, cardId];
    
    console.log('🔵 SQL:', sql);
    console.log('🔵 参数:', params);
    
    const result = await db.run(sql, params);
    console.log('🟢 更新成功，影响行数:', result.changes);
    
    if (result.changes === 0) {
      console.warn('⚠️ 警告：没有更新任何记录！');
    }
    
    // 返回更新后的完整数据
    const row = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
    console.log('🟢 编辑后数据:', row);
    console.log('====================');
    res.json({ changed: result.changes, data: row });
  } catch (error) {
    console.error('更新失败:', error.message);
    console.error('完整错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 删除卡片 ===
router.delete('/:id', auth, async (req, res) => {
  const cardId = parseInt(req.params.id);
  console.log('🔵 删除卡片 ID:', cardId);
  
  try {
    const result = await db.run('DELETE FROM cards WHERE id=?', [cardId]);
    console.log('🟢 删除成功，影响行数:', result.changes);
    res.json({ deleted: result.changes });
  } catch (error) {
    console.error('删除失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
