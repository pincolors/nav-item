import axios from 'axios';

// 1. 创建 axios 实例 (自动处理 baseURL)
const request = axios.create({
  baseURL: '/api', 
  timeout: 5000
});

// 2. 请求拦截器：自动给所有请求加上 Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. 响应拦截器：自动处理 401 过期
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // window.location.reload(); // 可选：自动刷新跳转登录
    }
    return Promise.reject(error);
  }
);

// 🔥 必须导出默认对象
export default request;

/* ============================================================
   API 函数定义
   ============================================================ */

// === 认证 API ===
export const login = (username, password) => 
  request.post('/login', { username, password });

// === 菜单 API ===
export const getMenus = () => request.get('/menus');
export const addMenu = (data) => request.post('/menus', data);
export const updateMenu = (id, data) => request.put(`/menus/${id}`, data);
export const deleteMenu = (id) => request.delete(`/menus/${id}`);
export const updateMenuOrder = (ids) => request.post('/menus/sort', { ids });

// === 子菜单 API ===
export const getSubMenus = (menuId) => 
  request.get(`/menus/${menuId}/submenus`);
export const addSubMenu = (menuId, data) => 
  request.post(`/menus/${menuId}/submenus`, data);
export const updateSubMenu = (id, data) => 
  request.put(`/menus/submenus/${id}`, data);
export const deleteSubMenu = (id) => 
  request.delete(`/menus/submenus/${id}`);

// === 卡片 API ===
export const getCards = (menuId, subMenuId = null) => {
  const params = subMenuId ? { subMenuId } : {};
  return request.get(`/cards/${menuId}`, { params });
};

export const addCard = (data) => 
  request.post('/cards', data);

// ✅ 只保留一个 updateCard，添加 async/await
export const updateCard = async (id, data) => {
  return await request.put(`/cards/${id}`, data);
};

export const deleteCard = (id) => 
  request.delete(`/cards/${id}`);

export const updateCardOrder = (ids) => 
  request.post('/cards/sort', { ids });

// === 上传 API ===
export const uploadLogo = (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return request.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// === 广告 API ===
export const getAds = () => request.get('/ads');
export const addAd = (data) => request.post('/ads', data);
export const updateAd = (id, data) => request.put(`/ads/${id}`, data);
export const deleteAd = (id) => request.delete(`/ads/${id}`);

// === 友链 API ===
export const getFriends = () => request.get('/friends');
export const addFriend = (data) => request.post('/friends', data);
export const updateFriend = (id, data) => request.put(`/friends/${id}`, data);
export const deleteFriend = (id) => request.delete(`/friends/${id}`);

// === 用户 API ===
export const getUsers = () => request.get('/users');
export const getUserProfile = () => request.get('/users/profile');
export const changePassword = (oldPassword, newPassword) => 
  request.put('/users/password', { oldPassword, newPassword });
