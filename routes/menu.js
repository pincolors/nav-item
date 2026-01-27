const express = require('express');
const router = express.Router();
const db = require('../db'); // 确保这里指向你的数据库连接文件

// 1. 获取所有菜单 (按 order 排序)
router.get('/', (req, res) => {
  db.all("SELECT * FROM menus ORDER BY `order` ASC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 2. 添加新菜单
router.post('/', (req, res) => {
  const { name, order } = req.body;
  // 如果没有传 order，默认设为 99
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

// 3. 删除菜单 (以及它下面的卡片)
router.delete('/:id', (req, res) => {
  const menuId = req.params.id;
  
  // 先删除该菜单下的卡片 (可选，保持数据干净)
  db.run("DELETE FROM cards WHERE menu_id = ?", [menuId], (err) => {
    if (err) {
      console.error('删除关联卡片失败:', err);
      // 继续尝试删除菜单
    }
    
    // 删除菜单
    db.run("DELETE FROM menus WHERE id = ?", [menuId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: "deleted", changes: this.changes });
    });
  });
});

// 4. 更新菜单排序 (修复 No health upstream 的关键接口)
router.post('/sort', (req, res) => {
  const { ids } = req.body; // 前端传过来一个 id 数组 [1, 5, 2]
  
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  // 使用事务或者逐个更新
  const stmt = db.prepare("UPDATE menus SET `order` = ? WHERE id = ?");
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    try {
      ids.forEach((id, index) => {
        stmt.run(index, id);
      });
      db.run("COMMIT");
      res.json({ message: "Sort order updated" });
    } catch (e) {
      db.run("ROLLBACK");
      res.status(500).json({ error: e.message });
    }
    stmt.finalize();
  });
});

module.exports = router;
