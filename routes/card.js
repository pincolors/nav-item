// routes/card.js
const express = require('express');
const { db } = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// ========================================
// 卡片排序接口（必须放在 /:menuId 之前）
// ========================================
router.post('/sort', auth, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  try {
    // 使用事务批量更新
    await db.transaction(async () => {
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

// ========================================
// 获取指定菜单的卡片
// ========================================
router.get('/:menuId', async (req, res) => {
  const { subMenuId } = req.query;
  let query, params;
  
  try {
    if (subMenuId) {
      // 获取指定子菜单的卡片
      query = 'SELECT * FROM cards WHERE sub_menu_id = ? ORDER BY "order"';
      params = [subMenuId];
    } else {
      // 获取主菜单的卡片（不包含子菜单的卡片）
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

// ========================================
// 获取所有卡片（带菜单信息）
// ========================================
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        cards.*,
        menus.name as menu_name,
        sub_menus.name as sub_menu_name
      FROM cards
      LEFT JOIN menus ON cards.menu_id = menus.id
      LEFT JOIN sub_menus ON cards.sub_menu_id = sub_menus.id
      ORDER BY cards."order"
    `;
    
    const rows = await db.query(query, []);
    
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
    console.error('获取所有卡片失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 新增卡片
// ========================================
router.post('/', auth, async (req, res) => {
  console.log('==================== 新增卡片 ====================');
  console.log('🔵 完整请求体:', JSON.stringify(req.body, null, 2));
  
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc } = req.body;
  
  // 验证必填字段
  if (!title || !url) {
    console.error('❌ 缺少必填字段');
    return res.status(400).json({ error: '标题和 URL 不能为空' });
  }
  
  if (!menu_id) {
    console.error('❌ 缺少菜单 ID');
    return res.status(400).json({ error: '必须指定所属菜单' });
  }
  
  // 兼容 order 和 sort_order
  const order = req.body.order !== undefined ? req.body.order : (req.body.sort_order || 0);
  
  console.log('🔵 menu_id:', menu_id);
  console.log('🔵 sub_menu_id:', sub_menu_id);
  console.log('🔵 title:', title);
  console.log('🔵 url:', url);
  console.log('🔵 使用 order 值:', order);
  
  const sql = `
    INSERT INTO cards 
    (menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, "order") 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    menu_id, 
    sub_menu_id || null, 
    title, 
    url, 
    logo_url || '', 
    custom_logo_path || '', 
    desc || '', 
    order
  ];
  
  console.log('🔵 SQL:', sql);
  console.log('🔵 参数:', params);
  
  try {
    const result = await db.run(sql, params);
    const insertId = result.lastID;
    console.log('🟢 新增成功，ID:', insertId);
    
    // 返回完整数据
    const row = await db.get('SELECT * FROM cards WHERE id = ?', [insertId]);
    
    // 处理图标 URL
    if (row) {
      if (!row.custom_logo_path) {
        row.display_logo = row.logo_url || (row.url.replace(/\/+$/, '') + '/favicon.ico');
      } else {
        row.display_logo = '/uploads/' + row.custom_logo_path;
      }
    }
    
    console.log('🟢 返回数据:', row);
    console.log('====================');
    res.json({ id: insertId, data: row });
  } catch (error) {
    console.error('新增卡片失败:', error.message);
    console.error('完整错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 修改卡片
// ========================================
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
    
    const sql = `
      UPDATE cards 
      SET menu_id=?, sub_menu_id=?, title=?, url=?, logo_url=?, custom_logo_path=?, desc=?, "order"=? 
      WHERE id=?
    `;
    const params = [
      menu_id, 
      sub_menu_id || null, 
      title, 
      url, 
      logo_url || '', 
      custom_logo_path || '', 
      desc || '', 
      order, 
      cardId
    ];
    
    console.log('🔵 SQL:', sql);
    console.log('🔵 参数:', params);
    
    const result = await db.run(sql, params);
    console.log('🟢 更新成功，影响行数:', result.changes);
    
    if (result.changes === 0) {
      console.warn('⚠️ 警告：没有更新任何记录！');
    }
    
    // 返回更新后的完整数据
    const row = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
    
    // 处理图标 URL
    if (row) {
      if (!row.custom_logo_path) {
        row.display_logo = row.logo_url || (row.url.replace(/\/+$/, '') + '/favicon.ico');
      } else {
        row.display_logo = '/uploads/' + row.custom_logo_path;
      }
    }
    
    console.log('🟢 编辑后数据:', row);
    console.log('====================');
    res.json({ changed: result.changes, data: row });
  } catch (error) {
    console.error('更新失败:', error.message);
    console.error('完整错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 批量更新卡片顺序（替代方案）
// ========================================
router.post('/batch-update-order', auth, async (req, res) => {
  const { updates } = req.body; // [{ id: 1, order: 0 }, { id: 2, order: 1 }, ...]
  
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  
  try {
    await db.transaction(async () => {
      for (const update of updates) {
        await db.run('UPDATE cards SET "order" = ? WHERE id = ?', [update.order, update.id]);
      }
    });
    
    res.json({ message: '批量更新成功', count: updates.length });
  } catch (error) {
    console.error('批量更新失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 删除卡片
// ========================================
router.delete('/:id', auth, async (req, res) => {
  const cardId = parseInt(req.params.id);
  console.log('🔵 删除卡片 ID:', cardId);
  
  try {
    // 先获取卡片信息（用于日志）
    const card = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
    if (!card) {
      console.error('❌ 未找到卡片 ID:', cardId);
      return res.status(404).json({ error: '卡片不存在' });
    }
    
    console.log('🟡 删除的卡片:', card);
    
    // 删除卡片
    const result = await db.run('DELETE FROM cards WHERE id=?', [cardId]);
    console.log('🟢 删除成功，影响行数:', result.changes);
    
    // 如果有自定义图标，可以选择删除文件（可选）
    // if (card.custom_logo_path) {
    //   const fs = require('fs');
    //   const filePath = path.join(__dirname, '../uploads', card.custom_logo_path);
    //   if (fs.existsSync(filePath)) {
    //     fs.unlinkSync(filePath);
    //     console.log('🟢 已删除自定义图标文件:', card.custom_logo_path);
    //   }
    // }
    
    res.json({ deleted: result.changes, card });
  } catch (error) {
    console.error('删除失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 批量删除卡片
// ========================================
router.post('/batch-delete', auth, async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  
  try {
    let deletedCount = 0;
    
    await db.transaction(async () => {
      for (const id of ids) {
        const result = await db.run('DELETE FROM cards WHERE id = ?', [id]);
        deletedCount += result.changes;
      }
    });
    
    console.log('🟢 批量删除成功，删除数量:', deletedCount);
    res.json({ message: '批量删除成功', deleted: deletedCount });
  } catch (error) {
    console.error('批量删除失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 获取单个卡片详情
// ========================================
router.get('/detail/:id', async (req, res) => {
  const cardId = parseInt(req.params.id);
  
  try {
    const query = `
      SELECT 
        cards.*,
        menus.name as menu_name,
        sub_menus.name as sub_menu_name
      FROM cards
      LEFT JOIN menus ON cards.menu_id = menus.id
      LEFT JOIN sub_menus ON cards.sub_menu_id = sub_menus.id
      WHERE cards.id = ?
    `;
    
    const card = await db.get(query, [cardId]);
    
    if (!card) {
      return res.status(404).json({ error: '卡片不存在' });
    }
    
    // 处理图标 URL
    if (!card.custom_logo_path) {
      card.display_logo = card.logo_url || (card.url.replace(/\/+$/, '') + '/favicon.ico');
    } else {
      card.display_logo = '/uploads/' + card.custom_logo_path;
    }
    
    res.json(card);
  } catch (error) {
    console.error('获取卡片详情失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 搜索卡片
// ========================================
router.get('/search', async (req, res) => {
  const { keyword } = req.query;
  
  if (!keyword) {
    return res.status(400).json({ error: '请提供搜索关键词' });
  }
  
  try {
    const query = `
      SELECT 
        cards.*,
        menus.name as menu_name,
        sub_menus.name as sub_menu_name
      FROM cards
      LEFT JOIN menus ON cards.menu_id = menus.id
      LEFT JOIN sub_menus ON cards.sub_menu_id = sub_menus.id
      WHERE cards.title LIKE ? OR cards.desc LIKE ? OR cards.url LIKE ?
      ORDER BY cards."order"
    `;
    
    const searchTerm = `%${keyword}%`;
    const rows = await db.query(query, [searchTerm, searchTerm, searchTerm]);
    
    // 处理图标 URL
    rows.forEach(card => {
      if (!card.custom_logo_path) {
        card.display_logo = card.logo_url || (card.url.replace(/\/+$/, '') + '/favicon.ico');
      } else {
        card.display_logo = '/uploads/' + card.custom_logo_path;
      }
    });
    
    res.json({ count: rows.length, results: rows });
  } catch (error) {
    console.error('搜索卡片失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 复制/克隆卡片
// ========================================
router.post('/:id/clone', auth, async (req, res) => {
  const cardId = parseInt(req.params.id);
  
  try {
    // 获取原卡片
    const originalCard = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
    
    if (!originalCard) {
      return res.status(404).json({ error: '原卡片不存在' });
    }
    
    // 创建副本
    const sql = `
      INSERT INTO cards 
      (menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, "order") 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      originalCard.menu_id,
      originalCard.sub_menu_id,
      originalCard.title + ' (副本)',
      originalCard.url,
      originalCard.logo_url,
      originalCard.custom_logo_path,
      originalCard.desc,
      originalCard.order + 1
    ];
    
    const result = await db.run(sql, params);
    const newCard = await db.get('SELECT * FROM cards WHERE id = ?', [result.lastID]);
    
    console.log('🟢 克隆卡片成功，新 ID:', result.lastID);
    res.json({ message: '克隆成功', id: result.lastID, data: newCard });
  } catch (error) {
    console.error('克隆卡片失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 统计信息
// ========================================
router.get('/stats/summary', async (req, res) => {
  try {
    const totalCards = await db.get('SELECT COUNT(*) as count FROM cards');
    const totalMenus = await db.get('SELECT COUNT(*) as count FROM menus');
    const cardsPerMenu = await db.query(`
      SELECT 
        menus.name as menu_name, 
        COUNT(cards.id) as card_count
      FROM menus
      LEFT JOIN cards ON menus.id = cards.menu_id
      GROUP BY menus.id, menus.name
      ORDER BY card_count DESC
    `);
    
    res.json({
      total_cards: totalCards.count,
      total_menus: totalMenus.count,
      cards_per_menu: cardsPerMenu
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
