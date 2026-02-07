<template>
  <div class="home-container" :class="{ 'dark-mode': isDarkMode }">
    
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
        :is-dark-mode="isDarkMode"
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
        :is-dark-mode="isDarkMode"
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

    <div v-if="showUserManageModal" class="modal-overlay" @click.self="showUserManageModal = false">
      <div class="modal-content large-modal">
        <div style="display:flex; justify-content:space-between; margin-bottom:20px; align-items:center;">
          <h3 style="margin:0">用户管理</h3>
          <button @click="showUserManageModal = false" style="background:none; border:none; color:inherit; cursor:pointer; font-size:20px; padding:0 10px;">✕</button>
        </div>
        
        <UserManage />
      </div>
    </div>

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

    <div v-if="importState.visible" class="import-overlay">
      <div class="import-box">
        <h3>正在恢复数据...</h3>
        
        <div class="progress-track">
          <div 
            class="progress-fill" 
            :style="{ width: importState.percent + '%' }"
          ></div>
        </div>
        
        <div class="import-status">
          <span>{{ importState.text }}</span>
          <span class="percent-num">{{ importState.percent }}%</span>
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
  updateMenuOrder  
} from '../api'; 

import MenuBar from '../components/MenuBar.vue';
import CardGrid from '../components/CardGrid.vue';
import SiteModal from '../components/SiteModal.vue';
import QuickImportModal from '../components/QuickImportModal.vue';
import UserManage from '../components/UserManage.vue';
  
