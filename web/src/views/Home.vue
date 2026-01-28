<template>
  <div class="home-container" :class="{ 'dark-mode': isDarkMode }">
    
       <header class="header-fixed">
      <div class="header-inner">
                <div class="header-left">
          <img :src="currentLogo" alt="WebNavHub" class="site-logo" @error="handleLogoError" />
          
          <div style="display: flex !important; flex-direction: column; justify-content: center; margin-left: 10px; line-height: 1.2;">
            
            <span class="site-title" style="display: flex !important; margin: 0; align-items: center; font-size: 18px;">
              WebNav <span style="color: #FF6B6B; margin-left: 4px;">Hub</span>
            </span>
            
            <span style="display: block !important; font-size: 10px; color: #9ca3af; font-weight: normal; letter-spacing: 0.5px; white-space: nowrap; transform: scale(0.9); transform-origin: left;">
              Your Organized Internet Gateway
            </span>
          </div>
        </div>

        <div class="header-right">
          <button class="icon-btn" @click="toggleTheme" title="切换主题">
            <svg v-if="isDarkMode" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </button>
          
          <div class="user-menu-container">
            <button class="icon-btn" @click.stop="handleUserIconClick">
              <svg v-if="isLoggedIn" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff9d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" transform="translate(0, 1) scale(0.9)"></path><circle cx="8.5" cy="7" r="4" transform="translate(0, 1) scale(0.9)"></circle><circle cx="19" cy="11" r="2"></circle><path d="M19 8v1m0 4v1m2-3h1m-4 0h-1m2.8-2.1l-.7.7m-2.8 2.8l-.7.7m0-4.2l.7.7m2.8 2.8l.7.7"></path></svg>
            </button>
            
            <transition name="fade">
              <div v-if="showUserMenu && isLoggedIn" class="dropdown-menu" v-click-outside="closeUserMenu">
                <div class="menu-header-label">管理员菜单</div>
                <div class="menu-item" @click="openQuickImport"><span class="menu-icon">⚡</span> 快速导入</div>
                <div class="menu-item" @click="openUserManagement"><span class="menu-icon">👥</span> 用户管理</div>
                <div class="menu-item" @click="openSystemSettings"><span class="menu-icon">⚙️</span> 系统设置</div>
                <div class="menu-divider"></div>
                <div class="menu-item" @click="exportData"><span class="menu-icon">📤</span> 备份数据</div>
                <div class="menu-item">
                  <label for="importFile" style="cursor:pointer; display:flex; align-items:center; width:100%">
                    <span class="menu-icon">📥</span> 恢复数据
                  </label>
                  <input type="file" id="importFile" style="display:none" @change="importData" accept=".json"/>
                </div>
                <div class="menu-divider"></div>
                <div class="menu-item logout" @click="logout"><span class="menu-icon">🚪</span> 退出登录</div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </header>


    <div class="menu-wrapper">
      <MenuBar 
        :menus="menus" 
        :activeId="activeMenu?.id" 
        :activeSubMenuId="activeSubMenu?.id"
        :is-edit-mode="isLoggedIn"
        @select="handleMenuSelect"
        @update:menus="handleMenuSort"
        @add="addMenu"
        @delete="deleteMenu"
      />
    </div>
    
    <div class="search-section">
      <div class="search-box-wrapper">
        <div class="search-container">
          <select v-model="selectedEngine" class="engine-select">
            <option v-for="engine in searchEngines" :key="engine.name" :value="engine">
              {{ engine.label }}
            </option>
          </select>
          
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
    
    <div class="content-area">
      <CardGrid 
        :cards="filteredCards" 
        :is-edit-mode="isLoggedIn"
        @update:cards="handleCardSort"
        @edit="openEditModal"
        @delete="deleteCard"
        @add="openAddModal"
      />
    </div>

    <SiteModal 
      v-model:visible="showSiteModal"
      :is-edit="isEditingSite"
      :initial-data="currentSiteData"
      @save="handleSiteSave"
    />

    <QuickImportModal
      v-model:visible="showQuickImportModal"
      :menus="menus"
      :current-menu-id="activeMenu?.id"
      @import="handleBatchImport"
    />

    <Teleport to="body">
      <div v-if="showLoginModal" class="modal-overlay" @click="showLoginModal = false">
        <div class="modal-content login-modal" @click.stop>
          <h3>管理员登录</h3>
          <div class="form-group">
            <input v-model="loginForm.username" placeholder="用户名" class="modal-input" v-focus>
          </div>
          <div class="form-group">
            <input v-model="loginForm.password" type="password" placeholder="密码" class="modal-input" @keyup.enter="doLogin">
          </div>
          <button class="modal-btn primary" @click="doLogin">登录</button>
        </div>
      </div>
    </Teleport>

    <footer class="footer">
      <div class="footer-content">
        <p class="copyright">Copyright © 2026 Nav-Item</p>
      </div>
    </footer>
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
  updateMenuOrder  
} from '../api'; 

