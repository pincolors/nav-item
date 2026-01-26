<template>
  <div v-if="!isLoggedIn" class="login-container">
    <div class="login-card">
      <h2 class="login-title">后台管理登录</h2>
      <div class="login-form">
        <input v-model="username" type="text" placeholder="用户名" class="login-input" @keyup.enter="handleLogin" />
        <div class="password-input-wrapper">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="密码"
            class="login-input password-input"
            @keyup.enter="handleLogin"
          />
          <span class="toggle-password" @click="showPassword = !showPassword">
            <svg v-if="showPassword" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2566d8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2566d8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-6.06"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47"/></svg>
          </span>
        </div>
        <div class="login-buttons">
          <button @click="goHome" class="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            返回首页
          </button>
          <button @click="handleLogin" class="login-btn" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>
        <p v-if="loginError" class="login-error">{{ loginError }}</p>
      </div>
    </div>
  </div>
  
  <div v-else class="admin-layout">
    <aside class="admin-sider" :class="{ open: siderOpen }" @click.self="closeSider">
      <div class="logo clickable" @click="page='welcome'; closeSider()">Admin</div>
      <ul class="menu-list">
        <li :class="{active: page==='menu'}" @click="page='menu'; closeSider()">栏目管理</li>
        <li :class="{active: page==='card'}" @click="page='card'; closeSider()">卡片管理</li>
        <li :class="{active: page==='ad'}" @click="page='ad'; closeSider()">广告管理</li>
        <li :class="{active: page==='friend'}" @click="page='friend'; closeSider()">友链管理</li>
        <li :class="{active: page==='user'}" @click="page='user'; closeSider()">用户管理</li>
      </ul>
    </aside>
    <main class="admin-main">
      <div class="admin-header">
        <button class="menu-toggle" @click="toggleSider">
          &#9776;
        </button>
        <div class="header-title">{{ pageTitle }}</div>
        <div class="header-actions">
          <span class="home-icon" @click="goHome" title="进入主页">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4h-4v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z" stroke="#2566d8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <button class="btn logout-btn" @click="logout">退出登录</button>
        </div>
      </div>
      <div class="admin-content">
        <div v-if="page==='welcome'" class="welcome-page">
          <h2 class="welcome-title">欢迎您进入 Nav-Item 后台管理系统</h2>
          <div class="welcome-cards">
            <div class="welcome-card">
              <div class="welcome-icon time-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#1abc9c" stroke-width="2"/><path d="M12 6v6l4 2" stroke="#1abc9c" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
              <div class="welcome-label">上次登录时间</div>
              <div class="welcome-value">{{ lastLoginTime || '--' }}</div>
            </div>
            <div class="welcome-card">
              <div class="welcome-icon ip-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#1abc9c" stroke-width="2"/><path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" stroke="#1abc9c" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#1abc9c"/></svg>
              </div>
              <div class="welcome-label">上次登录IP</div>
              <div class="welcome-value">{{ lastLoginIp || '--' }}</div>
            </div>
          </div>
        </div>
        <MenuManage v-if="page==='menu'" />
        <CardManage v-if="page==='card'" />
        <AdManage v-if="page==='ad'" />
        <FriendLinkManage v-if="page==='friend'" />
        <UserManage v-if="page==='user'" />
      </div>
      <footer class="admin-footer">
        <p class="admin-copyright">Copyright © 2025 Nav-Item | <a href="https://github.com/eooce/Nav-Item" target="_blank" class="footer-link">Powered by eooce</a></p>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { login } from '../api';
import MenuManage from './admin/MenuManage.vue';
import CardManage from './admin/CardManage.vue';
import AdManage from './admin/AdManage.vue';
import FriendLinkManage from './admin/FriendLinkManage.vue';
import UserManage from './admin/UserManage.vue';

const page = ref('welcome');
const lastLoginTime = ref('');
const lastLoginIp = ref('');
const isLoggedIn = ref(false);
const username = ref('');
const password = ref('');
const loading = ref(false);
const loginError = ref('');
const showPassword = ref(false);
const siderOpen = ref(false);

const pageTitle = computed(() => {
  switch (page.value) {
    case 'menu': return '栏目管理';
    case 'card': return '卡片管理';
    case 'ad': return '广告管理';
    case 'friend': return '友链管理';
    case 'user': return '用户管理';
    default: return '';
  }
});

