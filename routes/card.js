const express = require('express');
const db = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// === 【新增】卡片排序接口 (必须放在 /:menuId 之前) ===
router.post('/sort', auth, (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare('UPDATE cards SET "order" = ? WHERE id = ?');
    
    ids.forEach((id, index) => {
      stmt.run(index, id);
    });

    stmt.finalize();

    db.run("COMMIT", (err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: '顺序保存成功' });
    });
  });
});

// 获取指定菜单的卡片
router.get('/:menuId', (req, res) => {
  const { subMenuId } = req.query;
  let query, params;
  
  if (subMenuId) {
    query = 'SELECT * FROM cards WHERE sub_menu_id = ? ORDER BY "order"';
    params = [subMenuId];
  } else {
    query = 'SELECT * FROM cards WHERE menu_id = ? AND sub_menu_id IS NULL ORDER BY "order"';
    params = [req.params.menuId];
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    rows.forEach(card => {
      if (!card.custom_logo_path) {
        card.display_logo = card.logo_url || (card.url.replace(/\/+$/, '') + '/favicon.ico');
      } else {
        card.display_logo = '/uploads/' + card.custom_logo_path;
      }
    });
    res.json(rows);
  });
});

// ========================================
// 新增卡片接口
// ========================================
router.post('/', auth, (req, res) => {
  console.log('==================== 新增卡片 ====================');
  console.log('🔵 完整请求体:', JSON.stringify(req.body, null, 2));
  
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc } = req.body;
  
  // ✅ 验证必填字段
  if (!title || !url) {
    console.error('❌ 缺少必填字段');
    return res.status(400).json({ error: '标题和 URL 不能为空' });
  }
  
  // ✅ 兼容 order 和 sort_order
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
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('❌ 新增失败:', err.message);
      console.error('❌ 完整错误:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const insertId = this.lastID;
    console.log('🟢 新增成功，ID:', insertId);
    
    // ✅ 返回完整数据
    db.get('SELECT * FROM cards WHERE id = ?', [insertId], (err, row) => {
      if (err) {
        console.error('❌ 查询新增数据失败:', err.message);
        return res.json({ id: insertId });
      }
      console.log('🟢 返回数据:', row);
      console.log('====================');
      res.json({ id: insertId, data: row });
    });
  });
});

// ========================================
// 修改卡片接口
// ========================================
router.put('/:id', auth, (req, res) => {
  console.log('==================== 修改卡片 ====================');
  console.log('🔵 卡片 ID:', req.params.id);
  console.log('🔵 完整请求体:', JSON.stringify(req.body, null, 2));
  
  const cardId = parseInt(req.params.id);  // ✅ 确保 ID 是数字
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc } = req.body;
  
  // ✅ 验证必填字段
  if (!title || !url) {
    console.error('❌ 缺少必填字段');
    return res.status(400).json({ error: '标题和 URL 不能为空' });
  }
  
  // ✅ 兼容 order 和 sort_order
  const order = req.body.order !== undefined ? req.body.order : (req.body.sort_order || 0);
  
  console.log('🔵 使用 order 值:', order);
  
  // ✅ 先查询原始数据（用于调试）
  db.get('SELECT * FROM cards WHERE id = ?', [cardId], (err, oldRow) => {
    if (err) {
      console.error('❌ 查询原始数据失败:', err.message);
    } else if (!oldRow) {
      console.error('❌ 未找到 ID 为', cardId, '的卡片');
      return res.status(404).json({ error: '卡片不存在' });
    } else {
      console.log('🟡 编辑前数据:', oldRow);
    }
    
    const sql = 'UPDATE cards SET menu_id=?, sub_menu_id=?, title=?, url=?, logo_url=?, custom_logo_path=?, desc=?, "order"=? WHERE id=?';
    const params = [menu_id, sub_menu_id || null, title, url, logo_url || '', custom_logo_path || '', desc || '', order, cardId];
    
    console.log('🔵 SQL:', sql);
    console.log('🔵 参数:', params);
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('❌ 更新失败:', err.message);
        console.error('❌ 完整错误:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('🟢 更新成功，影响行数:', this.changes);
      
      // ✅ 如果影响行数为 0，说明没有更新任何数据
      if (this.changes === 0) {
        console.warn('⚠️ 警告：没有更新任何记录！可能 ID 不存在');
      }
      
      // ✅ 返回更新后的完整数据
      db.get('SELECT * FROM cards WHERE id = ?', [cardId], (err, row) => {
        if (err) {
          console.error('❌ 查询更新后数据失败:', err.message);
          return res.json({ changed: this.changes });
        }
        console.log('🟢 编辑后数据:', row);
        console.log('====================');
        res.json({ changed: this.changes, data: row });
      });
    });
  });
});

// 删除卡片
router.delete('/:id', auth, (req, res) => {
  const cardId = parseInt(req.params.id);
  console.log('🔵 删除卡片 ID:', cardId);
  
  db.run('DELETE FROM cards WHERE id=?', [cardId], function(err) {
    if (err) {
      console.error('❌ 删除失败:', err.message);
      return res.status(500).json({error: err.message});
    }
    console.log('🟢 删除成功，影响行数:', this.changes);
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
