<template>
  <Teleport to="body">
    <div v-if="visible" class="glass-overlay" :class="{ 'dark-mode': isDarkMode }" @click.self="close">
      <div class="glass-dialog settings-dialog" @click.stop>

        <div class="dialog-header">
          <h3>⚙️ 系统设置</h3>
          <button @click="close" class="dialog-close-btn">✕</button>
        </div>

        <div class="settings-body">

          <!-- 基础设置 -->
          <div class="settings-section">
            <div class="section-title">🌐 基础设置</div>
            <div class="glass-form-group">
              <label>底部版权文字</label>
              <input v-model="form.copyright" class="glass-input" placeholder="Copyright © 2026 Nav-Item" />
            </div>
          </div>

          <!-- 显示设置 -->
          <div class="settings-section">
            <div class="section-title">🖥️ 显示设置</div>
            <div class="glass-form-group">
              <label>电脑端每行列数</label>
              <div class="btn-group">
                <button v-for="n in [4,5,6,7,8]" :key="n"
                  :class="['col-btn', { active: form.desktopColumns == n }]"
                  @click="form.desktopColumns = n">{{ n }}列</button>
              </div>
            </div>
            <div class="glass-form-group">
              <label>手机端每行列数</label>
              <div class="btn-group">
                <button v-for="n in [2,3]" :key="n"
                  :class="['col-btn', { active: form.mobileColumns == n }]"
                  @click="form.mobileColumns = n">{{ n }}列</button>
              </div>
            </div>
          </div>

          <!-- 搜索设置 -->
          <div class="settings-section">
            <div class="section-title">🔍 搜索设置</div>
            <div class="glass-form-group">
              <label>默认搜索引擎</label>
              <div class="btn-group">
                <button v-for="engine in searchEngines" :key="engine.name"
                  :class="['col-btn', { active: form.defaultEngine === engine.name }]"
                  @click="form.defaultEngine = engine.name">{{ engine.label }}</button>
              </div>
            </div>
          </div>

          <!-- 背景壁纸 -->
          <div class="settings-section">
            <div class="section-title">🖼️ 背景壁纸</div>
            <div class="glass-form-group">
              <label>壁纸链接（留空则无壁纸）</label>
              <input v-model="form.backgroundImage" class="glass-input" placeholder="https://.../wallpaper.jpg" />
            </div>
            <div class="glass-form-group" v-if="form.backgroundImage">
              <label>壁纸透明度：{{ Math.round(form.backgroundOpacity * 100) }}%</label>
              <input v-model="form.backgroundOpacity" type="range" min="0.05" max="1" step="0.05" class="range-input" />
            </div>
            <div v-if="form.backgroundImage" class="bg-preview"
              :style="{ backgroundImage: `url(${form.backgroundImage})`, opacity: form.backgroundOpacity }">
            </div>
          </div>

          <!-- 危险操作 -->
          <div class="settings-section">
            <div class="section-title danger-title">⚠️ 危险操作</div>
            <div class="danger-buttons">
              <button @click="requestClearAll" class="danger-btn">🗑️ 清空所有数据</button>
              <button @click="requestReset" class="danger-btn">🔄 重置为默认设置</button>
            </div>
          </div>

        </div>

        <div class="settings-footer">
          <button @click="close" class="glass-btn-cancel">取消</button>
          <button @click="save" class="glass-btn-primary">💾 保存设置</button>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- 清空数据：第一次确认 -->
  <ConfirmDialog
    v-model:visible="showClearStep1"
    :is-dark-mode="isDarkMode"
    icon="🗑️"
    icon-type="danger"
    title="确定要清空所有数据吗？"
    description="所有菜单和卡片数据将被清空"
    confirm-text="继续"
    confirm-type="danger"
    @confirm="showClearStep2 = true"
  />

  <!-- 清空数据：第二次确认 -->
  <ConfirmDialog
    v-model:visible="showClearStep2"
    :is-dark-mode="isDarkMode"
    icon="⚠️"
    icon-type="danger"
    title="再次确认：永久删除？"
    description="此操作不可恢复，所有数据将被永久删除"
    confirm-text="确认清空"
    confirm-type="danger"
    @confirm="doClearAll"
  />

  <!-- 重置设置确认 -->
  <ConfirmDialog
    v-model:visible="showResetConfirm"
    :is-dark-mode="isDarkMode"
    icon="🔄"
    icon-type="warning"
    title="确定要重置所有设置吗？"
    description="将恢复为默认设置值"
    confirm-text="重置"
    @confirm="doReset"
  />
