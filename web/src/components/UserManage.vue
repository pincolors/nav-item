<template>
  <div class="manage-container">
    <div class="toolbar">
      <h3>用户列表</h3>
      <button class="btn-primary" @click="openModal()">+ 新增用户</button>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>角色</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in userList" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>
              <span :class="['role-tag', user.role === 'admin' ? 'admin' : 'user']">
                {{ user.role === 'admin' ? '管理员' : '普通用户' }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <button class="action-btn edit" @click="openModal(user)">编辑</button>
              <button class="action-btn delete" @click="handleDelete(user.id)" v-if="user.id !== 1">删除</button>
            </td>
          </tr>
          <tr v-if="userList.length === 0">
            <td colspan="5" style="text-align:center; color:#999; padding: 20px;">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3>{{ isEdit ? '编辑用户' : '新增用户' }}</h3>
        
        <div class="form-group">
          <label>用户名</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" :disabled="isEdit">
        </div>

        <div class="form-group">
          <label>密码</label>
          <input v-model="form.password" type="password" :placeholder="isEdit ? '不修改请留空' : '请输入密码'">
        </div>
        
        <div class="form-group">
          <label>角色</label>
          <select v-model="form.role">
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">取消</button>
          <button class="btn-confirm" @click="handleSubmit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

/* ✅ 关键修复：路径修正
   原来是 '../../api' (因为之前在 views/admin 下)
   现在改成了 '../api' (因为现在在 components 下)
   注意：如果你的 api/index.js 是 export default request，则用 import request
   如果是 export const request，则用 import { request }
*/
import request from '../api'; 

const userList = ref([]);
const showModal = ref(false);
const isEdit = ref(false);

const form = reactive({
  id: null,
  username: '',
  password: '',
  role: 'user'
});

// 初始化加载
onMounted(() => {
  fetchUsers();
});

// 获取用户列表
const fetchUsers = async () => {
  try {
    // 真实接口调用 (请确保后端有这个接口)
    const res = await request.get('/users'); 
    userList.value = res.data;
  } catch (e) {
    console.error('加载用户失败, 使用模拟数据演示:', e);
    // 👇 兜底：如果后端接口没通，显示模拟数据，防止页面空白
    userList.value = [
      { id: 1, username: 'admin', role: 'admin', created_at: '2025-12-01T10:00:00Z' },
      { id: 2, username: 'demo', role: 'user', created_at: '2026-02-01T14:30:00Z' }
    ];
  }
};

// 打开弹窗
const openModal = (user = null) => {
  isEdit.value = !!user;
  if (user) {
    form.id = user.id;
    form.username = user.username;
    form.password = ''; // 编辑时不回显密码
    form.role = user.role || 'user';
  } else {
    form.id = null;
    form.username = '';
    form.password = '';
    form.role = 'user';
  }
  showModal.value = true;
};

// 提交表单
const handleSubmit = async () => {
  if (!form.username) return alert('用户名不能为空');
  if (!isEdit.value && !form.password) return alert('密码不能为空');

  try {
    if (isEdit.value) {
      // 编辑接口 (假设后端是 PUT /users/:id)
      await request.put(`/users/${form.id}`, form);
    } else {
      // 新增接口 (假设后端是 POST /users)
      await request.post('/users', form);
    }
    showModal.value = false;
    alert('保存成功');
    fetchUsers(); // 刷新列表
  } catch (e) {
    alert('操作失败: ' + (e.response?.data?.message || e.message));
  }
};

// 删除用户
const handleDelete = async (id) => {
  if (!confirm('确定删除该用户吗？')) return;
  try {
    // 删除接口 (假设后端是 DELETE /users/:id)
    await request.delete(`/users/${id}`);
    alert('删除成功');
    fetchUsers();
  } catch (e) {
    alert('删除失败: ' + (e.response?.data?.message || e.message));
  }
};

// 日期格式化辅助函数
const formatDate = (str) => {
  if(!str) return '-';
  return new Date(str).toLocaleString();
};
</script>

<style scoped>
.manage-container {
  /* 移除白色背景和边框，因为现在是嵌入在弹窗里的 */
  min-height: 300px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 表格样式 */
.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th, .data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
  color: #333;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
}

/* 角色标签 */
.role-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.role-tag.admin { background: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff; }
.role-tag.user { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }

/* 操作按钮 */
.action-btn {
  margin-right: 8px;
  padding: 4px 10px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  transition: opacity 0.2s;
}
.action-btn:hover { opacity: 0.8; }
.action-btn.edit { background: #1890ff; color: #fff; }
.action-btn.delete { background: #ff4d4f; color: #fff; }

/* 顶部主要按钮 */
.btn-primary {
  background: #00ff9d;
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 255, 157, 0.3);
}

/* 内部弹窗 (新增/编辑) 样式 */
.modal-overlay {
  position: absolute; /* 注意：这里的 absolute 是相对于父级大弹窗的 */
  inset: 0;
  background: rgba(255,255,255,0.8); /* 稍微浅一点的遮罩，区分层级 */
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
}
.modal-content {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  width: 320px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  border: 1px solid #eee;
}
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #666; font-weight: bold;}
.form-group input, .form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  outline: none;
}
.form-group input:focus { border-color: #00ff9d; }

.modal-actions {
  display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;
}
.btn-cancel { background: #f5f5f5; border: 1px solid #ddd; padding: 8px 16px; border-radius: 6px; cursor: pointer; color: #666; }
.btn-confirm { background: #00ff9d; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; color: #000; }
</style>
