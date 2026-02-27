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
                 
          <div class="user-menu-container">
            <button 
              class="icon-btn admin-btn" 
              :class="{ 'is-logged-in': isLoggedIn }"
              @click.stop="handleUserIconClick"
            >
              <Icon name="user-cog" style="font-size: 20px;" />
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
           <button class="icon-btn" @click="toggleTheme" title="切换主题">
            <Icon :name="isDarkMode ? 'sun' : 'moon'" style="font-size: 26px;" />
          </button>
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
    
   <div 
      class="content-area"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
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
      :current-menu-id="activeMenu ? activeMenu.id : null"
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
          
          <div class="admin-login-icon" :class="{ 'logged-in': isLoggedIn }">
            <Icon name="user-cog" />
          </div>
          
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

// 👇 引入刚封装的图标组件
import Icon from '../components/Icon.vue'; 
  
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
  try {
    if (isEditingSite.value) {
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
      const index = cards.value.findIndex(c => c.id === formData.id);
      if (index !== -1) {
        const updatedCard = response.data?.data || payload;
        const newCards = [...cards.value];
        newCards[index] = updatedCard;
        cards.value = newCards;
      }
    } else {
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
      const newCard = res.data?.data || res.data || { ...payload, id: res.data?.id || Date.now() };
      
      cards.value = [...cards.value, newCard];
      
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
    
    showSiteModal.value = false;
    
  } catch (e) {
    console.error('保存失败:', e);
    alert('保存失败: ' + (e.response?.data?.error || e.message));
  }
};