</template>

<script setup>
import { ref, watch } from 'vue';
import { getConfigs, saveConfigs, clearAllData } from '../api';
import ConfirmDialog from './ConfirmDialog.vue';

const props = defineProps({ visible: Boolean, isDarkMode: Boolean });
const emit = defineEmits(['update:visible', 'saved']);

const searchEngines = [
  { name: 'site', label: '站内' }, { name: 'google', label: 'Google' },
  { name: 'baidu', label: '百度' }, { name: 'bing', label: 'Bing' },
  { name: 'github', label: 'GitHub' },
];

const form = ref({
  copyright: 'Copyright © 2026 Nav-Item',
  desktopColumns: 6, mobileColumns: 2, defaultEngine: 'site',
  backgroundImage: '', backgroundOpacity: 0.15,
});

// 清空数据两步确认状态
const showClearStep1 = ref(false);
const showClearStep2 = ref(false);
// 重置设置确认状态
const showResetConfirm = ref(false);

async function loadConfigs() {
  try {
    const res = await getConfigs();
    const c = res.data;
    if (c['site.copyright']) form.value.copyright = c['site.copyright'];
    if (c['site.desktopColumns']) form.value.desktopColumns = parseInt(c['site.desktopColumns']);
    if (c['site.mobileColumns']) form.value.mobileColumns = parseInt(c['site.mobileColumns']);
    if (c['site.defaultEngine']) form.value.defaultEngine = c['site.defaultEngine'];
    if (c['site.backgroundImage']) form.value.backgroundImage = c['site.backgroundImage'];
    if (c['site.backgroundOpacity']) form.value.backgroundOpacity = parseFloat(c['site.backgroundOpacity']);
  } catch (e) { console.error('加载配置失败:', e); }
}

watch(() => props.visible, (v) => { if (v) loadConfigs(); });

async function save() {
  try {
    await saveConfigs({
      'site.copyright': form.value.copyright,
      'site.desktopColumns': String(form.value.desktopColumns),
      'site.mobileColumns': String(form.value.mobileColumns),
      'site.defaultEngine': form.value.defaultEngine,
      'site.backgroundImage': form.value.backgroundImage,
      'site.backgroundOpacity': String(form.value.backgroundOpacity),
    });
    alert('✅ 设置已保存，即将刷新...');
    emit('saved', form.value);
    close();
    setTimeout(() => window.location.reload(), 500);
  } catch (e) { alert('保存失败: ' + e.message); }
}

// 触发清空流程（打开第一步确认弹窗）
function requestClearAll() {
  showClearStep1.value = true;
}

// 用户完成两步确认后，真正执行清空
async function doClearAll() {
  try {
    await clearAllData();
    alert('✅ 所有数据已清空');
    close();
    setTimeout(() => window.location.reload(), 500);
  } catch (e) { alert('清空失败: ' + e.message); }
}

// 触发重置确认
function requestReset() {
  showResetConfirm.value = true;
}

// 确认后执行重置
async function doReset() {
  try {
    await saveConfigs({
      'site.copyright': 'Copyright © 2026 Nav-Item',
      'site.desktopColumns': '6', 'site.mobileColumns': '2',
      'site.defaultEngine': 'site', 'site.backgroundImage': '',
      'site.backgroundOpacity': '0.15',
    });
    alert('✅ 已重置为默认设置');
    close();
    setTimeout(() => window.location.reload(), 500);
  } catch (e) { alert('重置失败: ' + e.message); }
}

function close() { emit('update:visible', false); }
</script>

