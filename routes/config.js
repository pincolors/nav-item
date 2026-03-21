const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authMiddleware = require('./authMiddleware');

// 获取所有配置
router.get('/', async (req, res) => {
  try {
    const configs = await db.query('SELECT key, value FROM configs', []);
    const result = {};
    configs.forEach(c => { result[c.key] = c.value; });
    res.json(result);
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新配置（需要登录）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const configs = req.body;
    for (const [key, value] of Object.entries(configs)) {
      const existing = await db.get('SELECT * FROM configs WHERE key = ?', [key]);
      if (existing) {
        await db.run('UPDATE configs SET value = ? WHERE key = ?', [value, key]);
      } else {
        await db.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
      }
    }
    res.json({ success: true, message: '配置已保存' });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 清空所有数据（需要登录）
router.delete('/clear-all', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM cards', []);
    await db.run('DELETE FROM sub_menus', []);
    await db.run('DELETE FROM menus', []);
    console.log('🗑️ 所有数据已清空');
    res.json({ success: true, message: '所有数据已清空' });
  } catch (error) {
    console.error('清空数据失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