// ==================== 主题管理 ====================
const isDarkMode = ref(localStorage.getItem('theme') === 'dark');

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
    cards.value = (res.data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
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
  try {
    if (isEditingSite.value) {
      console.log('🔵 开始编辑卡片 ID:', formData.id);
      console.log('🔵 发送数据:', formData);
      
      // 调用后端 API
      const response = await apiUpdateCard(formData.id, formData);
      console.log('🟢 后端返回:', response);
      
      // ⭐ 关键修复：强制触发响应式更新
      const index = cards.value.findIndex(c => c.id === formData.id);
      if (index !== -1) {
        // 创建全新的数组来触发 Vue 的响应式
        const newCards = [...cards.value];
        newCards[index] = { 
          ...newCards[index], 
          ...formData,
          // 确保包含所有字段
          id: formData.id,
          title: formData.title,
          url: formData.url,
          description: formData.description || '',
          logo_url: formData.logo_url || '',
          icon: formData.icon || '',
          sort_order: newCards[index].sort_order
        };
        cards.value = newCards;
        
        console.log('🟢 前端数据已更新，索引:', index);
        console.log('🟢 更新后的卡片:', cards.value[index]);
      } else {
        console.error('❌ 未找到卡片，ID:', formData.id);
      }
      
    } else {
      // 添加逻辑保持不变
      const maxOrder = cards.value.length > 0 
        ? Math.max(...cards.value.map(c => c.sort_order || c.order || 0)) 
        : 0;
      const nextOrder = maxOrder + 1;
      const payload = {
        menu_id: activeMenu.value.id,
        sub_menu_id: activeSubMenu.value?.id,
        ...formData,
        sort_order: nextOrder
      };
      
      console.log('🔵 开始添加卡片:', payload);
      const res = await apiAddCard(payload);
      const newCard = res.data || { ...payload, id: Date.now() };
      cards.value = [...cards.value, newCard]; // ⭐ 也改成创建新数组
      
      console.log('🟢 添加成功:', newCard);
      
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
    
    showSiteModal.value = false;
    
  } catch (e) {
    console.error('❌ 保存失败:', e);
    console.error('❌ 错误响应:', e.response?.data);
    alert('保存失败: ' + (e.response?.data?.message || e.message));
  }
};


const deleteCard = async (id) => {
  if (!confirm("确定删除此卡片？")) return;
  try {
    await apiDeleteCard(id);
    cards.value = cards.value.filter(c => c.id !== id);
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
};

// === 快速导入 & 用户管理功能 (整合版) ===
const showQuickImportModal = ref(false);
const showUserManageModal = ref(false); // ✅ 只定义一次

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

// ==================== 数据备份与恢复 ====================
const exportData = async () => {
  if (!confirm('确定要导出当前所有数据吗？')) return;
  try {
    const fullData = { version: '2.0', date: new Date().toISOString(), menus: [] };
    
    for (const menu of menus.value) {
      const menuObj = { ...menu, subMenus: [], cards: [] };
      const res = await getCards(menu.id);
      menuObj.cards = res.data || [];
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
const importState = reactive({
  visible: false,
  percent: 0,
  text: '准备中...'
});

const importData = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.menus) throw new Error('无效的备份文件');

      const menuCount = data.menus.length;
      let totalItems = menuCount; 
      data.menus.forEach(m => {
        if (m.cards) totalItems += m.cards.length;
      });

      if (!confirm(`解析成功！共 ${totalItems} 个项目。\n确定开始恢复吗？`)) {
        event.target.value = '';
        return;
      }

      importState.visible = true;
      importState.percent = 0;
      let processedCount = 0;

      const updateProgress = (msg) => {
        processedCount++;
        importState.percent = Math.floor((processedCount / totalItems) * 100);
        importState.text = msg;
      };

      for (const [index, menu] of data.menus.entries()) {
        const menuRes = await apiAddMenu({ 
          name: menu.name, 
          order: 9999 
        });
        const newMenuId = menuRes.data.id;
        
        updateProgress(`正在创建菜单: ${menu.name}`);

        if (menu.cards && menu.cards.length > 0) {
          for (const card of menu.cards) {
            await apiAddCard({
              menu_id: newMenuId,
              title: card.title,
              url: card.url,
              description: card.description || '',
              logo_url: card.logo_url || '', 
              icon: card.icon || '',       
              sort_order: card.sort_order || 0
            });
            updateProgress(`正在导入: ${card.title}`);
          }
        }
      }

      importState.text = '恢复完成！即将刷新...';
      importState.percent = 100;
      
      setTimeout(() => {
        alert('🎉 数据恢复成功！');
        window.location.reload();
      }, 500);

    } catch (err) {
      console.error(err);
      alert('❌ 恢复失败: ' + err.message);
      importState.visible = false;
    } finally {
      event.target.value = ''; 
      showUserMenu.value = false;
    }
  };
  reader.readAsText(file);
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
  /* 定义基本颜色变量 */
  --primary-color: #00ff9d; 
  --bg-color: #e0e5ec; 
  --text-color: #4a5568; 
  --card-bg: #e0e5ec; 
  --header-bg: rgba(224, 229, 236, 0.85);
  
  min-height: 100vh; background-color: var(--bg-color); color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease; padding-top: 70px;
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
.site-logo { height: 48px; width: auto; }
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

.content-area {
  width: 100%;
  max-width: 1400px; 
  margin: 0 auto;    
  padding: 0 50px 60px; 
  box-sizing: border-box;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .content-area {
    padding: 0 16px 60px;
  }
}

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
  
  .header-inner, 
  .content-area { 
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
}
.engine-select option {
  background-color: var(--card-bg); 
  color: var(--text-color);
}
.dark-mode .engine-select option {
  background-color: #25262b; 
  color: #e0e0e0;
}

/* =========== 👇 新增：进度条样式 👇 =========== */
.import-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-box {
  background: var(--card-bg);
  color: var(--text-color);
  width: 90%;
  max-width: 400px;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  text-align: center;
  border: 1px solid rgba(255,255,255,0.1);
}

.import-box h3 { margin: 0 0 20px 0; font-size: 1.2rem; color: var(--primary-color); }

.progress-track {
  width: 100%; height: 10px; background: rgba(120, 120, 120, 0.2);
  border-radius: 10px; overflow: hidden; margin-bottom: 15px;
  box-shadow: inset 1px 1px 3px rgba(0,0,0,0.1);
}

.progress-fill {
  height: 100%; background: var(--primary-color); width: 0%;
  border-radius: 10px; transition: width 0.3s ease-out;
  box-shadow: 0 0 10px var(--primary-color);
}

.import-status {
  display: flex; justify-content: space-between; font-size: 13px;
  color: var(--text-desc); font-weight: 500;
}

.percent-num { font-weight: bold; color: var(--text-color); }
/* ✅ 新增：大号弹窗样式（适配表格） */
.large-modal {
  width: 90%;          /* 宽度占屏幕 90% */
  max-width: 900px;    /* 最大宽度 900px */
  max-height: 85vh;    /* 防止太高超出屏幕 */
  overflow-y: auto;    /* 内容多了出现滚动条 */
  padding: 25px;
}

/* 手机端适配 */
@media (max-width: 768px) {
  .large-modal {
    width: 95%;
    padding: 15px;
  }
}

</style>


