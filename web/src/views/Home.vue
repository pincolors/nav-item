<template>
  <div class="home-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 在 header 前面加上背景层 -->
<div 
  v-if="siteConfig.backgroundImage" 
  class="bg-wallpaper"
  :style="{ 
    backgroundImage: `url(${siteConfig.backgroundImage})`,
    opacity: siteConfig.backgroundOpacity 
  }"
></div>


    <header class="header-fixed">
      <div class="header-inner">
        <div class="header-left">
          <img :src="currentLogo" alt="WebNavHub" class="site-logo" @error="handleLogoError" />
          
          <div style="display: flex !important; flex-direction: column; justify-content: center; margin-left: 4px; line-height: 1.2;">
            <span class="site-title" style="display: flex !important; margin: 0; align-items: center; font-size: 20px;">
              WebNav <span style="color: #FF6B6B; margin-left: 2px;">Hub</span>
            </span>
            <span style="display: block !important; font-size: 12px; color: #9ca3af; font-weight: normal; letter-spacing: 0.5px; white-space: nowrap; transform: scale(0.9); transform-origin: left;">
              Your Organized Internet Gateway
            </span>
          </div>
        </div>
</div>
        <div class="header-right">
                 
          <div class="user-menu-container">
           <button 
  class="icon-btn admin-btn" 
  :class="{ 
    'is-admin': isAdmin, 
    'is-user': isLoggedIn && !isAdmin, 
    'is-logged-out': !isLoggedIn 
  }"
  @click.stop="handleUserIconClick"
>
  <Icon name="user-cog" style="font-size: 20px;" />
</button>

          
     <Transition name="fade">
  <div v-if="showUserMenu && isLoggedIn" class="dropdown-menu" v-click-outside="closeUserMenu">
    
    <div class="menu-header-label">{{ isAdmin ? '管理员菜单' : '普通用户 (只读)' }}</div>
    
    <div class="menu-item" :class="{ 'is-disabled': !isAdmin }" @click="handleAdminAction(openQuickImport)">
      <span class="menu-icon">⚡</span> 快速导入
    </div>
    <div class="menu-item" :class="{ 'is-disabled': !isAdmin }" @click="handleAdminAction(openUserManagement)">
      <span class="menu-icon">👥</span> 用户管理
    </div>
    <div class="menu-item" :class="{ 'is-disabled': !isAdmin }" @click="handleAdminAction(openSystemSettings)">
      <span class="menu-icon">⚙️</span> 系统设置
    </div>
 
    <div class="menu-divider"></div>

    <div class="menu-item" :class="{ 'is-disabled': !isAdmin }" 
     @click="handleAdminAction(confirmexportData)">
  <span class="menu-icon">📤</span> 备份数据
</div>
    
    <div class="menu-item" :class="{ 'is-disabled': !isAdmin }">
      <label :for="isAdmin ? 'importFile' : ''" style="display:flex; align-items:center; width:100%"
             :style="{ cursor: isAdmin ? 'pointer' : 'not-allowed' }"
             @click="!isAdmin && handleAdminAction()">
        <span class="menu-icon">📥</span> 恢复数据
      </label>
      <input v-if="isAdmin" type="file" id="importFile" style="display:none" @change="importData" accept=".json"/>
    </div>

    <div class="menu-divider"></div>

    <div class="menu-item logout" @click="showLogoutConfirm = true">
      <span class="menu-icon">🚪</span> 退出登录
    </div>

  </div>  <!-- ← dropdown-menu 在这里闭合 -->
</Transition>
</div>
 <button class="icon-btn" @click="toggleTheme" title="切换主题">
            <Icon :name="isDarkMode ? 'sun' : 'moon'" style="font-size: 26px;" />
          </button>
        </div>
      
    </header>
    <div class="menu-wrapper">
      <MenuBar 
        :menus="menus" 
        :activeId="activeMenu?.id" 
        :activeSubMenuId="activeSubMenu?.id"
       :is-edit-mode="isAdmin"
        :is-dark-mode="isDarkMode"
        @select="handleMenuSelect"
        @update:menus="handleMenuSort"
        @add="addMenu"
        @delete="confirmDeleteMenu"
      />
    </div>

    <div class="search-section">
      <div class="search-box-wrapper">
        <div class="search-container" v-click-outside="() => showEngineMenu = false">

         <div class="engine-selector">
  <div class="engine-current" @click="showEngineMenu = !showEngineMenu">
    <img v-if="selectedEngine.icon.startsWith('http')" :src="selectedEngine.icon" class="engine-icon" />
   <span v-else class="engine-emoji">🏠</span>
    <span class="engine-arrow">▾</span>
  </div>
  
<div v-if="showEngineMenu" class="engine-dropdown">

    <div 
      v-for="engine in searchEngines" 
      :key="engine.name"
      class="engine-option"
      :class="{ active: selectedEngine.name === engine.name }"
      @click="selectedEngine = engine; showEngineMenu = false"
    >
      <img v-if="engine.icon.startsWith('http')" :src="engine.icon" class="engine-icon" />
     <span v-else class="engine-emoji">🏠</span>


      <span class="engine-label">{{ engine.label }}</span>
    </div>
  </div>
</div>

          
          <input 
            v-model="searchQuery" 
            type="text" 
            :placeholder="selectedEngine.placeholder" 
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">✕</button>
          <button @click="handleSearch" class="search-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
      </div>
    </div>
    
   <div 
      class="content-area"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
     <CardGrid 
  :cards="filteredCards" 
 :is-edit-mode="isAdmin"
  :is-dark-mode="isDarkMode"
  :desktop-columns="siteConfig.desktopColumns"
  :mobile-columns="siteConfig.mobileColumns"
  @update:cards="handleCardSort"
  @edit="openEditModal"
  @delete="confirmdeleteCard"
  @add="openAddModal"
/>
    </div> 

    <SiteModal 
  v-model:visible="showSiteModal"
  :is-edit="isEditingSite"
  :initial-data="currentSiteData"
  :current-menu-id="activeMenu ? activeMenu.id : null"
  :menus="menus"  
  @save="handleSiteSave"
   />

    <QuickImportModal
      v-model:visible="showQuickImportModal"
      :menus="menus"
      :current-menu-id="activeMenu?.id"
      @import="handleBatchImport"
    />

    <div v-if="showUserManageModal" class="glass-overlay" @click.self="showUserManageModal = false">
  <div class="glass-dialog large-glass-dialog">
      <div class="dialog-header">
      <h3>👥 用户管理</h3>
      <button class="dialog-close-btn" @click="showUserManageModal = false">✕</button>
    </div>
    <UserManage />
  </div>
</div>

     <Teleport to="body">
  <div v-if="showLoginModal" 
       class="glass-overlay" 
       :class="{ 'dark-mode': isDarkMode }"
       @click="showLoginModal = false">
    <div class="glass-dialog login-glass-dialog" @click.stop>

      <div class="admin-login-icon" :class="{ 
  'logged-in-admin': loginSuccess && userRole === 'admin',
  'logged-in-user': loginSuccess && userRole !== 'admin'
}">
  <Icon name="user-cog" />
