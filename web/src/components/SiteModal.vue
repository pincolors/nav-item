<template>
  <div v-if="visible" class="glass-overlay" @click="close">
    <div class="glass-dialog" @click.stop>
      <h3>
        <span
  class="title-icon"
  :style="{ '--icon-color': isEdit ? '99, 102, 241' : '34, 197, 94' }"
>
  {{ isEdit ? '✍️' : '✨' }}
</span>
  {{ isEdit ? '编辑站点' : '添加新站点' }}
</h3>

      <div class="form-container">
       <div class="glass-form-group">
  <label>标题 <span class="required">*</span></label>
  <input v-model="formData.title" class="glass-input" placeholder="例如：Google" v-focus />
</div>

       <div class="glass-form-group">
  <label>链接 URL <span class="required">*</span></label>
  <input v-model="formData.url" class="glass-input" placeholder="https://..."
    @compositionend="formData.url = $event.target.value"
    @change="formData.url = $event.target.value" />
</div>

        <div class="glass-form-group">
          <label>Logo 图片链接（可选）</label>
          <div class="glass-icon-bar" v-if="domain">
            <div class="glass-icon-btn" @click="selectIcon(googleIcon)" title="Google API">
              <img :src="googleIcon" loading="lazy" /><span>Google</span>
            </div>
            <div class="glass-icon-btn" @click="selectIcon(ddgIcon)" title="DuckDuckGo">
              <img :src="ddgIcon" loading="lazy" /><span>DDG</span>
            </div>
            <div class="glass-icon-btn" @click="selectIcon(horseIcon)" title="Icon Horse">
              <img :src="horseIcon" loading="lazy" /><span>Horse</span>
            </div>
            <div class="glass-icon-btn" @click="selectIcon(directIcon)" title="直连">
              <img :src="directIcon" loading="lazy" /><span>Direct</span>
            </div>
            <div class="glass-icon-btn" @click="selectIcon(textIcon)" title="文字兜底">
              <img :src="textIcon" loading="lazy" /><span>Text</span>
            </div>
          </div>
          <div class="logo-input-wrapper">
            <input v-model="formData.logo_url" class="glass-input" placeholder="https://.../logo.png" />
            <div class="logo-preview">
              <img v-if="formData.logo_url" :src="formData.logo_url" @error="handleImgError" />
              <span v-else class="placeholder">?</span>
            </div>
          </div>
          <small class="glass-tip">点击上方推荐图标可直接填入，或留空自动获取</small>
        </div>

        <div class="glass-form-group">
          <label>所属主菜单</label>
          <select v-model="formData.menu_id" class="glass-input glass-select">
            <option v-for="menu in props.menus" :key="menu.id" :value="menu.id">{{ menu.name }}</option>
          </select>
        </div>

        <div class="glass-form-group" v-if="availableSubMenus.length > 0">
          <label>所属子菜单</label>
          <select v-model="formData.sub_menu_id" class="glass-input glass-select">
            <option :value="null">主菜单</option>
            <option v-for="sub in availableSubMenus" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
          </select>
        </div>

        <p v-if="errorMsg" class="glass-error">{{ errorMsg }}</p>
      </div>

      <div class="glass-form-group">
        <label>描述（可选）</label>
        <textarea v-model="formData.desc" class="glass-input glass-textarea" placeholder="简短描述..." rows="3" />
      </div>

      <div class="glass-actions">
        <button class="glass-btn-cancel" @click="close">取消</button>
        <button class="glass-btn-primary" @click="save">{{ isEdit ? '保存修改' : '立即添加' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue';
import { getSubMenus } from '../api';

const props = defineProps({
  visible: Boolean,
  isEdit: Boolean,
  initialData: Object,
  currentMenuId: Number,
  menus: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:visible', 'save']);

const formData = reactive({ id: null, title: '', url: '', logo_url: '', desc: '', menu_id: null, sub_menu_id: null });
const errorMsg = ref('');
const availableSubMenus = ref([]);

const domain = computed(() => {
  try {
    let u = formData.url;
    if (!u) return '';
    if (!u.startsWith('http') && !u.startsWith('//')) u = `https://${u}`;
    return new URL(u).hostname;
  } catch { return ''; }
});

const googleIcon = computed(() => `https://www.google.com/s2/favicons?domain=${domain.value}&sz=128`);
const ddgIcon = computed(() => `https://icons.duckduckgo.com/ip3/${domain.value}.ico`);
const textIcon = computed(() => `https://ui-avatars.com/api/?background=random&name=${domain.value.substring(0, 2).toUpperCase()}`);
const directIcon = computed(() => `https://${domain.value}/favicon.ico`);
const horseIcon = computed(() => `https://icon.horse/icon/${domain.value}`);

function selectIcon(url) { formData.logo_url = url; }

async function loadSubMenusById(menuId) {
  try { availableSubMenus.value = (await getSubMenus(menuId)).data || []; }
  catch { availableSubMenus.value = []; }
}

async function loadSubMenus() {
  const menuId = formData.menu_id || props.currentMenuId;
  if (!menuId) { availableSubMenus.value = []; return; }
  await loadSubMenusById(menuId);
}

watch(() => formData.menu_id, (id) => { if (id) { formData.sub_menu_id = null; loadSubMenusById(id); } });

function resetForm(data = null) {
  formData.id = data?.id ?? null;
  formData.title = data?.title ?? '';
  formData.url = data?.url ?? '';
  formData.logo_url = data?.logo_url ?? '';
  formData.desc = data?.desc ?? '';
  formData.menu_id = data?.menu_id ?? props.currentMenuId ?? null;
  formData.sub_menu_id = data?.sub_menu_id ?? null;
  errorMsg.value = '';
}

watch(() => props.visible, (visible) => {
  if (visible) { resetForm(props.isEdit ? props.initialData : null); loadSubMenus(); window.addEventListener('keydown', handleKeydown); }
  else { window.removeEventListener('keydown', handleKeydown); }
});

function close() { emit('update:visible', false); }

function isValidUrl(url) {
  try { new URL(url.startsWith('http') ? url : `https://${url}`); return true; }
  catch { return false; }
}

function save() {
  if (!formData.title || !formData.url) { errorMsg.value = '标题和链接是必填项'; return; }
  if (!isValidUrl(formData.url)) { errorMsg.value = '请输入合法的 URL'; return; }
  emit('save', { ...formData });
  close();
}

function handleImgError() { formData.logo_url = ''; }
function handleKeydown(e) {
  if (e.key === 'Escape') close();
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
}

const vFocus = { mounted(el) { requestAnimationFrame(() => el.focus()); } };
</script>

<style scoped>
/* ===== 组件私有样式，不覆盖全局变量 ===== */

/* 标题：直接继承 .glass-dialog 的 color，无需重写 */
h3 {
  margin: 0 0 24px 0;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.1rem;
  background: rgba(var(--icon-color), 0.5);
  border: 1px solid rgba(var(--icon-color), 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.icon-edit {
  background: rgba(99, 102, 241, 0.15);   /* 蓝紫色,编辑语义 */
  border-color: rgba(99, 102, 241, 0.3);
}
.icon-add {
  background: rgba(34, 197, 94, 0.15);    /* 绿色,新增语义 */
  border-color: rgba(34, 197, 94, 0.3);
}
/* label：用全局变量，不硬编码颜色 */
label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 13px;
  color: var(--glass-label-color);  /* ✅ 跟随主题变量 */
}

.required { color: #ff4d4f; }

.logo-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.logo-preview {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  background: var(--glass-input-bg);
  border: 1px solid var(--glass-input-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
  border-radius: 8px;
}

.placeholder {
  opacity: 0.25;
  font-weight: bold;
  font-size: 18px;
  color: var(--glass-text-color);
}

.glass-icon-btn img {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  object-fit: contain;
}
</style>