import MenuBar from '../components/MenuBar.vue';
import CardGrid from '../components/CardGrid.vue';
import SiteModal from '../components/SiteModal.vue';
import QuickImportModal from '../components/QuickImportModal.vue';

// ==================== 主题管理 ====================
// 1. 定义 isDarkMode (只定义这一次！)
const isDarkMode = ref(localStorage.getItem('theme') === 'dark');

// 2. 定义 currentLogo (依赖 isDarkMode)
// 暗色模式(True) -> 使用 logo-dark.svg
// 亮色模式(False) -> 使用 logo-light.svg
const currentLogo = computed(() => {
  return isDarkMode.value ? '/logo-dark.svg' : '/logo-light.svg';
});

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
};

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

const doLogin = async () => {
  try {
    const res = await login(loginForm.username, loginForm.password);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      isLoggedIn.value = true;
      showLoginModal.value = false;
      loginForm.username = '';
      loginForm.password = '';
    }
  } catch (e) {
    alert('登录失败: ' + (e.response?.data?.message || e.message));
  }
};

const logout = () => {
  if (confirm('确定退出登录？')) {
    localStorage.removeItem('token');
    isLoggedIn.value = false;
    showUserMenu.value = false;
  }
};

const closeUserMenu = () => {
  showUserMenu.value = false;
};

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

