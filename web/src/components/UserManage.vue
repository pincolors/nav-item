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
userList.value = res.data.data || res.data;
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
  min-height: 300px;
  color: #333;
}

.manage-container.dark-mode {
  color: #e0e6ed;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-wrapper {
  overflow-x: auto;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.dark-mode .table-wrapper {
  background: #1b202d;
  border-color: #2d3340;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th, .data-table td {
  padding: 16px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  color: #333;
}

.dark-mode .data-table th,
.dark-mode .data-table td {
  border-bottom-color: #2d3340;
  color: #e0e6ed;
}

.data-table th {
  background: #f8f9fa;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.dark-mode .data-table th {
  background: rgba(255, 255, 255, 0.02);
  color: #8892b0;
}

.role-tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.role-tag.admin { 
  background: rgba(56, 189, 248, 0.1); 
  color: #0284c7; 
  border: 1px solid rgba(56, 189, 248, 0.3); 
}

.role-tag.user { 
  background: rgba(16, 185, 129, 0.1); 
  color: #059669; 
  border: 1px solid rgba(16, 185, 129, 0.3); 
}

.dark-mode .role-tag.admin { color: #38bdf8; }
.dark-mode .role-tag.user { color: #10b981; }

.action-btn {
  margin-right: 8px;
  padding: 6px 12px;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.2s;
}
.action-btn:hover { transform: translateY(-1px); opacity: 0.9; }
.action-btn.edit { background: #2563eb; color: #fff; }
.action-btn.delete { background: #dc2626; color: #fff; }

.btn-primary {
  background: #10b981;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}
.btn-primary:hover {
  background: #059669;
}

/* 弹窗 */
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  width: 340px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
}

.dark-mode .modal-content {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.form-group { margin-bottom: 20px; }

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #6b7280;
  font-weight: bold;
}

.dark-mode .form-group label { color: #94a3b8; }

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  color: #111827;
  border-radius: 8px;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus { border-color: #10b981; }

.dark-mode .form-group input,
.dark-mode .form-group select {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

.dark-mode .form-group input:focus { border-color: #38bdf8; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel { 
  background: #f3f4f6;
  border: none; 
  padding: 10px 18px; 
  border-radius: 8px; 
  cursor: pointer; 
  color: #6b7280;
}

.dark-mode .btn-cancel {
  background: #334155;
  color: #94a3b8;
}

.btn-confirm { 
  background: #10b981; 
  border: none; 
  padding: 10px 18px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: bold; 
  color: #fff; 
}
</style>
