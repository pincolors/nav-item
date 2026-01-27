const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. 获取所有菜单
router.get('/', (req, res) => {
  db.all("SELECT * FROM menus ORDER BY `order` ASC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 2. 添加菜单
router.post('/', (req, res) => {
  const { name, order } = req.body;
  const menuOrder = order || 99;
  const sql = "INSERT INTO menus (name, `order`) VALUES (?, ?)";
  db.run(sql, [name, menuOrder], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name, order: menuOrder });
  });
});

// 3. 删除菜单
router.delete('/:id', (req, res) => {
  const menuId = req.params.id;
  db.run("DELETE FROM cards WHERE menu_id = ?", [menuId], (err) => {
    if (err) console.error(err);
    db.run("DELETE FROM menus WHERE id = ?", [menuId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: "deleted", changes: this.changes });
    });
  });
});

// 4. 排序接口
router.post('/sort', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "Invalid data" });
  }
  const stmt = db.prepare("UPDATE menus SET `order` = ? WHERE id = ?");
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    try {
      ids.forEach((id, index) => {
        stmt.run(index, id);
      });
      db.run("COMMIT");
      res.json({ message: "Sorted" });
    } catch (e) {
      db.run("ROLLBACK");
      res.status(500).json({ error: e.message });
    }
    stmt.finalize();
  });
});

module.exports = router;
