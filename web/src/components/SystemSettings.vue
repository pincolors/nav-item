<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-content settings-modal" :class="{ 'dark-mode': isDarkMode }">
        
        <div class="modal-header">
          <h3>⚙️ 系统设置</h3>
          <button @click="close" class="close-btn">✕</button>
        </div>

        <div class="settings-body">

          <!-- 基础设置 -->
          <div class="settings-section">
            <div class="section-title">🌐 基础设置</div>
            
            <div class="form-group">
              <label>底部版权文字</label>
              <input v-model="form.copyright" class="settings-input" placeholder="Copyright © 2026 Nav-Item" />
            </div>
          </div>

          <!-- 显示设置 -->
          <div class="settings-section">
            <div class="section-title">🖥️ 显示设置</div>
            
            <div class="form-group">
              <label>电脑端每行列数</label>
              <div class="btn-group">
                <button 
                  v-for="n in [4, 5, 6, 7, 8]" 
                  :key="n"
                  :class="{ active: form.desktopColumns == n }"
                  @click="form.desktopColumns = n"
                  class="col-btn"
                >{{ n }}列</button>
              </div>
            </div>

            <div class="form-group">
              <label>手机端每行列数</label>
              <div class="btn-group">
                <button 
                  v-for="n in [2, 3]" 
                  :key="n"
                  :class="{ active: form.mobileColumns == n }"
                  @click="form.mobileColumns = n"
                  class="col-btn"
                >{{ n }}列</button>
              </div>
            </div>
          </div>

          <!-- 搜索设置 -->
          <div class="settings-section">
            <div class="section-title">🔍 搜索设置</div>
            
            <div class="form-group">
              <label>默认搜索引擎</label>
              <div class="btn-group">
                <button
                  v-for="engine in searchEngines"
                  :key="engine.name"
                  :class="{ active: form.defaultEngine === engine.name }"
                  @click="form.defaultEngine = engine.name"
                  class="col-btn"
                >{{ engine.label }}</button>
              </div>
            </div>
          </div>

          <!-- 背景壁纸 -->
          <div class="settings-section">
            <div class="section-title">🖼️ 背景壁纸</div>
            
            <div class="form-group">
              <label>壁纸链接（留空则无壁纸）</label>
              <input v-model="form.backgroundImage" class="settings-input" placeholder="https://.../wallpaper.jpg" />
            </div>

            <div class="form-group" v-if="form.backgroundImage">
              <label>壁纸透明度：{{ Math.round(form.backgroundOpacity * 100) }}%</label>
              <input 
                v-model="form.backgroundOpacity" 
                type="range" min="0.05" max="1" step="0.05"
                class="range-input"
              />
            </div>

            <div v-if="form.backgroundImage" class="bg-preview" :style="{ backgroundImage: `url(${form.backgroundImage})`, opacity: form.backgroundOpacity }"></div>
          </div>

          <!-- 危险操作 -->
          <div class="settings-section danger-section">
            <div class="section-title">⚠️ 危险操作</div>
            
            <div class="danger-buttons">
              <button @click="handleClearAll" class="danger-btn">
                🗑️ 清空所有数据
              </button>
              <button @click="handleReset" class="danger-btn">
                🔄 重置为默认设置
              </button>
            </div>
          </div>

        </div>

        <div class="modal-actions">
          <button @click="close" class="btn-cancel">取消</button>
          <button @click="save" class="btn-save">💾 保存设置</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getConfigs, saveConfigs, clearAllData } from '../api';

const props = defineProps({
  visible: Boolean,
  isDarkMode: Boolean
});

const emit = defineEmits(['update:visible', 'saved']);

const searchEngines = [
  { name: 'site', label: '站内' },
  { name: 'google', label: 'Google' },
  { name: 'baidu', label: '百度' },
  { name: 'bing', label: 'Bing' },
  { name: 'github', label: 'GitHub' },
];

const form = ref({
  copyright: 'Copyright © 2026 Nav-Item',
  desktopColumns: 6,
  mobileColumns: 2,
  defaultEngine: 'site',
  backgroundImage: '',
  backgroundOpacity: 0.15,
});

// 加载配置
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
  } catch (e) {
    console.error('加载配置失败:', e);
  }
}

watch(() => props.visible, (v) => {
  if (v) loadConfigs();
});

// 保存
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
  } catch (e) {
    alert('保存失败: ' + e.message);
  }
}

// 清空数据
async function handleClearAll() {
  if (!confirm('⚠️ 确定要清空所有菜单和卡片数据吗？此操作不可恢复！')) return;
  if (!confirm('⚠️ 再次确认：所有数据将被永久删除！')) return;
  try {
    await clearAllData();
    alert('✅ 所有数据已清空');
    close();
    setTimeout(() => window.location.reload(), 500);
  } catch (e) {
    alert('清空失败: ' + e.message);
  }
}

