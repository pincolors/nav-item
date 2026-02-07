const express = require('express');
const db = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// === 【新增】卡片排序接口 (必须放在 /:menuId 之前) ===
router.post('/sort', auth, (req, res) => {
  const { ids } = req.body; // 前端传来的 ID 数组: [5, 2, 8, ...]

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  // 使用 serialize 确保串行执行，避免并发锁死
  db.serialize(() => {
    // 开启事务 (可选，但推荐)
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare('UPDATE cards SET "order" = ? WHERE id = ?');
    
    ids.forEach((id, index) => {
      // index 就是新的序号 (0, 1, 2...)
      stmt.run(index, id);
    });

    stmt.finalize();

    db.run("COMMIT", (err) => {
      if (err) {
        // 如果出错，尝试回滚
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
    // 获取指定子菜单的卡片
    query = 'SELECT * FROM cards WHERE sub_menu_id = ? ORDER BY "order"';
    params = [subMenuId];
  } else {
    // 获取主菜单的卡片（不包含子菜单的卡片）
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
// 🔥🔥🔥 修改这里：新增卡片接口 🔥🔥🔥
// ========================================
router.post('/', auth, (req, res) => {
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc } = req.body;
  
  // ✅ 兼容 order 和 sort_order 两种字段名
  const order = req.body.order !== undefined ? req.body.order : (req.body.sort_order || 0);
  
  console.log('🔵 新增卡片:', req.body);
  console.log('🔵 使用 order 值:', order);
  
  db.run(
    'INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [menu_id, sub_menu_id || null, title, url, logo_url, custom_logo_path, desc, order], 
    function(err) {
      if (err) {
        console.error('❌ 新增失败:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('🟢 新增成功，ID:', this.lastID);
      
      // ✅ 返回完整数据
      db.get('SELECT * FROM cards WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.json({ id: this.lastID });
        }
        res.json({ id: this.lastID, data: row });
      });
    }
  );
});

// ========================================
// 🔥🔥🔥 修改这里：修改卡片接口 🔥🔥🔥
// ========================================
router.put('/:id', auth, (req, res) => {
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc } = req.body;
  
  // ✅ 兼容 order 和 sort_order 两种字段名
  const order = req.body.order !== undefined ? req.body.order : (req.body.sort_order || 0);
  
  console.log('🔵 更新卡片 ID:', req.params.id);
  console.log('🔵 接收数据:', req.body);
  console.log('🔵 使用 order 值:', order);
  
  db.run(
    'UPDATE cards SET menu_id=?, sub_menu_id=?, title=?, url=?, logo_url=?, custom_logo_path=?, desc=?, "order"=? WHERE id=?', 
    [menu_id, sub_menu_id || null, title, url, logo_url, custom_logo_path, desc, order, req.params.id], 
    function(err) {
      if (err) {
        console.error('❌ 更新失败:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('🟢 更新成功，影响行数:', this.changes);
      
      // ✅ 返回更新后的完整数据
      db.get('SELECT * FROM cards WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
          return res.json({ changed: this.changes });
        }
        res.json({ changed: this.changes, data: row });
      });
    }
  );
});

// 删除卡片（保持不变）
router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM cards WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