</div>

      <h3>{{ loginSuccess ? '登录成功' : '管理员登录' }}</h3>

      <template v-if="!loginSuccess">
        <div class="glass-form-group">
          <input v-model="loginForm.username" placeholder="用户名" class="glass-input" v-focus />
        </div>
        <div class="glass-form-group">
          <input v-model="loginForm.password" type="password" placeholder="密码" 
                 class="glass-input" @keyup.enter="doLogin" />
        </div>
        <button class="glass-btn-primary login-btn" :class="{ 'btn-empty': !canLogin }" @click="doLogin">登录</button>

       

      </template>

    </div>
  </div>
</Teleport>
 <div v-if="showLogoutConfirm" class="glass-overlay" 
     :class="{ 'dark-mode': isDarkMode }"
     @click.self="showLogoutConfirm = false">
  <div class="glass-dialog logout-dialog" @click.stop>

    <div class="admin-login-icon logged-in-admin">
      <Icon name="user-cog" />
    </div>

    <h3>确认退出登录？</h3>

    <div class="glass-actions">
      <button class="glass-btn-cancel" @click="showLogoutConfirm = false; showUserMenu = false">取消</button>
      <button class="glass-btn-primary logout-btn" @click="doLogout">退出</button>
    </div>
  </div>
</div>
<ConfirmDialog
  v-model:visible="showDeleteMenuConfirm"
  :is-dark-mode="isDarkMode"
  icon="🗑️"
  icon-type="danger"
  title="确定删除此菜单及内容？"
  description="此操作不可恢复"
  confirm-text="删除"
  confirm-type="danger"
  @confirm="deleteMenu"
/>
<ConfirmDialog
  v-model:visible="showdeleteCardConfirm"
  :is-dark-mode="isDarkMode"
  icon="🗑️"
  icon-type="danger"
  title="确定删除此站点？"
  description="此操作不可恢复"
  confirm-text="删除"
  confirm-type="danger"
  @confirm="deleteCard"
/>
<ConfirmDialog
  v-model:visible="showexportDataConfirm"
  :is-dark-mode="isDarkMode"
  icon="📤"
  icon-type="success"
  title="确认备份数据？"
  description="将导出所有菜单和卡片数据为 JSON 文件"
  confirm-text="开始备份"
  @confirm="exportData"
/>

<footer class="footer">
  <div class="footer-content">
    <p class="copyright">{{ siteConfig.copyright }}</p>
  </div>
</footer>

<SystemSettings
  v-model:visible="showSystemSettings"
  :is-dark-mode="isDarkMode"
  @saved="handleSettingsSaved"
/>

   <div v-if="showImportConfirm" class="glass-overlay" 
     :class="{ 'dark-mode': isDarkMode }"
     @click.self="showImportConfirm = false">
  <div class="glass-dialog import-preview-dialog" @click.stop>

    <div class="confirm-icon icon-warning">📥</div>
    <h3>确认恢复数据？</h3>
    <p class="confirm-desc">即将从备份文件导入以下内容：</p>

    <div class="result-stats">
      <div class="stat-item">
        <span class="stat-num">{{ importPreview.menuCount }}</span>
        <span class="stat-label">个菜单</span>
      </div>
      <div class="stat-item" v-if="importPreview.subMenuCount">
        <span class="stat-num">{{ importPreview.subMenuCount }}</span>
        <span class="stat-label">个子菜单</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ importPreview.cardCount }}</span>
        <span class="stat-label">个站点</span>
      </div>
    </div>

    <div class="glass-actions">
      <button class="glass-btn-cancel" @click="showImportConfirm = false">取消</button>
      <button class="glass-btn-primary" @click="showImportConfirm = false; startImport()">开始恢复</button>
    </div>
  </div>
</div>


<!-- ============================================================
  【2】恢复进度弹窗 - 保持原有的进度条样式
  ============================================================ -->
<div v-if="importState.visible" class="glass-overlay" :class="{ 'dark-mode': isDarkMode }">
  <div class="glass-dialog import-glass-dialog">
    <h3 class="import-title">正在恢复数据...</h3>

    <div class="progress-track">
      <div class="progress-fill" :style="{ width: importState.percent + '%' }"></div>
    </div>

    <div class="import-status">
      <span>{{ importState.text }}</span>
      <span class="percent-num">{{ importState.percent }}%</span>
    </div>
  </div>
</div>
<div v-if="showImportResult" class="glass-overlay" 
     :class="{ 'dark-mode': isDarkMode }"
     @click.self="finishImport">
  <div class="glass-dialog import-preview-dialog" @click.stop>

    <div class="confirm-icon icon-success">🎉</div>
    <h3>恢复完成</h3>
    <p class="confirm-desc">数据已成功导入</p>

    <div class="result-stats">
      <div class="stat-item">
        <span class="stat-num">{{ importResult.menuCount }}</span>
        <span class="stat-label">个菜单</span>
      </div>
      <div class="stat-item" v-if="importResult.subMenuCount">
        <span class="stat-num">{{ importResult.subMenuCount }}</span>
        <span class="stat-label">个子菜单</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ importResult.cardCount }}</span>
        <span class="stat-label">个站点</span>
      </div>
    </div>

    <button class="glass-btn-primary result-confirm-btn" @click="finishImport">完成</button>
  </div>
</div>
  <div v-if="showAddMenuDialog" class="glass-overlay" @click.self="showAddMenuDialog = false">
  <div class="glass-dialog glass-dialog-sm" @click.stop>
    <h3>✨ 添加菜单</h3>
    <div class="glass-form-group">
      <label>菜单名称</label>
      <input
        v-model="newMenuName"
        class="glass-input"
        placeholder="请输入菜单名称"
        @keyup.enter="confirmAddMenu"
        v-focus-if-visible="showAddMenuDialog"
      />
    </div>
    <div class="glass-actions">
      <button class="glass-btn-cancel" @click="showAddMenuDialog = false">取消</button>
      <button class="glass-btn-primary" @click="confirmAddMenu">添加</button>
    </div>
  </div>
</div>  
  </div> 
</template>

<script setup>

import { ref, computed, reactive, onMounted, watch } from 'vue';
import { 
  getMenus, 
  getCards, 
  login, 
  addMenu as apiAddMenu, 
  deleteMenu as apiDeleteMenu, 
  addCard as apiAddCard, 
  updateCard as apiUpdateCard, 
  deleteCard as apiDeleteCard,
  updateCardOrder, 
  updateMenuOrder,
  getSubMenus,   // 👈 新增
  addSubMenu     // 👈 新增
} from '../api'; 

import MenuBar from '../components/MenuBar.vue';
import CardGrid from '../components/CardGrid.vue';
import SiteModal from '../components/SiteModal.vue';
import QuickImportModal from '../components/QuickImportModal.vue';
import UserManage from '../components/UserManage.vue';
import SystemSettings from '../components/SystemSettings.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { getConfigs, saveConfigs, clearAllData } from '../api';

// 👇 引入刚封装的图标组件
import Icon from '../components/Icon.vue'; 
  
// ==================== 主题管理 ====================
const isDarkMode = ref(localStorage.getItem('theme') === 'dark');

const currentLogo = '/logo-transp.svg';

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
};

const showEngineMenu = ref(false);

// ==================== 认证管理 ====================
const isLoggedIn = ref(!!localStorage.getItem('token'));
const showLoginModal = ref(false);
const showUserMenu = ref(false);
const loginForm = reactive({ username: '', password: '' });