<style scoped>
/* Teleport 脱离 dark-mode 容器，通过 :class 手动传入 dark-mode */
.glass-overlay.dark-mode {
  --glass-text-color:         #ffffff;
  --glass-label-color:        rgba(255, 255, 255, 0.50);
  --glass-dialog-bg:          rgba(30, 32, 40, 0.60);
  --glass-dialog-border:      rgba(255, 255, 255, 0.12);
  --glass-dialog-shadow:      0 20px 60px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08);
  --glass-dialog-blur:        blur(28px) saturate(180%);
  --glass-overlay-bg:         rgba(0, 0, 0, 0.30);
  --glass-input-bg:           rgba(255, 255, 255, 0.08);
  --glass-input-border:       rgba(255, 255, 255, 0.14);
  --glass-input-color:        #ffffff;
  --glass-input-placeholder:  rgba(255, 255, 255, 0.25);
  --glass-input-focus-border: rgba(0, 255, 157, 0.50);
  --glass-input-focus-shadow: 0 0 0 3px rgba(0, 255, 157, 0.10);
  --glass-input-focus-bg:     rgba(255, 255, 255, 0.12);
  --glass-icon-btn-bg:        rgba(255, 255, 255, 0.10);
  --glass-icon-bar-bg:        rgba(255, 255, 255, 0.05);
  --glass-icon-bar-border:    rgba(255, 255, 255, 0.10);
  --glass-scrollbar-thumb:    rgba(255, 255, 255, 0.15);
  --glass-primary:            #00c87a;
  --glass-primary-hover:      #00e68a;
  --glass-primary-shadow:     rgba(0, 200, 122, 0.35);
  --glass-primary-shadow-hover: rgba(0, 200, 122, 0.50);
}

.settings-dialog {
  max-width: 520px;
  width: 90%;
  max-height: 85vh;
  padding: 0;
  display: flex;
  position: relative;
  padding-top: 24px;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex; 
  justify-content: center;
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
  width: 46px; 
  height: 32px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  position: absolute; 
  top: 0; 
  right: 0; 
  border-top-right-radius: 12px;
  border-bottom-left-radius: 4px;
  transition: background-color 0.15s, color 0.15s;
}

.dialog-close-btn:hover { 
  background-color: #e81123;
  color: #ffffff;
}

.dialog-close-btn:active {
  background-color: #f1707a;
  color: #ffffff;
}

.settings-body {
  flex: 1; overflow-y: auto; padding: 20px 28px;
  scrollbar-width: none;
}
.settings-body::-webkit-scrollbar { display: none; }

.settings-section { margin-bottom: 28px; }

.section-title {
  font-size: 12px; font-weight: 800; letter-spacing: 0.5px;
  text-transform: uppercase; color: var(--glass-label-color);
  margin-bottom: 14px;
}

.danger-title { color: rgba(255, 77, 79, 0.7); }

label {
  display: block; margin-bottom: 8px;
  font-size: 14px; font-weight: 600;
  color: var(--glass-label-color);
}

.btn-group { display: flex; flex-wrap: wrap; gap: 8px; }

.col-btn {
  padding: 8px 16px; border-radius: 10px; border: 1px solid var(--glass-input-border);
  cursor: pointer; font-size: 13px; font-weight: 700;
  background: var(--glass-input-bg); color: var(--glass-text-color);
  transition: all 0.2s;
}
.col-btn:hover { background: var(--glass-icon-btn-bg); }
.col-btn.active {
  background: var(--glass-primary); color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4px 12px var(--glass-primary-shadow);
}

.range-input { width: 100%; accent-color: var(--glass-primary); cursor: pointer; }

.bg-preview {
  width: 100%; height: 80px; border-radius: 12px;
  background-size: cover; background-position: center; margin-top: 8px;
  border: 1px solid var(--glass-input-border);
}

.danger-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
.danger-btn {
  padding: 10px 16px; border-radius: 10px; cursor: pointer;
  font-size: 13px; font-weight: 700;
  background: rgba(255,77,79,0.08);
  color: #ff4d4f;
  border: 1px solid rgba(255,77,79,0.2);
  transition: all 0.2s;
}
.danger-btn:hover { background: rgba(255,77,79,0.18); transform: translateY(-1px); }

.settings-footer {
  display: flex; gap: 12px; padding: 16px 28px 24px;
  border-top: 1px solid var(--glass-input-border);
  flex-shrink: 0;
}
</style>
