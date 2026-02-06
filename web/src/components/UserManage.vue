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
// 假设你有一个 api/index.js，如果没有，请根据实际情况修改 api 调用
import { request } from '../../api'; // 或者用 axios

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
    // 这里调用你的后端接口，比如 GET /api/users
    // const res = await request.get('/users'); 
    // userList.value = res.data;

    // 👇 模拟数据 (等你后端写好接口后，删掉下面这行，取消上面的注释)
    userList.value = [
      { id: 1, username: 'admin', role: 'admin', created_at: '2025-12-01T10:00:00Z' },
      { id: 2, username: 'guest', role: 'user', created_at: '2026-01-15T14:30:00Z' }
    ];
  } catch (e) {
    alert('加载失败: ' + e.message);
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
      // update user api
      console.log('更新用户', form);
      // await request.put(`/users/${form.id}`, form);
    } else {
      // create user api
      console.log('创建用户', form);
      // await request.post('/users', form);
    }
    showModal.value = false;
    alert('保存成功');
    fetchUsers(); // 刷新列表
  } catch (e) {
    alert('操作失败');
  }
};

// 删除用户
const handleDelete = async (id) => {
  if (!confirm('确定删除该用户吗？')) return;
  try {
    // delete user api
    // await request.delete(`/users/${id}`);
    alert('删除成功');
    fetchUsers();
  } catch (e) {
    alert('删除失败');
  }
};

const formatDate = (str) => {
  if(!str) return '-';
  return new Date(str).toLocaleString();
};
</script>

<style scoped>
.manage-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  min-height: 500px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.role-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.role-tag.admin { background: #e6f7ff; color: #1890ff; }
.role-tag.user { background: #f6ffed; color: #52c41a; }

.action-btn {
  margin-right: 8px;
  padding: 4px 8px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}
.action-btn.edit { background: #e6f7ff; color: #1890ff; }
.action-btn.delete { background: #fff1f0; color: #f5222d; }

/* 按钮样式 */
.btn-primary {
  background: #00ff9d;
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  width: 360px;
}
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #666; }
.form-group input, .form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}
.modal-actions {
  display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;
}
.btn-cancel { background: #f5f5f5; border: 1px solid #ddd; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.btn-confirm { background: #00ff9d; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;}
</style>