const handleUserIconClick = () => {
  if (isLoggedIn.value) {
  
    showUserMenu.value = !showUserMenu.value;
  } else {
    showLoginModal.value = true;
  }
};

// 新增：统一权限拦截函数
const handleAdminAction = (callback) => {
  if (!isAdmin.value) {
    alert('🚫 权限不足：只有管理员可以执行此操作。');
    return;
  }
  if (callback) callback();
};

const loginSuccess = ref(false);

const doLogin = async () => {
  try {
    const res = await login(loginForm.username, loginForm.password);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', res.data.user.role || 'admin');
      isLoggedIn.value = true;
      userRole.value = res.data.user.role || 'admin';
      showUserMenu.value = false; // ← 加这一行，确保登录后菜单是关闭的
      loginSuccess.value = true; // 触发图标变红转圈

      setTimeout(() => {
        showLoginModal.value = false;
        loginSuccess.value = false; // 重置，下次打开恢复青色
        loginForm.username = '';
        loginForm.password = '';
      }, 600);
    } 
  } catch (e) {
    alert('登录失败: ' + (e.response?.data?.message || e.message));
  } 
};


const showSystemSettings = ref(false);
const siteConfig = ref({
  copyright: 'Copyright © 2026 Nav-Item',
  desktopColumns: 6,
  mobileColumns: 2,
  defaultEngine: 'site',
  backgroundImage: '',
  backgroundOpacity: 0.15,
});
const userRole = ref(localStorage.getItem('userRole') || 'user');
const isAdmin = computed(() => isLoggedIn.value && userRole.value === 'admin');

const showLogoutConfirm = ref(false);

function confirmLogout() {
  showLogoutConfirm.value = true;
}

function doLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  isLoggedIn.value = false;
  userRole.value = '';
  showLogoutConfirm.value = false;
  showUserMenu.value = false;
}

const closeUserMenu = () => {
  showUserMenu.value = false;
};

// ==================== 菜单管理 ====================
// ==================== 菜单管理 ====================
const menus = ref([]);
const activeMenu = ref(null);
const activeSubMenu = ref(null);

const loadMenus = async () => {
  try {
    const res = await getMenus();
    menus.value = res.data;
    if (menus.value.length && !activeMenu.value) {
      activeMenu.value = menus.value[0];
    }
  } catch (e) {
    console.error('加载菜单失败:', e);
  }
};

const handleSettingsSaved = (config) => {
  siteConfig.value = { ...config };
  const engine = searchEngines.find(e => e.name === config.defaultEngine);
  if (engine) selectedEngine.value = engine;
};