const deleteCard = async (id) => {
  if (!confirm("确定删除此卡片？")) return;
  try {
    await apiDeleteCard(id);
    cards.value = cards.value.filter(c => c.id !== id);
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

// ==================== 移动端滑动切换菜单 ====================
let touchStartX = 0;
let touchEndX = 0;
let touchStartTime = 0;
let isSwiping = false;

const handleTouchStart = (e) => {
  if (isLoggedIn.value) return;
  touchStartX = e.changedTouches[0].screenX;
  touchStartTime = Date.now();
  isSwiping = true;
};

const handleTouchMove = (e) => {
  if (!isSwiping || isLoggedIn.value) return;
  const touchCurrentX = e.changedTouches[0].screenX;
  const diff = touchCurrentX - touchStartX;
  if (Math.abs(diff) > 100) {
    e.preventDefault();
  }
};

const handleTouchEnd = (e) => {
  if (!isSwiping || isLoggedIn.value) return;
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
  await loadMenus();
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
/* 全局样式 */
.home-container {
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

/* =========================================
   管理员头像按钮专属样式 (新增部分)
   ========================================= */
.header-right .admin-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  padding: 0;
  background-color: #00bcd4;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.4);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
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
.search-box-wrapper { width: 100%; max-width: 640px; }
.content-area { width: 100%; max-width: 1400px; margin: 0 auto; padding: 0 50px 60px; box-sizing: border-box; overflow-x: hidden; }

@media (max-width: 768px) {
  .content-area { padding: 0 16px 60px; }
}

/* Search */
.search-container {
  display: flex; align-items: center; background: var(--card-bg);
  border-radius: 16px; padding: 6px 12px; width: 100%;
  border: 1px solid var(--card-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
}

.dark-mode .search-container {
  background: var(--card-bg); border: 1px solid var(--card-border);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.5), 0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.search-container:hover {
  transform: translateY(-4px) scale(1.01); border-color: rgba(0, 255, 157, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(0, 0, 0, 0.15), 0 0 30px rgba(0, 255, 157, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.dark-mode .search-container:hover {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 255, 157, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.search-container:focus-within {
  transform: translateY(-6px) scale(1.02); border-color: var(--primary-color);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15), 0 16px 48px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(0, 255, 157, 0.2), 0 0 50px rgba(0, 255, 157, 0.4);
}

.dark-mode .search-container:focus-within {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 20px 64px rgba(0, 0, 0, 0.8), 0 0 0 3px rgba(0, 255, 157, 0.25), 0 0 60px rgba(0, 255, 157, 0.5);
}

.engine-select { 
  border: none; background: transparent; color: var(--text-color); font-weight: 700; padding-right: 10px; margin-right: 8px; border-right: 2px solid rgba(0, 255, 157, 0.2); outline: none; cursor: pointer; transition: all 0.2s; font-size: 13px;
}
.engine-select:hover { color: var(--primary-color); border-right-color: var(--primary-color); }
.engine-select option { background-color: var(--card-bg); color: var(--text-color); padding: 10px; font-weight: 600; }
.dark-mode .engine-select { border-right-color: rgba(0, 255, 157, 0.3); }
.dark-mode .engine-select option { background-color: #25262b; color: #e0e0e0; }

.search-input { 
  flex: 1; border: none; background: transparent; padding: 10px 8px; color: var(--text-color); font-size: 15px; outline: none; font-weight: 500;
}
.search-input::placeholder { color: rgba(163, 177, 198, 0.6); transition: color 0.2s; }
.search-container:focus-within .search-input::placeholder { color: rgba(0, 255, 157, 0.5); }
.dark-mode .search-input::placeholder { color: rgba(255, 255, 255, 0.4); }

.clear-btn { 
  background: transparent; border: none; color: #888; cursor: pointer; padding: 0 8px; font-size: 18px; transition: all 0.2s; opacity: 0.6; display: flex; align-items: center; justify-content: center;
}
.clear-btn:hover { color: var(--primary-color); opacity: 1; transform: scale(1.2) rotate(90deg); }

.search-btn { 
  background: var(--icon-bg); color: var(--primary-color); width: 38px; height: 38px; border-radius: 10px; border: 1px solid rgba(0, 255, 157, 0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.dark-mode .search-btn { 
  background: var(--card-bg);
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.4), -4px -4px 8px rgba(255, 255, 255, 0.05);
}

.search-btn:hover {
  transform: translateY(-2px); box-shadow: 6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.6);
}
.dark-mode .search-btn:hover {
  box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.08);
}

.search-btn:active {
  transform: translateY(0); box-shadow: inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5);
}
.dark-mode .search-btn:active {
  box-shadow: inset 3px 3px 6px rgba(0, 0, 0, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.05);
}

@media (max-width: 768px) {
  .search-section { padding: 0 16px 24px; }
  .search-container { padding: 6px 10px; }
  .search-input { padding: 12px 8px; font-size: 15px; }
  .search-btn { width: 40px; height: 40px; }
  .search-container:hover { transform: translateY(-2px) scale(1.005); }
}

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
/* =========================================
   弹窗顶部的管理员大图标样式
   ========================================= */
.admin-login-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #00bcd4; /* 登录前：青色背景 */
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto 20px auto; /* 居中并与下方文字留白 */
  box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); /* 带弹性的动画效果 */
}

.admin-login-icon.logged-in {
  background-color: #ff4d4f; /* 登录后：红色背景 */
  box-shadow: 0 4px 20px rgba(255, 77, 79, 0.6);
  transform: rotate(360deg) scale(1.1); /* 旋转一圈并稍微放大 */
}

  
/* Footer & Responsive */
.footer { text-align: center; opacity: 0.6; padding: 20px; font-size: 13px; font-weight: 500; }
@media (max-width: 768px) {
  .site-title { display: none; }
  .header-fixed { padding: 0 16px; }
  .header-inner { padding: 0; }
  .home-container { padding-top: 70px; }
  .modal-content { padding: 30px 20px; }
  
  .header-inner, 
  .content-area { padding-left: 12px !important; padding-right: 12px !important; }
}

/* =========== 进度条样式 =========== */
.import-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px); z-index: 9999; display: flex; align-items: center; justify-content: center;
}
.import-box {
  background: var(--card-bg); color: var(--text-color); width: 90%; max-width: 400px; padding: 30px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); text-align: center; border: 1px solid rgba(255,255,255,0.1);
}
.import-box h3 { margin: 0 0 20px 0; font-size: 1.2rem; color: var(--primary-color); }
.progress-track {
  width: 100%; height: 10px; background: rgba(120, 120, 120, 0.2); border-radius: 10px; overflow: hidden; margin-bottom: 15px; box-shadow: inset 1px 1px 3px rgba(0,0,0,0.1);
}
.progress-fill {
  height: 100%; background: var(--primary-color); width: 0%; border-radius: 10px; transition: width 0.3s ease-out; box-shadow: 0 0 10px var(--primary-color);
}
.import-status {
  display: flex; justify-content: space-between; font-size: 13px; color: var(--text-desc); font-weight: 500;
}
.percent-num { font-weight: bold; color: var(--text-color); }

/* 大号弹窗样式 */
.large-modal { width: 90%; max-width: 900px; max-height: 85vh; overflow-y: auto; padding: 25px; }
@media (max-width: 768px) { .large-modal { width: 95%; padding: 15px; } }

/* 移动端滑动优化 */
.content-area { transition: opacity 0.3s ease; touch-action: pan-y; }
@media (max-width: 768px) { .content-area:active { opacity: 0.95; } }
</style>

