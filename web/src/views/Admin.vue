<!-- web/src/views/Admin.vue -->
<template>
  <div class="admin-container">
    <!-- 现有的菜单管理界面 -->
    
    <!-- 编辑菜单对话框 -->
    <div v-if="showMenuDialog" class="dialog-overlay" @click.self="closeMenuDialog">
      <div class="dialog">
        <h3>{{ isEditingMenu ? '编辑菜单' : '添加菜单' }}</h3>
        
        <div class="form-group">
          <label>菜单名称</label>
          <input 
            v-model="menuForm.name" 
            type="text" 
            placeholder="请输入菜单名称"
          />
        </div>

        <div class="form-group">
          <label>排序</label>
          <input 
            v-model.number="menuForm.order_num" 
            type="number" 
            placeholder="数字越小越靠前"
          />
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" v-model="menuForm.is_public" />
            公开显示
          </label>
        </div>

        <!-- 🔥 新增：子菜单管理组件（仅在编辑时显示）-->
        <SubMenuManager 
          v-if="isEditingMenu && menuForm.id"
          :menuId="menuForm.id"
          @success="showMessage"
          @error="showError"
        />

        <div class="dialog-actions">
          <button @click="closeMenuDialog" class="btn-cancel">取消</button>
          <button @click="saveMenu" class="btn-save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  getMenus, 
  addMenu, 
  updateMenu, 
  deleteMenu 
} from '../api.js';
import SubMenuManager from '../components/SubMenuManager.vue';  // 🔥 导入组件

export default {
  name: 'AdminView',
  components: {
    SubMenuManager  // 🔥 注册组件
  },
  data() {
    return {
      menus: [],
      showMenuDialog: false,
      isEditingMenu: false,
      menuForm: {
        id: null,
        name: '',
        order_num: 0,
        is_public: true
      }
    };
  },
  mounted() {
    this.loadMenus();
  },
  methods: {
    async loadMenus() {
      try {
        const response = await getMenus();
        this.menus = response.data;
      } catch (error) {
        console.error('加载菜单失败:', error);
      }
    },

    showAddMenuDialog() {
      this.isEditingMenu = false;
      this.menuForm = {
        id: null,
        name: '',
        order_num: this.menus.length,
        is_public: true
      };
      this.showMenuDialog = true;
    },

    editMenu(menu) {
      this.isEditingMenu = true;
      this.menuForm = {
        id: menu.id,
        name: menu.name,
        order_num: menu.order_num,
        is_public: menu.is_public
      };
      this.showMenuDialog = true;
    },

    async saveMenu() {
      if (!this.menuForm.name.trim()) {
        alert('请输入菜单名称');
        return;
      }

      try {
        if (this.isEditingMenu) {
          await updateMenu(this.menuForm.id, {
            name: this.menuForm.name,
            order_num: this.menuForm.order_num,
            is_public: this.menuForm.is_public ? 1 : 0
          });
          this.showMessage('菜单更新成功');
        } else {
          await addMenu({
            name: this.menuForm.name,
            order_num: this.menuForm.order_num,
            is_public: this.menuForm.is_public ? 1 : 0
          });
          this.showMessage('菜单创建成功');
        }
        
        this.closeMenuDialog();
        this.loadMenus();
      } catch (error) {
        console.error('保存菜单失败:', error);
        this.showError('保存失败');
      }
    },

    async deleteMenuAction(menu) {
      if (!confirm(`确定要删除菜单"${menu.name}"吗？`)) {
        return;
      }

      try {
        await deleteMenu(menu.id);
        this.showMessage('菜单删除成功');
        this.loadMenus();
      } catch (error) {
        console.error('删除菜单失败:', error);
        this.showError('删除失败');
      }
    },

    closeMenuDialog() {
      this.showMenuDialog = false;
      this.menuForm = {
        id: null,
        name: '',
        order_num: 0,
        is_public: true
      };
    },

    showMessage(msg) {
      alert(msg);
    },

    showError(msg) {
      alert(msg);
    }
  }
};
</script>

<style scoped>
/* 现有样式保持不变 */

/* 对话框宽度调整（为子菜单管理留出空间）*/
.dialog {
  max-width: 600px;  /* 从 400px 增加到 600px */
  max-height: 90vh;  /* 添加最大高度 */
  overflow-y: auto;  /* 允许滚动 */
}
</style>