const handleMenuSelect = (menu, parent = null) => {
  if (parent) {
    activeMenu.value = parent;
    activeSubMenu.value = menu;
  } else {
    activeMenu.value = menu;
    activeSubMenu.value = null;
  }
  loadCards();
  
  setTimeout(() => {
    const activeMenuItem = document.querySelector('.menu-item.active');
    if (activeMenuItem) {
      activeMenuItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, 100);
};

const handleMenuSort = async (newMenus) => {
  const oldMenus = [...menus.value];
  menus.value = newMenus;
  try {
    await updateMenuOrder(newMenus.map(m => m.id));
    console.log('菜单顺序已保存');
  } catch (e) {
    console.error('菜单排序失败:', e);
    menus.value = oldMenus;
  }
};

// 新增菜单弹窗状态
const showAddMenuDialog = ref(false);
const newMenuName = ref('');

// 打开添加菜单弹窗（替换原来直接 emit 的 addMenu）
const addMenu = () => {
  newMenuName.value = '';
  showAddMenuDialog.value = true;
};

// 确认添加菜单
const confirmAddMenu = async () => {
  if (!newMenuName.value.trim()) return;
  try {
    await apiAddMenu({ name: newMenuName.value.trim(), order: menus.value.length + 1 });
    showAddMenuDialog.value = false;
    newMenuName.value = '';
    await loadMenus();
  } catch (e) {
    alert('添加菜单失败: ' + e.message);
  }
};
const pendingDeleteMenuId = ref(null);
const showDeleteMenuConfirm = ref(false);
function confirmDeleteMenu(id) {
  pendingDeleteMenuId.value = id;
  showDeleteMenuConfirm.value = true;
}

const deleteMenu = async () => {
  const id = pendingDeleteMenuId.value;
  if (!id) return;
  try {
    await apiDeleteMenu(id);
    if (activeMenu.value?.id === id) {
      activeMenu.value = menus.value[0] || null;
      activeSubMenu.value = null;
    }
    await loadMenus();
    pendingDeleteMenuId.value = null;
  } catch (e) {
    alert('删除菜单失败: ' + e.message);
  }
};


// ==================== 卡片管理 ====================
const cards = ref([]);
const showSiteModal = ref(false);
const isEditingSite = ref(false);
const currentSiteData = ref(null);

const loadCards = async () => {
  if (!activeMenu.value) {
    cards.value = [];
    return;
  }
  try {
    const res = await getCards(activeMenu.value.id, activeSubMenu.value?.id);
    console.log('🔵 加载的卡片数据:', res.data);
    cards.value = (res.data || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    console.log('🟢 卡片总数:', cards.value.length);
  } catch (e) {
    console.error('加载卡片失败:', e);
    cards.value = [];
  }
};

const handleCardSort = async (newCards) => {
  cards.value = newCards;
  const ids = newCards.map(c => c.id);
  try {
    await updateCardOrder(ids);
    console.log('🟢 排序已保存');
  } catch (e) {
    console.error('卡片排序失败:', e);
  }
};

const openAddModal = () => {
  if (!activeMenu.value) return alert('请先选择一个菜单');
  isEditingSite.value = false;
  currentSiteData.value = null;
  showSiteModal.value = true;
};

const openEditModal = (card) => {
  isEditingSite.value = true;
  currentSiteData.value = { ...card };
  showSiteModal.value = true;
};

const handleSiteSave = async (formData) => {
  console.log('🟡 isEditingSite:', isEditingSite.value);
  console.log('🟡 formData:', JSON.stringify(formData));
  try {
    if (isEditingSite.value) {
      console.log('🔵 进入编辑分支');
      const originalCard = cards.value.find(c => c.id === formData.id);
      if (!originalCard) {
        alert('卡片不存在，无法编辑');
        return;
      }
      
      const payload = {
        id: formData.id,
        menu_id: formData.menu_id || originalCard.menu_id,
        sub_menu_id: formData.sub_menu_id !== undefined ? formData.sub_menu_id : originalCard.sub_menu_id,
        title: formData.title,
        url: formData.url,
        logo_url: formData.logo_url || '',
        custom_logo_path: formData.custom_logo_path || '',
        desc: formData.desc || formData.description || '',
        order: formData.order !== undefined ? formData.order : (originalCard.order || 0)
      };
      
      const response = await apiUpdateCard(formData.id, payload);
      console.log('🟢 服务器返回:', JSON.stringify(response.data));

      if (payload.menu_id !== activeMenu.value.id) {
  // 1. 从当前旧菜单列表中移除它
  cards.value = cards.value.filter(c => c.id !== formData.id);
  // 2. 在前端的 menus 数组里找到那个新菜单对象
  const targetMenu = menus.value.find(m => m.id === payload.menu_id);
  if (targetMenu) {
    // 3. 自动高亮、选中新菜单，并触发 loadCards()
    handleMenuSelect(targetMenu); 
  }

      } else {
        const index = cards.value.findIndex(c => c.id === formData.id);
        if (index !== -1) {
          const updatedCard = {
            ...cards.value[index],
            ...(response.data?.data || {}),
            logo_url: payload.logo_url,
            title: payload.title,
            url: payload.url,
            desc: payload.desc,
            menu_id: payload.menu_id,
            sub_menu_id: payload.sub_menu_id,
          };
          const newCards = [...cards.value];
          newCards[index] = updatedCard;
          cards.value = newCards;
        }
      }

    } else {
      // 新建卡片分支
      const maxOrder = cards.value.length > 0
        ? Math.max(...cards.value.map(c => c.order || 0))
        : 0;
      const nextOrder = maxOrder + 1;
      
      const payload = {
        menu_id: activeMenu.value.id,
        sub_menu_id: formData.sub_menu_id || null,
        title: formData.title,
        url: formData.url,
        logo_url: formData.logo_url || '',
        custom_logo_path: formData.custom_logo_path || '',
        desc: formData.desc || formData.description || '',
        order: nextOrder
      };
      
      const res = await apiAddCard(payload);
      const newCard = {
        ...payload,
        ...(res.data?.data || res.data || {}),
        logo_url: payload.logo_url,
      };
      
      cards.value = [...cards.value, newCard];
      
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
    
    showSiteModal.value = false;
    
  } catch (e) {
    console.error('保存失败:', e);
    alert('保存失败: ' + (e.response?.data?.error || e.message));
  } finally {
    isEditingSite.value = false;
    currentSiteData.value = null;
  }
};

const pendingdeleteCardId = ref(null);
const showdeleteCardConfirm = ref(false);

function confirmdeleteCard(id) {
  pendingdeleteCardId.value = id;
  showdeleteCardConfirm.value = true;
}
const deleteCard = async () => {
  const id = pendingdeleteCardId.value;
  if (!id) return;
  try {
    await apiDeleteCard(id);
    cards.value = cards.value.filter(c => c.id !== id);
    pendingdeleteCardId.value = null;
    console.log('🟢 删除成功');
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
};

// === 快速导入 & 用户管理功能 ===
const showQuickImportModal = ref(false);
const showUserManageModal = ref(false); 

const openQuickImport = () => {
  showQuickImportModal.value = true;
  showUserMenu.value = false;
};

const handleBatchImport = async ({ menuId, sites, done }) => {
  try {
    let currentMaxOrder = cards.value.length > 0 
      ? Math.max(...cards.value.map(c => c.sort_order || 0)) 
      : 0;
    const promises = sites.map((site, index) => {
      const thisOrder = currentMaxOrder + index + 1;
      return apiAddCard({
        menu_id: menuId,
        sub_menu_id: null,
        title: site.title,
        url: site.url,
        sort_order: thisOrder
      });
    });
    await Promise.all(promises);
    alert(`成功导入 ${sites.length} 个站点！`);
    if (activeMenu.value?.id === menuId) {
      await loadCards();
    }
  } catch (e) {
    alert('导入错误: ' + e.message);
  } finally {
    done();
  }
};

const openUserManagement = () => {
  showUserManageModal.value = true;
  showUserMenu.value = false;
};

const openSystemSettings = () => {
  showSystemSettings.value = true;
  showUserMenu.value = false;
};

watch([activeMenu, activeSubMenu], loadCards);


// ==================== 搜索与工具 ====================
const searchQuery = ref('');
const searchEngines = [
  { name: 'site', label: '站内', placeholder: '搜索书签...', icon: 'site', url: q => `/search?query=${q}` }, 
  { name: 'google', label: 'Google', placeholder: 'Google 搜索...', icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=64', url: q => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { name: 'baidu', label: '百度', placeholder: '百度搜索...', icon: 'https://www.google.com/s2/favicons?domain=baidu.com&sz=64', url: q => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}` },
  { name: 'bing', label: 'B ing', placeholder: 'Bing 搜索...', icon: 'https://www.google.com/s2/favicons?domain=bing.com&sz=64', url: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
  { name: 'github', label: 'GitHub', placeholder: 'GitHub 搜索...', icon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64', url: q => `https://github.com/search?q=${encodeURIComponent(q)}&type=repositories` },
  { name: 'Youtube', label: 'Youtube', placeholder: 'youtube搜索...', icon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64', url: q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
  { name: 'bilibili', label: '哔哩哔哩', placeholder: '哔哩搜索...', icon: 'https://www.google.com/s2/favicons?domain=bilibili.com&sz=64', url: q => `https://search.bilibili.com/all?keyword=${encodeURIComponent(q)}` },

];

const selectedEngine = ref(searchEngines[0]);

const filteredCards = computed(() => {
  if (!searchQuery.value) return cards.value;
  if (selectedEngine.value.name === 'site') {
    const query = searchQuery.value.toLowerCase();
    return cards.value.filter(c => c.title.toLowerCase().includes(query) || (c.desc && c.desc.toLowerCase().includes(query)));
  }
  return cards.value;
});

const handleSearch = () => {
  if (!searchQuery.value.trim()) return;
  if (selectedEngine.value.name !== 'site') {
    window.open(selectedEngine.value.url(searchQuery.value), '_blank');
  }
};

// ==================== 数据备份与恢复 ====================
const showexportDataConfirm = ref(false);
function confirmexportData() {
  showexportDataConfirm  .value = true;
  showUserMenu.value = false; 
}

const exportData = async () => {
  
  try {
    const fullData = { version: '2.0', date: new Date().toISOString(), menus: [] };
    
    for (const menu of menus.value) {
      const menuObj = { ...menu, subMenus: [], cards: [] };
      
      // 备份子菜单
      try {
        const subRes = await getSubMenus(menu.id);
        menuObj.subMenus = subRes.data || [];
      } catch (e) {
        menuObj.subMenus = [];
      }

      // 备份主菜单下的卡片（不属于任何子菜单的）
      try {
        const res = await getCards(menu.id);
        menuObj.cards = res.data || [];
      } catch (e) {
        menuObj.cards = [];
      }

      // 备份每个子菜单下的卡片
      for (const sub of menuObj.subMenus) {
        try {
          const subCardsRes = await getCards(menu.id, sub.id);
          sub.cards = subCardsRes.data || [];
        } catch (e) {
          sub.cards = [];
        }
      }

      fullData.menus.push(menuObj);
    }
    
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nav-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showUserMenu.value = false;
  } catch (e) {
    alert('备份失败: ' + e.message);
  }
};

/* =========== 进度条状态和逻辑 =========== */
// ============================================================
// 恢复数据相关状态（替换原来的 importState 单个变量声明处）
// ============================================================
const importState = reactive({
  visible: false,
  percent: 0,
  text: '准备中...'
});

// 导入前确认弹窗
const showImportConfirm = ref(false);
const pendingImportData = ref(null);
const importPreview = reactive({ menuCount: 0, subMenuCount: 0, cardCount: 0 });

// 导入完成结果弹窗
const showImportResult = ref(false);
const importResult = reactive({ menuCount: 0, subMenuCount: 0, cardCount: 0 });


// ============================================================
// importData：支持新格式（menus）和旧格式（groups + sites，
// 子菜单通过 group.parent_id 指向父菜单）
// ============================================================
const importData = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const raw = JSON.parse(e.target.result);
      const data = normalizeImportData(raw);

      if (!data.menus || !data.menus.length) throw new Error('无效的备份文件：未找到菜单数据');

      let menuCount = 0, subMenuCount = 0, cardCount = 0;
      data.menus.forEach(m => {
        menuCount += 1;
        if (m.cards?.length) cardCount += m.cards.length;
        if (m.subMenus?.length) {
          subMenuCount += m.subMenus.length;
          m.subMenus.forEach(sub => {
            if (sub.cards?.length) cardCount += sub.cards.length;
          });
        }
      });

      importPreview.menuCount = menuCount;
      importPreview.subMenuCount = subMenuCount;
      importPreview.cardCount = cardCount;

      pendingImportData.value = data;
      showImportConfirm.value = true;

    } catch (err) {
      alert('❌ 文件解析失败: ' + err.message);
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
};

// ============================================================
// 格式转换：groups（含 parent_id）+ sites（平铺）→ menus 嵌套结构
// ============================================================
function normalizeImportData(raw) {
  // 新格式：已经是 menus 嵌套结构，直接返回
  if (raw.menus) {
    return raw;
  }

  // 旧格式：groups + sites，子菜单用 parent_id 标记归属
  if (raw.groups && raw.sites) {
    // 1. 拆分顶层菜单和子菜单
    const topGroups = raw.groups.filter(g => !g.parent_id);
    const subGroups = raw.groups.filter(g => g.parent_id);

    // 2. 按 group_id 把站点分组，方便查找
    const sitesByGroupId = {};
    raw.sites.forEach(site => {
      const gid = site.group_id;
      if (!sitesByGroupId[gid]) sitesByGroupId[gid] = [];
      sitesByGroupId[gid].push(site);
    });

    const toCard = (site) => ({
      title: site.name,
      url: site.url,
      logo_url: site.icon || '',
      description: site.description || site.notes || '',
      sort_order: site.order_num || 0
    });

    // 3. 重建 menus 嵌套结构
    const menus = topGroups
      .sort((a, b) => (a.order_num || 0) - (b.order_num || 0))
      .map(group => {
        // 该顶层菜单直属的站点
        const directSites = (sitesByGroupId[group.id] || [])
          .sort((a, b) => (a.order_num || 0) - (b.order_num || 0));

        // 属于该顶层菜单的子菜单
        const children = subGroups
          .filter(sub => sub.parent_id === group.id)
          .sort((a, b) => (a.order_num || 0) - (b.order_num || 0))
          .map(sub => {
            const subSites = (sitesByGroupId[sub.id] || [])
              .sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
            return {
              name: sub.name,
              order_num: sub.order_num || 0,
              cards: subSites.map(toCard)
            };
          });

        return {
          name: group.name,
          order: group.order_num || 0,
          subMenus: children,
          cards: directSites.map(toCard)
        };
      });

    return {
      version: raw.version ? String(raw.version) + '-legacy' : '1.1-legacy',
      menus,
      configs: raw.configs || null
    };
  }

  throw new Error('无法识别的备份文件格式');
}

// ============================================================
// 补充：如果备份带有 configs，导入完成后可选择一并恢复系统设置
// 在 startImport 成功导入菜单/卡片之后，加上这段：
// ============================================================
/*
    if (data.configs && restoreConfigsToo.value) {
      try {
        await saveConfigs(data.configs);
      } catch (e) {
        console.warn('系统设置恢复失败，但菜单数据已成功导入:', e);
      }
    }
*/

// 需要在 importPreview 附近新增一个开关状态：
// const restoreConfigsToo = ref(true);
// const hasConfigsInBackup = computed(() => !!pendingImportData.value?.configs);


// ============================================================
// 用户在确认弹窗里点击"开始恢复"后执行
// ============================================================
const startImport = async () => {
  const data = pendingImportData.value;
  if (!data) return;

  showUserMenu.value = false;
  importState.visible = true;
  importState.percent = 0;

  const totalItems = importPreview.menuCount + importPreview.subMenuCount + importPreview.cardCount;
  let processedCount = 0;

  const updateProgress = (msg) => {
    processedCount++;
    importState.percent = Math.min(Math.floor((processedCount / totalItems) * 100), 99);
    importState.text = msg;
  };

  try {
    for (const menu of data.menus) {
      const menuRes = await apiAddMenu({ name: menu.name, order: 9999 });
      const newMenuId = menuRes.data.id;
      updateProgress(`正在创建菜单: ${menu.name}`);

      if (menu.cards?.length) {
        for (const card of menu.cards) {
          await apiAddCard({
            menu_id: newMenuId,
            sub_menu_id: null,
            title: card.title,
            url: card.url,
            description: card.description || card.desc || '',
            logo_url: card.logo_url || '',
            custom_logo_path: card.custom_logo_path || '',
            sort_order: card.sort_order || card.order || 0
          });
          updateProgress(`正在导入: ${card.title}`);
        }
      }

      if (menu.subMenus?.length) {
        for (const sub of menu.subMenus) {
          const subRes = await addSubMenu(newMenuId, {
            name: sub.name,
            order_num: sub.order_num || 0
          });
          const newSubId = subRes.data.id;
          updateProgress(`正在创建子菜单: ${sub.name}`);

          if (sub.cards?.length) {
            for (const card of sub.cards) {
              await apiAddCard({
                menu_id: newMenuId,
                sub_menu_id: newSubId,
                title: card.title,
                url: card.url,
                description: card.description || card.desc || '',
                logo_url: card.logo_url || '',
                custom_logo_path: card.custom_logo_path || '',
                sort_order: card.sort_order || card.order || 0
              });
              updateProgress(`正在导入: ${card.title}`);
            }
          }
        }
      }
    }

    importState.text = '恢复完成！';
    importState.percent = 100;

    // 记录最终结果，用于结果弹窗展示
    importResult.menuCount = importPreview.menuCount;
    importResult.subMenuCount = importPreview.subMenuCount;
    importResult.cardCount = importPreview.cardCount;

    setTimeout(() => {
      importState.visible = false;
      showImportResult.value = true; // 打开玻璃结果弹窗，替代原来的 alert()
    }, 400);

  } catch (err) {
    console.error(err);
    importState.visible = false;
    alert('❌ 恢复失败: ' + err.message);
  } finally {
    pendingImportData.value = null;
  }
};


// ============================================================
// 结果弹窗点击"完成"后刷新页面
// ============================================================
const finishImport = () => {
  showImportResult.value = false;
  window.location.reload();
};

const handleLogoError = (e) => e.target.style.display = 'none';
const vFocus = { mounted: (el) => el.focus() };
// v-focus-if-visible 指令（在 vFocus 附近添加）
const vFocusIfVisible = {
  updated(el, binding) {
    if (binding.value) requestAnimationFrame(() => el.focus());
  }
};
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) binding.value();
    };
    document.addEventListener('click', el._clickOutside);
  },
  unmounted(el) { document.removeEventListener('click', el._clickOutside); delete el._clickOutside; }
};

// ==================== 移动端滑动切换菜单 ====================
let touchStartX = 0;
let touchEndX = 0;
let touchStartTime = 0;
let isSwiping = false;

const handleTouchStart = (e) => {
   if (isAdmin.value) return;
  touchStartX = e.changedTouches[0].screenX;
  touchStartTime = Date.now();
  isSwiping = true;
};

const handleTouchMove = (e) => {
   if (!isSwiping || isAdmin.value) return;
  const touchCurrentX = e.changedTouches[0].screenX;
  const diff = touchCurrentX - touchStartX;
  if (Math.abs(diff) > 100) {
    e.preventDefault();
  }
};

const handleTouchEnd = (e) => {
 if (!isSwiping || isAdmin.value) return;
  touchEndX = e.changedTouches[0].screenX;
  const touchDuration = Date.now() - touchStartTime;
  isSwiping = false;
  handleSwipe(touchDuration);
};

const handleSwipe = (duration) => {
  const swipeDistance = touchStartX - touchEndX;
  const swipeThreshold = 50; 
  const swipeSpeed = Math.abs(swipeDistance) / duration;
  if (Math.abs(swipeDistance) > swipeThreshold || swipeSpeed > 0.5) {
    if (swipeDistance > 0) {
      switchToNextMenu(); 
    } else {
      switchToPreviousMenu(); 
    }
  }
};

const switchToNextMenu = () => {
  if (!menus.value.length) return;
  const currentIndex = menus.value.findIndex(m => m.id === activeMenu.value?.id);
  if (currentIndex === -1 || currentIndex === menus.value.length - 1) return;
  const nextMenu = menus.value[currentIndex + 1];
  handleMenuSelect(nextMenu);
  if (navigator.vibrate) navigator.vibrate(10);
};

const switchToPreviousMenu = () => {
  if (!menus.value.length) return;
  const currentIndex = menus.value.findIndex(m => m.id === activeMenu.value?.id);
  if (currentIndex <= 0) return;
  const prevMenu = menus.value[currentIndex - 1];
  handleMenuSelect(prevMenu);
  if (navigator.vibrate) navigator.vibrate(10);
};
onMounted(async () => {
    // 预加载搜索引擎图标
  searchEngines.forEach(engine => {
    if (engine.icon !== 'site') {
      const img = new Image();
      img.src = engine.icon;
    }
  });
  
  // ... 原有的 onMounted 代码
  await loadMenus();  
  // 加载系统配置
  try {
    const res = await getConfigs();
    const c = res.data;
    if (c['site.copyright']) siteConfig.value.copyright = c['site.copyright'];
    if (c['site.desktopColumns']) siteConfig.value.desktopColumns = parseInt(c['site.desktopColumns']);
    if (c['site.mobileColumns']) siteConfig.value.mobileColumns = parseInt(c['site.mobileColumns']);
    if (c['site.defaultEngine']) {
      const engine = searchEngines.find(e => e.name === c['site.defaultEngine']);
      if (engine) selectedEngine.value = engine;
    }
    if (c['site.backgroundImage']) siteConfig.value.backgroundImage = c['site.backgroundImage'];
    if (c['site.backgroundOpacity']) siteConfig.value.backgroundOpacity = parseFloat(c['site.backgroundOpacity']);
  } catch (e) {
    console.error('加载配置失败:', e);
  }

  if (activeMenu.value) {
    await loadCards();
    setTimeout(() => {
      const activeMenuItem = document.querySelector('.menu-item.active');
      if (activeMenuItem) {
        activeMenuItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 300);
  }
});

</script>

 <style scoped>
.bg-wallpaper {
  position: fixed; inset: 0; z-index: 0;
  background-size: cover; background-position: center;
  pointer-events: none;
}

/* ===== 全局变量 ===== */
.home-container {
  --primary-color: #00ff9d;
  --bg-color: #e0e5ec;
  --text-color: #4a5568;
  --card-bg: #e0e5ec;
  --header-bg: rgba(224, 229, 236, 0.85);

  min-height: 100vh; background-color: var(--bg-color); color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease; padding-top: 70px;
  overflow-x: hidden; width: 100%;
}
.home-container.dark-mode {
  --bg-color: #1a1b1e;
  --text-color: #e0e0e0;
  --card-bg: #25262b;
  --header-bg: rgba(26, 27, 30, 0.8);
}

/* Header */
.header-fixed {
  position: fixed; top: 0; left: 0; right: 0; height: 64px;
  background: var(--header-bg); backdrop-filter: blur(20px);
  display: flex; justify-content: center; padding: 0 32px; z-index: 1000;
  box-shadow: 0 1px 0 rgba(0,0,0,0.05);
}
.header-inner { width: 100%; max-width: 1400px; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 12px; }
.site-logo { height: 40px; width: auto; }
.site-title { font-weight: 800; font-size: 1.4rem; letter-spacing: -0.5px; color: var(--text-color); }
.header-right { display: flex; gap: 16px; align-items: center; }

/* Icon Button */
.icon-btn {
  background: transparent; border: none; cursor: pointer; color: var(--text-color); padding: 6px;
  border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.icon-btn:hover { background: var(--bg-color); box-shadow: inset 2px 2px 5px rgba(163, 177, 198, 0.4), inset -2px -2px 5px rgba(255,255,255,0.5); color: var(--primary-color); }
.dark-mode .icon-btn:hover { box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.3); }

/* =========================================
   管理员头像按钮专属样式 (新增部分)
   ========================================= */
.header-right .admin-btn {
  width: 38px;
  height: 38px;
  border-radius: 50% !important;
   padding: 0;
  background-color: #00bcd4;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.4);
 transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 1. 未登录状态：保持原来的蓝色 */
.admin-btn.is-logged-out {
  background-color: #00bcd4 !important; 
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.4) !important;
}

/* 2. 普通用户登录：显示为灰色 */
.admin-btn.is-user {
  background-color: #6b7280 !important; /* 经典深灰色 */
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4) !important;
}

/* 3. 管理员登录：显示为红色 */
.admin-btn.is-admin {
  background-color: #ff4d4f !important;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4) !important;
}


.header-right .admin-btn:hover {
  background-color: #00acc1;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 188, 212, 0.5);
}

.header-right .admin-btn.is-logged-in {
  background-color: #ff4d4f;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
}

.header-right .admin-btn.is-logged-in:hover {
  background-color: #ff7875;
  box-shadow: 0 6px 16px rgba(255, 77, 79, 0.5);
}
/* ===== Dropdown ===== */
.user-menu-container { position: relative; }
.dropdown-menu {
  position: absolute; top: 120%; right: 0; background: var(--bg-color); border-radius: 16px;
  padding: 10px 0; min-width: 180px; z-index: 1001; border: none;
  box-shadow: 6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255,255,255,0.5);
}
.dark-mode .dropdown-menu { background: #25262b; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); }
.menu-header-label { padding: 8px 20px; font-size: 12px; color: var(--text-color); opacity: 0.5; font-weight: bold; }
.menu-item { padding: 12px 20px; color: var(--text-color); cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 10px; font-weight: 500; transition: all 0.2s; }
.menu-icon { font-size: 16px; min-width: 20px; text-align: center; }
.menu-item:hover { color: var(--primary-color); background: rgba(0,0,0,0.02); }
.dark-mode .menu-item:hover { background: rgba(255,255,255,0.05); }
.menu-divider { height: 1px; background: rgba(163, 177, 198, 0.3); margin: 6px 0; }
.logout { color: #ff4d4f; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0 !important; }
.is-disabled { opacity: 0.4; cursor: not-allowed !important; pointer-events: none; }
.logout-btn {
  background: #ff4d4f !important;
  box-shadow: 0 4px 20px rgba(255, 77, 79, 0.3) !important;
}
.logout-btn:hover {
  background: #ff7875 !important;
  box-shadow: 0 6px 24px rgba(255, 77, 79, 0.45) !important;
}
/* ===== Sections ===== */
.menu-wrapper { margin: 0 0 20px; }
.search-section {
  padding: 0 20px 30px; display: flex; justify-content: center;
  overflow: visible; position: relative; z-index: 100;
}
.search-box-wrapper { width: 100%; max-width: 640px; }
.content-area { width: 100%; max-width: 1400px; margin: 0 auto; padding: 0 50px 60px; box-sizing: border-box; overflow-x: hidden; transition: opacity 0.3s ease; touch-action: pan-y; }
@media (max-width: 768px) { .content-area { padding: 0 16px 60px; } }
@media (max-width: 768px) { .content-area:active { opacity: 0.95; } }

/* ===== Search ===== */
.search-container {
  display: flex; align-items: center; background: var(--card-bg);
  border-radius: 16px; padding: 6px 12px; width: 100%;
  border: 1px solid var(--card-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1);
  backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative;
}
.dark-mode .search-container {
  background: var(--card-bg); border: 1px solid var(--card-border);
  box-shadow: 0 4px 6px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
}
.search-container:hover { transform: translateY(-4px) scale(1.01); border-color: rgba(0,255,157,0.4); box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 12px 32px rgba(0,0,0,0.15), 0 0 30px rgba(0,255,157,0.25), inset 0 1px 0 rgba(255,255,255,0.2); }
.dark-mode .search-container:hover { border-color: rgba(255,255,255,0.4); box-shadow: 0 12px 32px rgba(0,0,0,0.6), 0 16px 48px rgba(0,0,0,0.8), 0 0 40px rgba(0,255,157,0.3), inset 0 1px 0 rgba(255,255,255,0.2); }
.search-container:focus-within { transform: translateY(-6px) scale(1.02); border-color: var(--primary-color); box-shadow: 0 12px 32px rgba(0,0,0,0.15), 0 16px 48px rgba(0,0,0,0.2), 0 0 0 3px rgba(0,255,157,0.2), 0 0 50px rgba(0,255,157,0.4); }
.dark-mode .search-container:focus-within { box-shadow: 0 16px 48px rgba(0,0,0,0.6), 0 20px 64px rgba(0,0,0,0.8), 0 0 0 3px rgba(0,255,157,0.25), 0 0 60px rgba(0,255,157,0.5); }

.engine-selector { position: relative; display: flex; align-items: center; margin-right: 8px; border-right: 2px solid rgba(0,255,157,0.2); padding-right: 10px; flex-shrink: 0; }
.engine-current { display: flex; align-items: center; gap: 4px; cursor: pointer; padding: 2px 4px; border-radius: 8px; transition: all 0.2s; }
.engine-current:hover { background: rgba(0,255,157,0.1); }
.engine-icon { width: 22px; height: 22px; object-fit: contain; border-radius: 4px; }
.engine-emoji { font-size: 16px; font-weight: 700; line-height: 1; color: var(--text-color); }
.engine-arrow { font-size: 10px; opacity: 0.5; color: var(--text-color); }
.engine-dropdown {
  position: absolute; top: calc(100% + 8px); left: 0;
  background: var(--bg-color); border-radius: 12px; padding: 6px;
  z-index: 9999; min-width: 120px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
  display: flex; flex-direction: column; gap: 2px;
}
.dark-mode .engine-dropdown { background: #25262b; box-shadow: 0 8px 24px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); }
.engine-option { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.engine-option:hover { background: rgba(0,255,157,0.1); }
.engine-option.active { background: rgba(0,255,157,0.15); }
.engine-label { font-size: 13px; font-weight: 600; color: var(--text-color); }
.engine-option.active .engine-label { color: #00ff9d; }

.search-input { flex: 1; border: none; background: transparent; padding: 10px 8px; color: var(--text-color); font-size: 15px; outline: none; font-weight: 500; }
.search-input::placeholder { color: rgba(163,177,198,0.6); transition: color 0.2s; }
.search-container:focus-within .search-input::placeholder { color: rgba(0,255,157,0.5); }
.dark-mode .search-input::placeholder { color: rgba(255,255,255,0.4); }
.clear-btn { background: transparent; border: none; color: #888; cursor: pointer; padding: 0 8px; font-size: 18px; transition: all 0.2s; opacity: 0.6; display: flex; align-items: center; justify-content: center; }
.clear-btn:hover { color: var(--primary-color); opacity: 1; transform: scale(1.2) rotate(90deg); }
.search-btn { background: var(--icon-bg); color: var(--primary-color); width: 38px; height: 38px; border-radius: 10px; border: 1px solid rgba(0,255,157,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); }
.dark-mode .search-btn { background: var(--card-bg); box-shadow: 4px 4px 8px rgba(0,0,0,0.4), -4px -4px 8px rgba(255,255,255,0.05); }
.search-btn:hover { transform: translateY(-2px); box-shadow: 6px 6px 12px rgba(163,177,198,0.5), -6px -6px 12px rgba(255,255,255,0.6); }
.dark-mode .search-btn:hover { box-shadow: 6px 6px 12px rgba(0,0,0,0.5), -6px -6px 12px rgba(255,255,255,0.08); }
.search-btn:active { transform: translateY(0); box-shadow: inset 3px 3px 6px rgba(163,177,198,0.4), inset -3px -3px 6px rgba(255,255,255,0.5); }
.dark-mode .search-btn:active { box-shadow: inset 3px 3px 6px rgba(0,0,0,0.4), inset -3px -3px 6px rgba(255,255,255,0.05); }

@media (max-width: 768px) {
  .site-title { display: none; }
  .header-fixed { padding: 0 16px; }
  .header-inner { padding: 0; }
  .home-container { padding-top: 70px; }
  .header-inner, .content-area { padding-left: 12px !important; padding-right: 12px !important; }
  .search-section { padding: 0 16px 24px; }
  .search-container { padding: 6px 10px; }
  .search-input { padding: 12px 8px; font-size: 15px; }
  .search-btn { width: 40px; height: 40px; }
  .search-container:hover { transform: translateY(-2px) scale(1.005); }
}

/* ===== Footer ===== */
.footer { text-align: center; opacity: 0.6; padding: 20px; font-size: 13px; font-weight: 500; }

/* ================================================================
   弹窗私有样式（glass-theme.css 提供主体样式）
   ================================================================ */

/* 登录弹窗 */
.login-glass-dialog {
  padding: 40px; 
  border-radius: 24px; 
  width: 90%;                 /* 手机端自适应宽度 */
  max-width: 360px;           /* 电脑端最大限制宽度 */
  
  border: none; 
  animation: slideUp 0.3s ease; /* 从下方滑入的动画 */
  h3 { margin: 0 0 30px; text-align: center; font-size: 1.5rem;
  }

 }
 .login-glass-dialog .glass-form-group {
 margin-bottom: 28px;  
}
.login-glass-dialog .glass-input { 
  width: 100%;
  padding: 14px; 
  background: var(--bg-color); 
  border-radius: 12px; 
  color: var(--text-color); 
  border: none; 
  box-sizing: border-box; 
  outline: none;
  
  font-size: 15px;
 }

.login-glass-dialog .glass-actions {
  margin-top: 38px;  /* 输入框和按钮条之间的距离 */
}
.login-glass-dialog h3 {
  margin: 0 0 30px;  text-align: center;
  font-size: 1.4rem; font-weight: 700;
  color: var(--glass-text-color);
}
.login-btn { 
  width: 100%; 
  padding: 14px; 
  background: var(--primary-color);
  border: none; 
  border-radius: 12px; 
  color: #fff; 
  font-weight: bold; 
  cursor: pointer; 
  margin-top: 10px; 
  font-size: 16px;
  box-shadow: 4px 4px 10px rgba(0, 255, 157, 0.3); 
  transition: all 0.2s; }
.login-glass-dialog .admin-login-icon {
  margin: 0 auto 28px auto;  /* 头像下方间距也加大一点 */
}
.login-btn:hover { transform: translateY(-2px); box-shadow: 6px 6px 15px rgba(0, 255, 157, 0.4); }
.modal-btn:active { transform: translateY(0); }

/* admin 图标 */
.admin-login-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #00bcd4;                           /* 登录前：青色 */
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto 20px auto;
  box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); /* 具有弹性的过渡 */

}
/* 管理员：红色旋转 */
.admin-login-icon.logged-in-admin {
  background-color: #ff4d4f;                          /* 登录后：红色 */
  box-shadow: 0 4px 20px rgba(255, 77, 79, 0.6);
  transform: rotate(360deg) scale(1.1);               /* 旋转360°并轻微放大 */
}
/* 普通用户：灰色旋转 */
.admin-login-icon.logged-in-user {
  background-color: #6b7280;
  box-shadow: 0 4px 20px rgba(107, 114, 128, 0.5);
  transform: rotate(360deg) scale(1.1);
}
/* 9. 遮罩层及弹窗出现的逐帧渐变动画 */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* 10. 手机端对弹窗尺寸的收缩适配 */
@media (max-width: 768px) {
  .modal-content { padding: 30px 20px; }
}
.logout-dialog {
  max-width: 300px;
  text-align: center;
  background: rgba(255, 255, 255, 0.25) !important;
}

.dark-mode .logout-dialog {
  background: rgba(30, 32, 40, 0.40) !important;
}

.logout-dialog h3 {
  margin: 16px 0 24px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--glass-text-color);
}

.logout-btn {
  background: #ff4d4f !important;
  box-shadow: 0 4px 20px rgba(255, 77, 79, 0.3) !important;
}

.logout-btn:hover {
  background: #ff7875 !important;
  box-shadow: 0 6px 24px rgba(255, 77, 79, 0.45) !important;
}

/* 用户管理弹窗 */
.large-glass-dialog { 
  max-width: 900px; 
  width: 95%; 
  max-height: 85vh; 
  position: relative; /* 关键：让关闭按钮相对于整个弹窗定位，而不是 header */
  padding-top: 24px;  /* 顶部分开一些距离，给右上角的按钮和标题留出呼吸空间 */
}
.dialog-header { 
  display: flex; 
  justify-content: center; /* 完美的水平居中 */
  align-items: center; 
  margin-bottom: 20px; 
}


.dialog-header h3 { 
  margin: 0; 
  font-size: 1.2rem; 
  font-weight: 700; 
  color: var(--glass-text-color); 
}

.dialog-close-btn {
  background: transparent; 
  border: none; 
  font-size: 18px; 
  cursor: pointer;
  color: var(--glass-label-color); 
  
  /* 稍微加大一点宽高，更符合 Windows 现代关闭按钮的比例 */
  width: 46px; 
  height: 32px; 
  
  display: flex; 
  align-items: center; 
  justify-content: center;
  
  /* 完美的右上角绝对定位 */
  position: absolute; 
  top: 0; 
  right: 0; 
  
  /* 如果你的弹窗有圆角，按钮右上角也需要圆角，否则悬浮变红时会超出边界 */
  border-top-right-radius: 12px; /* 这里的数值建议跟 .large-glass-dialog 的圆角大小保持一致 */
  border-bottom-left-radius: 4px;
  
  transition: background-color 0.15s, color 0.15s;
}
/* 悬浮状态：Windows 经典的红底白字 */
.dialog-close-btn:hover { 
  background-color: #e81123; /* Windows 官方标准的关闭红 */
  color: #ffffff;            /* 文字或图标变纯白 */
}

/* 按下状态（可选）：Windows 点击时变深红 */
.dialog-close-btn:active {
  background-color: #f1707a;
  color: #ffffff;
}

/* ===== 导入确认/结果弹窗 ===== */
.import-preview-dialog {
  max-width: 340px;
  text-align: center;
  background: rgba(255, 255, 255, 0.30) !important;
  padding: 32px 28px 28px;
}

.dark-mode .import-preview-dialog {
  background: rgba(30, 32, 40, 0.55) !important;
}

.import-preview-dialog h3 {
  margin: 0 0 8px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--glass-text-color);
}

.confirm-desc {
  margin: 0 0 20px 0;
  font-size: 13px;
  color: var(--glass-label-color);
}

/* 统计数字展示 */
.result-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--glass-icon-bar-bg);
  border: 1px solid var(--glass-icon-bar-border);
  border-radius: 14px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-num {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--glass-primary);
  line-height: 1.1;
}

.stat-label {
  font-size: 12px;
  color: var(--glass-label-color);
  font-weight: 500;
}
.progress-track {
  width: 100%; height: 10px;
  background: var(--glass-input-bg);
  border: 1px solid var(--glass-input-border);
  border-radius: 10px; overflow: hidden;
  margin-bottom: 15px;
}

.progress-fill {
  height: 100%;
  background: var(--glass-primary);
  width: 0%;
  border-radius: 10px;
  transition: width 0.3s ease-out;
  box-shadow: 0 0 10px var(--glass-primary);
}

.result-confirm-btn {
  width: 100%;
}

/* 复用之前 ConfirmDialog 里的图标样式 */
.confirm-icon {
  width: 60px; height: 60px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; margin: 0 auto 16px auto;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.confirm-icon.icon-warning {
  background: rgba(255, 165, 0, 0.15);
  border-color: rgba(255, 165, 0, 0.3);
}
.confirm-icon.icon-success {
  background: rgba(0, 200, 122, 0.15);
  border-color: rgba(0, 200, 122, 0.3);
}


/* 添加菜单弹窗 label */
label {
  display: block; margin-bottom: 8px;
  font-size: 13px; font-weight: 600;
  color: var(--glass-label-color);
}

/* 动画 */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