// 重置默认设置
async function handleReset() {
  if (!confirm('确定要重置所有设置为默认值吗？')) return;
  try {
    await saveConfigs({
      'site.copyright': 'Copyright © 2026 Nav-Item',
      'site.desktopColumns': '6',
      'site.mobileColumns': '2',
      'site.defaultEngine': 'site',
      'site.backgroundImage': '',
      'site.backgroundOpacity': '0.15',
    });
    alert('✅ 已重置为默认设置');
    close();
    setTimeout(() => window.location.reload(), 500);
  } catch (e) {
    alert('重置失败: ' + e.message);
  }
}

function close() {
  emit('update:visible', false);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  z-index: 3000;
  display: flex; align-items: center; justify-content: center;
}

.settings-modal {
  background: #e0e5ec;
  color: #4a5568;
  width: 90%; max-width: 520px;
  max-height: 85vh;
  border-radius: 24px;
  overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 15px 15px 30px rgba(163,177,198,0.6), -15px -15px 30px rgba(255,255,255,0.6);
  animation: slideUp 0.3s ease;
}

.settings-modal.dark-mode {
  background: #25262b;
  color: #e0e0e0;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 28px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.dark-mode .modal-header { border-bottom-color: rgba(255,255,255,0.08); }

.modal-header h3 { margin: 0; font-size: 20px; font-weight: 800; }

.close-btn {
  background: transparent; border: none; font-size: 20px;
  cursor: pointer; color: inherit; opacity: 0.6;
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.close-btn:hover { opacity: 1; background: rgba(0,0,0,0.05); }

.settings-body {
  flex: 1; overflow-y: auto; padding: 20px 28px;
  scrollbar-width: none;
}
.settings-body::-webkit-scrollbar { display: none; }

.settings-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 13px; font-weight: 800;
  opacity: 0.5; margin-bottom: 14px;
  letter-spacing: 0.5px; text-transform: uppercase;
}

.form-group { margin-bottom: 16px; }

.form-group label {
  display: block; margin-bottom: 8px;
  font-size: 14px; font-weight: 600;
}

.settings-input {
  width: 100%; padding: 12px 14px;
  background: #e0e5ec;
  border: none; border-radius: 12px;
  color: #4a5568; font-size: 14px;
  box-shadow: inset 4px 4px 8px rgba(163,177,198,0.4), inset -4px -4px 8px rgba(255,255,255,0.5);
  box-sizing: border-box; outline: none;
}

.dark-mode .settings-input {
  background: rgba(0,0,0,0.2);
  color: #e0e0e0;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
}

.settings-input:focus { color: #00ff9d; }

.btn-group {
  display: flex; flex-wrap: wrap; gap: 8px;
}

.col-btn {
  padding: 8px 16px; border-radius: 10px; border: none;
  cursor: pointer; font-size: 13px; font-weight: 700;
  background: #e0e5ec; color: #4a5568;
  box-shadow: 4px 4px 8px rgba(163,177,198,0.4), -4px -4px 8px rgba(255,255,255,0.5);
  transition: all 0.2s;
}

.dark-mode .col-btn {
  background: rgba(255,255,255,0.08);
  color: #e0e0e0;
  box-shadow: none;
  border: 1px solid rgba(255,255,255,0.1);
}

.col-btn.active {
  background: #00ff9d; color: #1a1b1e;
  box-shadow: 0 4px 12px rgba(0,255,157,0.4);
}

.range-input {
  width: 100%; accent-color: #00ff9d; cursor: pointer;
}

.bg-preview {
  width: 100%; height: 80px;
  border-radius: 12px;
  background-size: cover; background-position: center;
  margin-top: 8px;
}

.danger-section { }

.danger-buttons {
  display: flex; gap: 12px; flex-wrap: wrap;
}

.danger-btn {
  padding: 10px 16px; border-radius: 10px; border: none;
  cursor: pointer; font-size: 13px; font-weight: 700;
  background: rgba(255,77,79,0.1); color: #ff4d4f;
  border: 1px solid rgba(255,77,79,0.2);
  transition: all 0.2s;
}

.danger-btn:hover {
  background: rgba(255,77,79,0.2);
  transform: translateY(-1px);
}

.modal-actions {
  display: flex; gap: 12px; padding: 16px 28px 24px;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.dark-mode .modal-actions { border-top-color: rgba(255,255,255,0.08); }

.btn-cancel, .btn-save {
  flex: 1; padding: 12px; border-radius: 12px;
  border: none; cursor: pointer; font-size: 15px; font-weight: 700;
  transition: all 0.2s;
}

.btn-cancel {
  background: transparent; color: inherit; opacity: 0.6;
}
.btn-cancel:hover { opacity: 1; background: rgba(0,0,0,0.05); }

.btn-save {
  background: #00ff9d; color: #1a1b1e;
  box-shadow: 0 4px 12px rgba(0,255,157,0.3);
}
.btn-save:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,255,157,0.4); }
</style>