const handleMenuSelect = (menu, parent = null) => {
  if (parent) {
    activeMenu.value = parent;
    activeSubMenu.value = menu;
  } else {
    activeMenu.value = menu;
    activeSubMenu.value = null;
  }
  loadCards();
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

const addMenu = async () => {
  const name = prompt("请输入新菜单名称:");
  if (!name?.trim()) return;
  try {
    await apiAddMenu({ name: name.trim(), order: menus.value.length + 1 });
    await loadMenus();
  } catch (e) {
    alert('添加菜单失败: ' + e.message);
  }
};

const deleteMenu = async (id) => {
  if (!confirm("确定删除此菜单及内容？")) return;
  try {
    await apiDeleteMenu(id);
    if (activeMenu.value?.id === id) {
      activeMenu.value = menus.value[0] || null;
      activeSubMenu.value = null;
    }
    await loadMenus();
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
    cards.value = res.data;
  } catch (e) {
    console.error('加载卡片失败:', e);
    cards.value = [];
  }
};

const handleCardSort = async (newCards) => {
  const oldCards = [...cards.value];
  cards.value = newCards;
  try {
    await updateCardOrder(newCards.map(c => c.id));
    console.log('卡片顺序已保存');
  } catch (e) {
    console.error('卡片排序失败:', e);
    cards.value = oldCards;
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
  try {
    if (isEditingSite.value) {
      await apiUpdateCard(formData.id, formData);
    } else {
      await apiAddCard({
        menu_id: activeMenu.value.id,
        sub_menu_id: activeSubMenu.value?.id,
        ...formData
      });
    }
    await loadCards();
    showSiteModal.value = false;
  } catch (e) {
    alert('保存失败: ' + e.message);
  }
};

const deleteCard = async (id) => {
  if (!confirm("确定删除此卡片？")) return;
  try {
    await apiDeleteCard(id);
    await loadCards();
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
};

// === 快速导入功能 ===
const showQuickImportModal = ref(false);

const openQuickImport = () => {
  showQuickImportModal.value = true;
  showUserMenu.value = false;
};

const handleBatchImport = async ({ menuId, sites, done }) => {
  try {
    const promises = sites.map((site, index) => 
      apiAddCard({
        menu_id: menuId,
        sub_menu_id: null,
        title: site.title,
        url: site.url,
        order: cards.value.length + index + 1
      })
    );
    await Promise.all(promises);
    alert(`成功导入 ${sites.length} 个站点！`);
    if (activeMenu.value?.id === menuId) await loadCards();
  } catch (e) {
    alert('导入错误: ' + e.message);
  } finally {
    done();
  }
};

// 管理员占位功能
const openUserManagement = () => { alert('用户管理开发中...'); showUserMenu.value = false; };
const openSystemSettings = () => { alert('系统设置开发中...'); showUserMenu.value = false; };

watch([activeMenu, activeSubMenu], loadCards);

// ==================== 搜索与工具 ====================
const searchQuery = ref('');
const searchEngines = [
  { name: 'site', label: '站内', placeholder: '搜索书签...', url: q => `/search?query=${q}` }, 
  { name: 'google', label: 'Google', placeholder: 'Google 搜索...', url: q => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { name: 'baidu', label: '百度', placeholder: '百度搜索...', url: q => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}` },
  { name: 'bing', label: 'Bing', placeholder: 'Bing 搜索...', url: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
  { name: 'github', label: 'GitHub', placeholder: 'GitHub 搜索...', url: q => `https://github.com/search?q=${encodeURIComponent(q)}&type=repositories` },
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

const exportData = () => {
  const data = { menus: menus.value, version: '1.0', date: new Date() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nav-backup.json'; a.click();
  showUserMenu.value = false;
};
const importData = (event) => {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => { alert('文件已读取，需后端支持。'); console.log(JSON.parse(e.target.result)); };
  reader.readAsText(file);
  showUserMenu.value = false;
};

const handleLogoError = (e) => e.target.style.display = 'none';
const vFocus = { mounted: (el) => el.focus() };
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) binding.value();
    };
    document.addEventListener('click', el._clickOutside);
  },
  unmounted(el) { document.removeEventListener('click', el._clickOutside); delete el._clickOutside; }
};

onMounted(async () => {
  await loadMenus();
  if (activeMenu.value) await loadCards();
});
</script>

<style scoped>
/* 全局样式 */
.home-container {
  --primary-color: #00ff9d; --primary-gradient: linear-gradient(135deg, #00ff9d, #00b86e);
  --bg-color: #e0e5ec; --card-bg: #e0e5ec; --text-color: #4a5568; 
  --card-shadow: 9px 9px 16px rgb(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5);
  --card-shadow-hover: 12px 12px 20px rgb(163, 177, 198, 0.7), -12px -12px 20px rgba(255, 255, 255, 0.6);
  --card-border: none; --header-bg: rgba(224, 229, 236, 0.85);
  min-height: 100vh; background-color: var(--bg-color); color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease; padding-top: 70px;
}
.home-container.dark-mode {
  --bg-color: #1a1b1e; --text-color: #e0e0e0; --card-bg: #25262b; 
  --card-border: 1px solid rgba(255, 255, 255, 0.05);
  --card-shadow: 0 4px 12px rgba(0,0,0,0.3); --card-shadow-hover: 0 8px 24px rgba(0,0,0,0.5);
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
.site-logo { height: 32px; width: auto; }
.site-title { font-weight: 800; font-size: 1.4rem; letter-spacing: -0.5px; color: var(--text-color); }
.header-right { display: flex; gap: 16px; align-items: center; }

/* Icon Button */
.icon-btn {
  background: transparent; border: none; cursor: pointer; color: var(--text-color); padding: 6px;
  border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.icon-btn:hover { background: var(--bg-color); box-shadow: inset 2px 2px 5px rgba(163, 177, 198, 0.4), inset -2px -2px 5px rgba(255,255,255,0.5); color: var(--primary-color); }
.dark-mode .icon-btn:hover { box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.3); }

/* Dropdown */
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
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Sections */
.menu-wrapper { margin: 0 0 20px; }
.search-section { padding: 0 20px 30px; display: flex; justify-content: center; }
.content-area { padding-bottom: 60px; }

/* Search */
.search-container {
  display: flex; align-items: center; background: var(--card-bg); border-radius: 20px; padding: 6px 12px; width: 100%; max-width: 640px;
  box-shadow: inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.5); border: none; transition: all 0.3s;
}
.dark-mode .search-container { background: rgba(30, 30, 30, 0.8); box-shadow: inset 0 2px 4px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); }
.search-container:focus-within { box-shadow: inset 6px 6px 12px rgba(163, 177, 198, 0.5), inset -6px -6px 12px rgba(255, 255, 255, 0.6); }
.dark-mode .search-container:focus-within { box-shadow: inset 0 2px 6px rgba(0,0,0,0.5); border-color: var(--primary-color); }
.engine-select { border: none; background: transparent; color: var(--text-color); font-weight: 700; padding-right: 12px; margin-right: 8px; border-right: 1px solid rgba(163, 177, 198, 0.3); outline: none; cursor: pointer; }
.search-input { flex: 1; border: none; background: transparent; padding: 12px 0; color: var(--text-color); font-size: 16px; outline: none; font-weight: 500; }
.search-input::placeholder { color: rgba(163, 177, 198, 0.8); }
.dark-mode .search-input::placeholder { color: rgba(255, 255, 255, 0.4); }
.clear-btn { background: transparent; border: none; color: #888; cursor: pointer; padding: 0 8px; font-size: 18px; }
.search-btn { background: transparent; color: var(--primary-color); width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 6px rgba(163, 177, 198, 0.4), -3px -3px 6px rgba(255,255,255,0.5); }
.search-btn:hover { transform: scale(0.95); box-shadow: inset 2px 2px 5px rgba(163, 177, 198, 0.4), inset -2px -2px 5px rgba(255,255,255,0.5); }
.dark-mode .search-btn { box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
.dark-mode .search-btn:hover { box-shadow: inset 2px 2px 5px rgba(0,0,0,0.3); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-content { background: var(--bg-color); color: var(--text-color); padding: 40px; border-radius: 24px; width: 90%; max-width: 360px; box-shadow: 15px 15px 30px rgba(163, 177, 198, 0.6), -15px -15px 30px rgba(255,255,255,0.6); border: none; animation: slideUp 0.3s ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.dark-mode .modal-content { background: #25262b; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
.modal-content h3 { margin: 0 0 30px; text-align: center; font-size: 1.5rem; }
.form-group { margin-bottom: 20px; }
.modal-input { width: 100%; padding: 14px; background: var(--bg-color); border-radius: 12px; color: var(--text-color); border: none; box-sizing: border-box; outline: none; box-shadow: inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255,255,255,0.5); font-size: 15px; }
.dark-mode .modal-input { background: rgba(0,0,0,0.2); box-shadow: inset 0 2px 4px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); }
.modal-input:focus { color: var(--primary-color); box-shadow: inset 6px 6px 12px rgba(163, 177, 198, 0.5), inset -6px -6px 12px rgba(255, 255, 255, 0.6); }
.dark-mode .modal-input:focus { border-color: var(--primary-color); box-shadow: inset 0 2px 6px rgba(0,0,0,0.5); }
.modal-btn { width: 100%; padding: 14px; background: var(--primary-color); border: none; border-radius: 12px; color: #fff; font-weight: bold; cursor: pointer; margin-top: 10px; font-size: 16px; box-shadow: 4px 4px 10px rgba(0, 255, 157, 0.3); transition: all 0.2s; }
.modal-btn:hover { transform: translateY(-2px); box-shadow: 6px 6px 15px rgba(0, 255, 157, 0.4); }
.modal-btn:active { transform: translateY(0); }

/* Footer & Responsive */
.footer { text-align: center; opacity: 0.6; padding: 20px; font-size: 13px; font-weight: 500; }
@media (max-width: 768px) {
  .site-title { display: none; }
  .header-fixed { padding: 0 16px; }
  .header-inner { padding: 0; }
  .home-container { padding-top: 70px; }
  .modal-content { padding: 30px 20px; }
}
/* === 修复搜索下拉菜单白屏问题 === */
.engine-select option {
  /* 强制选项背景色跟随卡片背景 */
  background-color: var(--card-bg); 
  /* 强制选项文字颜色 */
  color: var(--text-color);
}

/* 针对部分浏览器的深色模式兼容 */
.dark-mode .engine-select option {
  background-color: #25262b; /* 强制深灰背景 */
  color: #e0e0e0;
}
/* <style scoped    */

  /* 手机端专用：缩小两侧边距，让卡片居中且空间更大 */
@media (max-width: 768px) {
  /* 针对外层容器 (根据你的代码习惯猜测是 header-inner 或 main-content) */
  .header-inner, 
  .cards-container, 
  .content-wrapper { 
    padding-left: 8px !important;  /* 原来可能是 16px 或 20px，改小一点 */
    padding-right: 8px !important; /* 右边也改小，保持对称 */
    width: auto !important;        /* 确保宽度自适应 */
  }

  /* 针对 Grid 布局的微调 */
  .cards-grid {
    gap: 10px !important; /* 稍微缩小两个卡片中间的缝隙 */
  }
}
   /* grok */ 
.content-area {
  max-width: 100%;
  padding: 0 16px 60px;
  box-sizing: border-box;
  overflow-x: hidden;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}

.card {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  /* 您的原有媒体查询代码 */

  /* 在这里追加或修改 */
  .content-area {
    padding: 0 8px 60px;
  }

  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .card {
    min-width: 0;
    padding: 12px;
    border-radius: 12px;
    box-shadow: 4px 4px 8px rgb(163, 177, 198, 0.4), -4px -4px 8px rgba(255, 255, 255, 0.4);
  }

  .dark-mode .card {
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
}

 /* === 手机端卡片防溢出优化（正确版本） === */
@media (max-width: 768px) {
  /* 1. 外层容器优化 */
  .content-area {
    padding: 0 10px 60px;
    width: 100%;
    box-sizing: border-box;
  }

  /* 2. 卡片网格强制使用深度选择器 */
  :deep(.card-grid),
  :deep(.cards-grid) {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
    width: 100% !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }

  /* 3. 单个卡片防溢出 */
  :deep(.card),
  :deep(.card-item) {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    padding: 12px !important;
  }

  /* 4. 卡片标题文字省略 */
  :deep(.card-title),
  :deep(.site-title-text) {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    max-width: 100% !important;
    font-size: 14px !important;
  }

  /* 5. 卡片描述文字省略 */
  :deep(.card-desc),
  :deep(.site-desc) {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    font-size: 12px !important;
  }

  /* 6. 按钮区域增大点击面积 */
  :deep(.card-actions) {
    display: flex !important;
    gap: 8px !important;
  }

  :deep(.card-action-btn),
  :deep(.edit-btn),
  :deep(.delete-btn),
  :deep(.card-edit),
  :deep(.card-delete) {
    min-width: 40px !important;
    min-height: 40px !important;
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 16px !important;
    border-radius: 8px !important;
  }
}

/* === another超小屏幕优化（宽度 < 375px）=== */
@media (max-width: 375px) {
  .content-area {
    padding: 0 8px 60px;
  }

  :deep(.card-grid),
  :deep(.cards-grid) {
    gap: 8px !important;
  }

  :deep(.card),
  :deep(.card-item) {
    padding: 10px !important;
  }
}
 
  </style>