onMounted(() => {
  const token = localStorage.getItem('token');
  isLoggedIn.value = !!token;
  if (isLoggedIn.value) {
    // 拉取用户信息
    fetchLastLoginInfo();
  }
});
async function fetchLastLoginInfo() {
  try {
    const res = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (res.ok) {
      const data = await res.json();
      lastLoginTime.value = data.last_login_time || '';
      lastLoginIp.value = data.last_login_ip || '';
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
}

async function handleLogin() {
  if (!username.value || !password.value) {
    loginError.value = '请输入用户名和密码';
    return;
  }
  
  loading.value = true;
  loginError.value = '';
  
  try {
    const response = await login(username.value, password.value);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      isLoggedIn.value = true;
      lastLoginTime.value = response.data.lastLoginTime || '';
      lastLoginIp.value = response.data.lastLoginIp || '';
    }
  } catch (error) {
    loginError.value = error.response?.data?.message || '登录失败，请检查用户名和密码';
  } finally {
    loading.value = false;
  }
}

function logout() {
  localStorage.removeItem('token');
  isLoggedIn.value = false;
  username.value = '';
  password.value = '';
  loginError.value = '';
}

function goHome() {
  window.open('/', '_blank');
}
function toggleSider() {
  siderOpen.value = !siderOpen.value;
}
function closeSider() {
  siderOpen.value = false;
}
</script>
<style scoped>
/* =========== 全局样式变量重构 =========== */
.home-container {
  /* 核心主色调：参考 React 代码中的 #00ff9d */
  --primary-color: #00ff9d; 
  --primary-gradient: linear-gradient(90deg, #00ff9d, #00b86e);
  
  /* 浅色模式背景 (React: #f0f0f0) */
  --bg-color: #f0f0f0;
  --text-color: #333;
  
  /* 浅色模式卡片 (React: rgba(0,0,0,0.04) + blur) */
  --card-bg: rgba(255, 255, 255, 0.6); 
  --card-border: 1px solid rgba(255, 255, 255, 0.4);
  --header-bg: rgba(255, 255, 255, 0.7);
  
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: all 0.3s ease;
  padding-top: 80px;
}

/* 暗黑模式适配 */
.home-container.dark-mode {
  /* 深色模式背景 (React: #121212) */
  --bg-color: #121212;
  --text-color: #ffffff;
  
  /* 深色模式卡片 (React: rgba(255,255,255,0.06)) */
  --card-bg: rgba(255, 255, 255, 0.06);
  --card-border: 1px solid rgba(255, 255, 255, 0.08);
  --header-bg: rgba(18, 18, 18, 0.7);
}

/* 1. 顶部 Header */
.header-fixed {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 64px;
  background: var(--header-bg);
  backdrop-filter: blur(16px); /* 顶部毛玻璃 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  z-index: 1000;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.header-left { display: flex; align-items: center; gap: 12px; }
.site-logo { height: 36px; width: auto; }
.site-title { font-weight: 800; font-size: 1.4rem; letter-spacing: -0.5px; }

.header-right { display: flex; gap: 12px; align-items: center; }

/* 图标按钮样式 */
.icon-btn {
  background: transparent; border: none; cursor: pointer;
  color: var(--text-color); padding: 8px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s;
}
.icon-btn:hover { 
  background: rgba(255,255,255,0.1); 
  color: var(--primary-color);
}

/* 2. 搜索框 (仿 React 项目样式) */
.search-section { padding: 30px 0; }
.search-container {
  display: flex;
  align-items: center;
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  border: var(--card-border);
  border-radius: 50px;
  padding: 6px 16px;
  width: 90%;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1); /* 柔和阴影 */
  transition: all 0.3s;
}
/* 搜索框聚焦发光 */
.search-container:focus-within { 
  box-shadow: 0 0 20px rgba(0, 255, 157, 0.3); 
  border-color: var(--primary-color);
}

.engine-select {
  border: none; background: transparent; color: var(--text-color);
  padding-right: 12px; margin-right: 8px;
  border-right: 1px solid rgba(128,128,128,0.2);
  outline: none; cursor: pointer; font-weight: bold;
}
.search-input {
  flex: 1; border: none; background: transparent;
  padding: 12px 0; color: var(--text-color); font-size: 16px; outline: none;
}
.search-btn {
  background: var(--primary-color); color: #000; /* 绿色背景黑字 */
  width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
  box-shadow: 0 0 10px var(--primary-color);
}
.search-btn:hover { transform: scale(1.1); }

/* 下拉菜单 */
.dropdown-menu {
  position: absolute; top: 110%; right: 0;
  background: rgba(30,30,30,0.9); backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px; padding: 8px 0; min-width: 180px; z-index: 1001;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}
.menu-item { padding: 12px 20px; color: #fff; cursor: pointer; font-size: 14px; }
.menu-item:hover { background: rgba(255,255,255,0.1); color: var(--primary-color); }

/* 弹窗样式 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px);
  z-index: 2000; display: flex; align-items: center; justify-content: center;
}
.modal-content {
  background: #1e1e1e; color: #fff; padding: 30px; border-radius: 20px;
  width: 320px; border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}
.modal-input {
  width: 100%; padding: 12px; background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; margin-bottom: 15px;
}
.modal-btn {
  width: 100%; padding: 12px; background: var(--primary-gradient);
  border: none; border-radius: 8px; color: #000; font-weight: bold; cursor: pointer;
  box-shadow: 0 0 15px rgba(0, 255, 157, 0.4);
}

.content-area { padding-bottom: 60px; }
.footer { text-align: center; opacity: 0.6; padding: 20px; font-size: 12px; }

/* 移动端适配 */
@media (max-width: 768px) {
  .site-title { display: none; }
  .header-fixed { padding: 0 16px; }
}
</style>

