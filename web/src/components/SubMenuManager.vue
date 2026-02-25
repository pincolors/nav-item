<!-- web/src/components/SubMenuManager.vue -->
<template>
  <div class="submenu-manager">
    <div class="submenu-header">
      <h3>子菜单管理</h3>
      <button @click="showAddDialog" class="btn-add">
        ➕ 添加子菜单
      </button>
    </div>

    <!-- 子菜单列表 -->
    <div v-if="subMenus.length > 0" class="submenu-list">
      <div 
        v-for="subMenu in subMenus" 
        :key="subMenu.id" 
        class="submenu-item"
      >
        <span class="submenu-name">{{ subMenu.name }}</span>
        <div class="submenu-actions">
          <button @click="editSubMenu(subMenu)" class="btn-edit">
            ✏️ 编辑
          </button>
          <button @click="deleteSubMenu(subMenu)" class="btn-delete">
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      暂无子菜单
    </div>

    <!-- 添加/编辑子菜单对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <h3>{{ isEditing ? '编辑子菜单' : '添加子菜单' }}</h3>
        
        <div class="form-group">
          <label>子菜单名称</label>
          <input 
            v-model="formData.name" 
            type="text" 
            placeholder="请输入子菜单名称"
            @keyup.enter="saveSubMenu"
          />
        </div>

        <div class="form-group">
          <label>排序</label>
          <input 
            v-model.number="formData.order_num" 
            type="number" 
            placeholder="数字越小越靠前"
          />
        </div>

        <div class="dialog-actions">
          <button @click="closeDialog" class="btn-cancel">取消</button>
          <button @click="saveSubMenu" class="btn-save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getSubMenus, addSubMenu, updateSubMenu, deleteSubMenu } from '../api.js';

export default {
  name: 'SubMenuManager',
  props: {
    menuId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      subMenus: [],
      showDialog: false,
      isEditing: false,
      formData: {
        id: null,
        name: '',
        order_num: 0
      }
    };
  },
  mounted() {
    this.loadSubMenus();
  },
  methods: {
    async loadSubMenus() {
      try {
        const response = await getSubMenus(this.menuId);
        this.subMenus = response.data || [];
      } catch (error) {
        console.error('加载子菜单失败:', error);
        this.$emit('error', '加载子菜单失败');
      }
    },

    showAddDialog() {
      this.isEditing = false;
      this.formData = {
        id: null,
        name: '',
        order_num: this.subMenus.length
      };
      this.showDialog = true;
    },

    editSubMenu(subMenu) {
      this.isEditing = true;
      this.formData = {
        id: subMenu.id,
        name: subMenu.name,
        order_num: subMenu.order_num
      };
      this.showDialog = true;
    },

    async saveSubMenu() {
      if (!this.formData.name.trim()) {
        alert('请输入子菜单名称');
        return;
      }

      try {
        if (this.isEditing) {
          // 更新
          await updateSubMenu(this.formData.id, {
            name: this.formData.name,
            order_num: this.formData.order_num
          });
          this.$emit('success', '子菜单更新成功');
        } else {
          // 创建
          await addSubMenu(this.menuId, {
            name: this.formData.name,
            order_num: this.formData.order_num
          });
          this.$emit('success', '子菜单创建成功');
        }
        
        this.closeDialog();
        this.loadSubMenus();
      } catch (error) {
        console.error('保存子菜单失败:', error);
        this.$emit('error', '保存子菜单失败');
      }
    },

    async deleteSubMenu(subMenu) {
      if (!confirm(`确定要删除子菜单"${subMenu.name}"吗？`)) {
        return;
      }

      try {
        await deleteSubMenu(subMenu.id);
        this.$emit('success', '子菜单删除成功');
        this.loadSubMenus();
      } catch (error) {
        console.error('删除子菜单失败:', error);
        this.$emit('error', '删除子菜单失败');
      }
    },

    closeDialog() {
      this.showDialog = false;
      this.formData = {
        id: null,
        name: '',
        order_num: 0
      };
    }
  }
};
</script>

<style scoped>
.submenu-manager {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.submenu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.submenu-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.btn-add {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover {
  background: #218838;
}

.submenu-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.submenu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.submenu-name {
  font-size: 14px;
  color: #333;
}

.submenu-actions {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-edit {
  background: #007bff;
  color: white;
}

.btn-edit:hover {
  background: #0056b3;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.dialog h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel,
.btn-save {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #5a6268;
}

.btn-save {
  background: #007bff;
  color: white;
}

.btn-save:hover {
  background: #0056b3;
}
</style>
