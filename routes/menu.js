const express = require('express');
const db = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// === 【新增】菜单排序接口 (必须放在 /:id 之前) ===
router.post('/sort', auth, (req, res) => {
  const { ids } = req.body; // 前端传来的 ID 数组

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare('UPDATE menus SET "order" = ? WHERE id = ?');
    ids.forEach((id, index) => {
      stmt.run(index, id);
    });
    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: '菜单顺序保存成功' });
    });
  });
});

// 获取所有菜单
router.get('/', (req, res) => {
  // 记得按 order 排序返回
  db.all('SELECT * FROM menus ORDER BY "order"', [], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// 新增菜单
router.post('/', auth, (req, res) => {
  const { name, order } = req.body;
  db.run('INSERT INTO menus (name, "order") VALUES (?, ?)', 
    [name, order || 0], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ id: this.lastID });
  });
});

// 修改菜单
router.put('/:id', auth, (req, res) => {
  const { name, order } = req.body;
  db.run('UPDATE menus SET name=?, "order"=? WHERE id=?', 
    [name, order || 0, req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ changed: this.changes });
  });
});

// 删除菜单
router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM menus WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
