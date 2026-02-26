<template>
  <div v-if="visible" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <h3>{{ isEdit ? '编辑站点' : '添加新站点' }}</h3>

      <div class="form-container">
        <div class="form-group">
          <label>标题 <span class="required">*</span></label>
          <input
            v-model="formData.title"
            class="neumorphic-input"
            placeholder="例如：Google"
            v-focus
          />
        </div>

        <div class="form-group">
          <label>链接 URL <span class="required">*</span></label>
          <input
            v-model="formData.url"
            class="neumorphic-input"
            placeholder="https://..."
          />
        </div>

        <div class="form-group">
          <label>Logo 图片链接（可选）</label>
                    <div class="icon-quick-select" v-if="domain">
            <span class="select-label">源：</span>
            
            <div class="icon-option" @click="selectIcon(googleIcon)" title="Google API">
              <img :src="googleIcon" loading="lazy" />
              <span class="src-name">Google</span>
            </div>

            <div class="icon-option" @click="selectIcon(ddgIcon)" title="DuckDuckGo">
              <img :src="ddgIcon" loading="lazy" />
              <span class="src-name">DDG</span>
            </div>

            <div class="icon-option" @click="selectIcon(horseIcon)" title="Icon Horse (强力扫描)">
              <img :src="horseIcon" loading="lazy" />
              <span class="src-name">Horse</span>
            </div>

            <div class="icon-option" @click="selectIcon(directIcon)" title="网站根目录直连">
              <img :src="directIcon" loading="lazy" />
              <span class="src-name">Direct</span>
            </div>
            
            <div class="icon-option" @click="selectIcon(textIcon)" title="文字兜底">
              <img :src="textIcon" loading="lazy" />
              <span class="src-name">Text</span>
            </div>
          </div>
         
          <div class="logo-input-wrapper">
            <input
              v-model="formData.logo_url"
              class="neumorphic-input"
              placeholder="https://.../logo.png"
            />
            <div class="logo-preview">
              <img
                v-if="formData.logo_url"
                :src="formData.logo_url"
                @error="handleImgError"
              />
              <span v-else class="placeholder">?</span>
            </div>
          </div>
          <small class="tip">点击上方推荐图标可直接填入，或留空自动获取</small>
        </div>

                <div class="form-group">
          <label>描述（可选）</label>
          <textarea
            v-model="formData.desc"
            class="neumorphic-input textarea"
            placeholder="简短描述..."
            rows="3"
          />
        </div>

        <!-- 🔥 新增：子菜单选择器 -->
        <div class="form-group" v-if="availableSubMenus.length > 0">
          <label>所属分类</label>
          <select v-model="formData.sub_menu_id" class="neumorphic-select">
            <option :value="null">主菜单</option>
            <option v-for="sub in availableSubMenus" :key="sub.id" :value="sub.id">
              {{ sub.name }}
            </option>
          </select>
        </div>

        <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>

      </div>

      <div class="modal-actions">
        <button class="neumorphic-btn cancel" @click="close">取消</button>
        <button class="neumorphic-btn save" @click="save">
          {{ isEdit ? '保存修改' : '立即添加' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue';
import { getSubMenus } from '../api';  // 🔥 新增：导入 API

const props = defineProps({
  visible: Boolean,
  isEdit: Boolean,
  initialData: Object,
  currentMenuId: Number  // 🔥 新增：当前菜单 ID
});

const emit = defineEmits(['update:visible', 'save']);

const formData = reactive({
  id: null,
  title: '',
  url: '',
  logo_url: '',
  desc: '',
  sub_menu_id: null  // 🔥 新增：子菜单 ID
});

const errorMsg = ref('');
const availableSubMenus = ref([]);  // 🔥 新增：可用子菜单列表

/* =========== ⭐ 新增逻辑：图标源计算 =========== */

// 1. 动态提取域名
const domain = computed(() => {
  try {
    let u = formData.url;
    if (!u) return '';
    if (!u.startsWith('http') && !u.startsWith('//')) u = `https://${u}`;
    return new URL(u).hostname;
  } catch {
    return '';
  }
});

// 2. 定义图标源 URL
const googleIcon = computed(() => `https://www.google.com/s2/favicons?domain=${domain.value}&sz=128`);
const ddgIcon = computed(() => `https://icons.duckduckgo.com/ip3/${domain.value}.ico`);
const textIcon = computed(() => `https://ui-avatars.com/api/?background=random&name=${domain.value.substring(0, 2).toUpperCase()}`);
const directIcon = computed(() => `https://${domain.value}/favicon.ico`);
const horseIcon = computed(() => `https://icon.horse/icon/${domain.value}`);

// 3. 选择图标动作
function selectIcon(url) {
  formData.logo_url = url;
}
/* =========================================== */

/* 🔥 新增：加载子菜单 */
async function loadSubMenus() {
  if (!props.currentMenuId) {
    availableSubMenus.value = [];
    return;
  }
  
  try {
    const response = await getSubMenus(props.currentMenuId);
    availableSubMenus.value = response.data || [];
  } catch (error) {
    console.error('加载子菜单失败:', error);
    availableSubMenus.value = [];
  }
}

/* 初始化表单 */
function resetForm(data = null) {
  formData.id = data?.id ?? null;
  formData.title = data?.title ?? '';
  formData.url = data?.url ?? '';
  formData.logo_url = data?.logo_url ?? '';
  formData.desc = data?.desc ?? '';
  formData.sub_menu_id = data?.sub_menu_id ?? null;  // 🔥 新增
  errorMsg.value = '';
}

watch(() => props.visible, (visible) => {
  if (!visible) return;
  resetForm(props.isEdit ? props.initialData : null);
  loadSubMenus();  // 🔥 新增：加载子菜单
});

/* 关闭 */
function close() {
  emit('update:visible', false);
}

/* URL 校验 */
function isValidUrl(url) {
  try {
    let u = url;
    if (!u.startsWith('http')) u = `https://${u}`;
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

/* 保存 */
function save() {
  if (!formData.title || !formData.url) {
    errorMsg.value = '标题和链接是必填项';
    return;
  }
  if (!isValidUrl(formData.url)) {
    errorMsg.value = '请输入合法的 URL';
    return;
  }

  emit('save', { ...formData });
  close();
}

/* logo 加载失败回退 */
function handleImgError() {
  formData.logo_url = ''; 
}

/* 键盘快捷键 */
function handleKeydown(e) {
  if (e.key === 'Escape') close();
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
}

watch(() => props.visible, (v) => {
  if (v) window.addEventListener('keydown', handleKeydown);
  else window.removeEventListener('keydown', handleKeydown);
});

/* 自动聚焦指令 */
const vFocus = {
  mounted(el) {
    requestAnimationFrame(() => el.focus());
  }
};
</script>


<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(10px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal 主体 */
.modal-content {
  background: var(--bg-color, #e0e5ec);
  color: var(--text-color, #333);
  padding: 32px;
  border-radius: 24px;
  width: 90%;
  max-width: 420px;
  box-shadow:
    15px 15px 30px rgba(163,177,198,0.6),
    -15px -15px 30px rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.4);
}

/* 暗色模式 Modal */
:global(.dark-mode) .modal-content {
  box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.08);
}

h3 {
  margin-bottom: 24px;
  text-align: center;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--primary-color, #00ff9d);
}

/* 表单 */
.form-group { margin-bottom: 20px; }

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 800;
  font-size: 14px;
}

.required { color: #ff4d4f; }

.neumorphic-input {
  width: 100%;
  padding: 14px 16px;
  background: var(--bg-color, #e0e5ec);
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  box-shadow:
    inset 5px 5px 10px rgba(163,177,198,0.5),
    inset -5px -5px 10px rgba(255,255,255,0.8);
}

.neumorphic-input:focus {
  outline: none;
  color: var(--primary-color);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.tip {
  font-size: 12px;
  opacity: 0.5;
  margin-top: 6px;
  display: block; /* 确保换行 */
}

.logo-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.logo-preview {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--bg-color);
  box-shadow:
    5px 5px 10px rgba(163,177,198,0.5),
    -5px -5px 10px rgba(255,255,255,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* 防止被挤压 */
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px; /* 稍微留点白边 */
}

.placeholder {
  opacity: 0.3;
  font-weight: bold;
}

/* 错误提示 */
.form-error {
  color: #ff4d4f;
  font-size: 13px;
  text-align: center;
  margin-top: -8px;
}

/* 操作按钮 */
.modal-actions {
  display: flex;
  gap: 20px;
  margin-top: 36px;
}

.neumorphic-btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

/* 主按钮 */
.save {
  background: var(--primary-color, #00ff9d);
  color: #fff;
}

/* 取消按钮（亮色模式） */
.cancel {
  background: transparent;
  color: var(--text-color);
  opacity: 0.7;
}

/* 暗色模式下的取消按钮 */
:global(.dark-mode) .cancel {
  color: #e6e6e6;
  opacity: 1;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
}

:global(.dark-mode) .cancel:hover {
  background: rgba(255,255,255,0.14);
}

/* ⭐ 新增样式：图标快速选择栏 ⭐ */
.icon-quick-select {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(0,0,0,0.03); 
  border-radius: 12px;
  overflow-x: auto; /* 防止小屏幕溢出 */
}

:global(.dark-mode) .icon-quick-select {
  background: rgba(255,255,255,0.05);
}

.select-label {
  font-size: 12px;
  opacity: 0.6;
  font-weight: 600;
  white-space: nowrap;
}

.icon-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--bg-color);
  /* 小号的新拟态效果 */
  box-shadow: 
    3px 3px 6px rgba(163,177,198,0.4), 
    -3px -3px 6px rgba(255,255,255,0.5);
  transition: all 0.2s ease;
  border: 1px solid transparent;
  flex-shrink: 0;
}

:global(.dark-mode) .icon-option {
  box-shadow: 
    3px 3px 6px rgba(0,0,0,0.3), 
    -3px -3px 6px rgba(255,255,255,0.05);
}

.icon-option:hover {
  transform: translateY(-1px);
  border-color: var(--primary-color);
}

.icon-option:active {
  box-shadow: inset 2px 2px 5px rgba(163,177,198,0.4);
  transform: translateY(0);
}

:global(.dark-mode) .icon-option:active {
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.5);
}

.icon-option img {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  object-fit: contain;
}

.src-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-color);
}

/* 🔥 新增：select 下拉框样式 */
.neumorphic-select {
  width: 100%;
  padding: 14px 16px;
  background: var(--bg-color, #e0e5ec);
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  cursor: pointer;
  box-shadow:
    inset 5px 5px 10px rgba(163,177,198,0.5),
    inset -5px -5px 10px rgba(255,255,255,0.8);
  transition: all 0.2s ease;
}

.neumorphic-select:focus {
  outline: none;
  color: var(--primary-color);
  box-shadow:
    inset 6px 6px 12px rgba(163,177,198,0.6),
    inset -6px -6px 12px rgba(255,255,255,0.9);
}

.neumorphic-select option {
  background: var(--bg-color);
  color: var(--text-color);
  padding: 10px;
}

/* 暗色模式下的 select */
:global(.dark-mode) .neumorphic-select {
  box-shadow:
    inset 3px 3px 6px rgba(0,0,0,0.4),
    inset -3px -3px 6px rgba(255,255,255,0.05);
}

:global(.dark-mode) .neumorphic-select option {
  background: #25262b;
  color: #e0e0e0;
}
           
</style>
