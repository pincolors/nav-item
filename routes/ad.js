// routes/ad.js
const express = require('express');
const { db } = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// ========================================
// 获取广告列表（支持分页）
// ========================================
router.get('/', async (req, res) => {
  const { page, pageSize, position } = req.query;
  
  try {
    // 不分页查询
    if (!page && !pageSize) {
      let query = 'SELECT * FROM ads ORDER BY order_num';
      let params = [];
      
      // 如果指定了位置，只查询该位置的广告
      if (position) {
        query = 'SELECT * FROM ads WHERE position = ? ORDER BY order_num';
        params = [position];
      }
      
      const rows = await db.query(query, params);
      return res.json(rows);
    }
    
    // 分页查询
    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * size;
    
    // 构建查询条件
    let countQuery = 'SELECT COUNT(*) as total FROM ads';
    let dataQuery = 'SELECT * FROM ads';
    let countParams = [];
    let dataParams = [];
    
    if (position) {
      countQuery += ' WHERE position = ?';
      dataQuery += ' WHERE position = ?';
      countParams = [position];
      dataParams = [position, size, offset];
    } else {
      dataParams = [size, offset];
    }
    
    dataQuery += ' ORDER BY order_num LIMIT ? OFFSET ?';
    
    // 获取总数
    const countRow = await db.get(countQuery, countParams);
    const total = countRow.total;
    
    // 获取分页数据
    const rows = await db.query(dataQuery, dataParams);
    
    res.json({
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size),
      data: rows
    });
  } catch (error) {
    console.error('获取广告列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 获取单个广告详情
// ========================================
router.get('/:id', async (req, res) => {
  const adId = parseInt(req.params.id);
  
  try {
    const ad = await db.get('SELECT * FROM ads WHERE id = ?', [adId]);
    
    if (!ad) {
      return res.status(404).json({ error: '广告不存在' });
    }
    
    res.json(ad);
  } catch (error) {
    console.error('获取广告详情失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 新增广告
// ========================================
router.post('/', auth, async (req, res) => {
  console.log('==================== 新增广告 ====================');
  console.log('🔵 请求数据:', req.body);
  
  const { position, img, url, title, order_num, is_active } = req.body;
  
  // 验证必填字段
  if (!position || !img || !url) {
    console.error('❌ 缺少必填字段');
    return res.status(400).json({ error: '位置、图片和链接不能为空' });
  }
  
  try {
    // 如果没有指定 order_num，自动设置为最大值 + 1
    let orderNum = order_num;
    if (orderNum === undefined || orderNum === null) {
      const maxOrder = await db.get(
        'SELECT MAX(order_num) as max_order FROM ads WHERE position = ?',
        [position]
      );
      orderNum = (maxOrder.max_order || 0) + 1;
    }
    
    const sql = `
      INSERT INTO ads (position, img, url, title, order_num, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      position,
      img,
      url,
      title || '',
      orderNum,
      is_active !== undefined ? is_active : 1
    ];
    
    console.log('🔵 SQL:', sql);
    console.log('🔵 参数:', params);
    
    const result = await db.run(sql, params);
    const insertId = result.lastID;
    
    console.log('🟢 新增成功，ID:', insertId);
    
    // 返回完整数据
    const ad = await db.get('SELECT * FROM ads WHERE id = ?', [insertId]);
    console.log('====================');
    
    res.json({ id: insertId, data: ad });
  } catch (error) {
    console.error('新增广告失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 修改广告
// ========================================
router.put('/:id', auth, async (req, res) => {
  console.log('==================== 修改广告 ====================');
  console.log('🔵 广告 ID:', req.params.id);
  console.log('🔵 请求数据:', req.body);
  
  const adId = parseInt(req.params.id);
  const { position, img, url, title, order_num, is_active } = req.body;
  
  try {
    // 检查广告是否存在
    const existingAd = await db.get('SELECT * FROM ads WHERE id = ?', [adId]);
    if (!existingAd) {
      console.error('❌ 广告不存在，ID:', adId);
      return res.status(404).json({ error: '广告不存在' });
    }
    
    console.log('🟡 修改前数据:', existingAd);
    
    // 构建更新语句
    const updates = [];
    const params = [];
    
    if (position !== undefined) {
      updates.push('position = ?');
      params.push(position);
    }
    if (img !== undefined) {
      updates.push('img = ?');
      params.push(img);
    }
    if (url !== undefined) {
      updates.push('url = ?');
      params.push(url);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (order_num !== undefined) {
      updates.push('order_num = ?');
      params.push(order_num);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: '没有要更新的内容' });
    }
    
    params.push(adId);
    const sql = `UPDATE ads SET ${updates.join(', ')} WHERE id = ?`;
    
    console.log('🔵 SQL:', sql);
    console.log('🔵 参数:', params);
    
    const result = await db.run(sql, params);
    console.log('🟢 更新成功，影响行数:', result.changes);
    
    // 返回更新后的数据
    const ad = await db.get('SELECT * FROM ads WHERE id = ?', [adId]);
    console.log('🟢 修改后数据:', ad);
    console.log('====================');
    
    res.json({ changed: result.changes, data: ad });
  } catch (error) {
    console.error('修改广告失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 删除广告
// ========================================
router.delete('/:id', auth, async (req, res) => {
  const adId = parseInt(req.params.id);
  console.log('🔵 删除广告 ID:', adId);
  
  try {
    // 检查广告是否存在
    const ad = await db.get('SELECT * FROM ads WHERE id = ?', [adId]);
    if (!ad) {
      console.error('❌ 广告不存在，ID:', adId);
      return res.status(404).json({ error: '广告不存在' });
    }
    
    console.log('🟡 删除的广告:', ad);
    
    const result = await db.run('DELETE FROM ads WHERE id = ?', [adId]);
    console.log('🟢 删除成功，影响行数:', result.changes);
    
    res.json({ deleted: result.changes, ad });
  } catch (error) {
    console.error('删除广告失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 批量删除广告
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
        const result = await db.run('DELETE FROM ads WHERE id = ?', [id]);
        deletedCount += result.changes;
      }
    });
    
    console.log('🟢 批量删除广告成功，删除数量:', deletedCount);
    res.json({ message: '批量删除成功', deleted: deletedCount });
  } catch (error) {
    console.error('批量删除广告失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 广告排序
// ========================================
router.post('/sort', auth, async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  
  try {
    await db.transaction(async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.run('UPDATE ads SET order_num = ? WHERE id = ?', [i, ids[i]]);
      }
    });
    
    console.log('🟢 广告排序保存成功');
    res.json({ message: '顺序保存成功' });
  } catch (error) {
    console.error('广告排序失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 切换广告状态（启用/禁用）
// ========================================
router.patch('/:id/toggle', auth, async (req, res) => {
  const adId = parseInt(req.params.id);
  
  try {
    // 获取当前状态
    const ad = await db.get('SELECT is_active FROM ads WHERE id = ?', [adId]);
    if (!ad) {
      return res.status(404).json({ error: '广告不存在' });
    }
    
    // 切换状态
    const newStatus = ad.is_active === 1 ? 0 : 1;
    const result = await db.run(
      'UPDATE ads SET is_active = ? WHERE id = ?',
      [newStatus, adId]
    );
    
    console.log('🟢 广告状态切换成功，ID:', adId, '新状态:', newStatus);
    res.json({ 
      changed: result.changes, 
      is_active: newStatus,
      message: newStatus === 1 ? '广告已启用' : '广告已禁用'
    });
  } catch (error) {
    console.error('切换广告状态失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 按位置获取活跃广告（公开接口）
// ========================================
router.get('/active/:position', async (req, res) => {
  const { position } = req.params;
  
  try {
    const ads = await db.query(
      'SELECT * FROM ads WHERE position = ? AND is_active = 1 ORDER BY order_num',
      [position]
    );
    
    res.json(ads);
  } catch (error) {
    console.error('获取活跃广告失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 复制/克隆广告
// ========================================
router.post('/:id/clone', auth, async (req, res) => {
  const adId = parseInt(req.params.id);
  
  try {
    // 获取原广告
    const originalAd = await db.get('SELECT * FROM ads WHERE id = ?', [adId]);
    
    if (!originalAd) {
      return res.status(404).json({ error: '原广告不存在' });
    }
    
    // 创建副本
    const sql = `
      INSERT INTO ads (position, img, url, title, order_num, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      originalAd.position,
      originalAd.img,
      originalAd.url,
      originalAd.title ? originalAd.title + ' (副本)' : '副本',
      originalAd.order_num + 1,
      0 // 副本默认禁用
    ];
    
    const result = await db.run(sql, params);
    const newAd = await db.get('SELECT * FROM ads WHERE id = ?', [result.lastID]);
    
    console.log('🟢 克隆广告成功，新 ID:', result.lastID);
    res.json({ message: '克隆成功', id: result.lastID, data: newAd });
  } catch (error) {
    console.error('克隆广告失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 广告统计信息
// ========================================
router.get('/stats/summary', async (req, res) => {
  try {
    const totalAds = await db.get('SELECT COUNT(*) as count FROM ads');
    const activeAds = await db.get('SELECT COUNT(*) as count FROM ads WHERE is_active = 1');
    const adsByPosition = await db.query(`
      SELECT position, COUNT(*) as count 
      FROM ads 
      GROUP BY position
      ORDER BY count DESC
    `);
    
    res.json({
      total_ads: totalAds.count,
      active_ads: activeAds.count,
      inactive_ads: totalAds.count - activeAds.count,
      ads_by_position: adsByPosition
    });
  } catch (error) {
    console.error('获取广告统计失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
