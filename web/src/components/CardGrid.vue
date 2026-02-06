<template>
  <div class="grid-container" :class="{ 'dark-theme': isDarkMode }">
    
    <draggable 
      :list="localCards" 
      item-key="id" 
      class="card-grid"
      filter=".no-drag"
      :disabled="!isEditMode"
      @end="onDragEnd"
      ghost-class="ghost"
      :animation="200"
      :force-fallback="true"
      :scroll="true"
    >
      <template #item="{ element }">
        <div class="card-wrapper">
          <component
            :is="isEditMode ? 'div' : 'a'"
            :href="!isEditMode ? element.url : undefined"
            :target="!isEditMode ? '_blank' : undefined"
            class="card-item"
            :class="{ 'is-dragging': isEditMode }"
            @click="handleClick($event)"
          >
            <div v-if="isEditMode" class="action-buttons no-drag">
              <button 
                class="icon-btn edit-btn" 
                @touchstart.stop.prevent="handleEdit(element)"
                @click.stop="handleEdit(element)" 
                title="编辑"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button 
                class="icon-btn del-btn" 
                @touchstart.stop.prevent="handleDelete(element.id)"
                @click.stop="handleDelete(element.id)" 
                title="删除"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>

            <div class="card-icon-wrapper">
              <img 
                v-if="!iconError[element.id]"
                :src="getIconSrc(element)" 
                @error="(e) => handleIconError(e, element)"
                loading="lazy"
                referrerpolicy="no-referrer"
                :alt="element.title"
                class="site-favicon"
              />
              <div v-else class="fallback-icon">
                {{ (element.title || element.name || '?').charAt(0).toUpperCase() }}
              </div>
            </div>

            <div class="card-info">
              <div class="card-title">{{ element.title || element.name }}</div>
              <div v-if="element.description" class="card-desc">{{ element.description }}</div>
            </div>
          </component>
        </div>
      </template>

      <template #footer>
         <div v-if="isEditMode" class="card-wrapper">
           <div class="card-item add-card" @click="$emit('add')">
             <div class="add-icon">+</div>
             <div class="card-title" style="margin-top: 8px; opacity: 0.8;">添加</div>
           </div>
         </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, watch, reactive } from 'vue';
import draggable from 'vuedraggable';

const props = defineProps({ 
  cards: Array, 
  isEditMode: Boolean,
  isDarkMode: Boolean
});

const emit = defineEmits(['update:cards', 'edit', 'delete', 'add']);

const localCards = ref([...props.cards || []]);
const iconError = reactive({});

// 防抖标志
let touchHandled = false;

// 处理编辑（防止重复触发）
const handleEdit = (item) => {
  if (touchHandled) return;
  touchHandled = true;
  emit('edit', item);
  setTimeout(() => { touchHandled = false; }, 300);
};

// 处理删除（防止重复触发）
const handleDelete = (id) => {
  if (touchHandled) return;
  touchHandled = true;
  emit('delete', id);
  setTimeout(() => { touchHandled = false; }, 300);
};

// 1. 辅助函数：获取域名
const getDomain = (url) => {
  try {
    if (!url) return '';
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    return new URL(fullUrl).hostname;
  } catch (e) {
    return 'google.com';
  }
};

// 2. 计算图标来源
const getIconSrc = (item) => {
  if (!item) return '';
  if (item.logo_url && item.logo_url.trim() !== '') return item.logo_url;
  if (item.icon && item.icon.startsWith('http')) return item.icon;
  return `https://www.google.com/s2/favicons?domain=${getDomain(item.url)}&sz=128`;
};

// 3. 错误处理
const handleIconError = (e, item) => {
  const img = e.target;
  if (img.dataset.isFallback) {
    iconError[item.id] = true;
    return;
  }
  img.dataset.isFallback = "true";
  if (!img.src.includes('google.com')) {
    img.src = `https://www.google.com/s2/favicons?domain=${getDomain(item.url)}&sz=128`;
  } else {
    iconError[item.id] = true;
  }
};

watch(() => props.cards, (newVal) => { 
  localCards.value = [...newVal || []];
  newVal?.forEach(c => { if (iconError[c.id]) iconError[c.id] = false; });
}, { deep: true });

function onDragEnd() { emit('update:cards', localCards.value); }
function handleClick(e) { if (props.isEditMode) e.preventDefault(); }
</script>

<style scoped>
/* =========================================
   1. 样式变量
   ========================================= */
.grid-container {
  --card-bg: rgba(255, 255, 255, 0.95);
  --card-bg-hover: rgba(255, 255, 255, 1);
  --card-border: rgba(0, 0, 0, 0.08);
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06);
  --card-shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.08);
  --text-title: rgba(0, 0, 0, 0.9);
  --text-desc: rgba(0, 0, 0, 0.6);
  --icon-bg: linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(241, 245, 249, 1) 100%);
  --icon-bg-hover: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%);
  --btn-bg: rgba(255,255,255,0.9);
  --btn-border: rgba(0,0,0,0.1);
  --btn-hover: rgba(0,0,0,0.05);
}

.grid-container.dark-theme {
  --card-bg: rgba(255, 255, 255, 0.06);
  --card-bg-hover: rgba(255, 255, 255, 0.1);
  --card-border: rgba(255, 255, 255, 0.12);
  --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  --card-shadow-hover: 0 12px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  --text-title: rgba(255, 255, 255, 0.95);
  --text-desc: rgba(255, 255, 255, 0.6);
  --icon-bg: rgba(255, 255, 255, 0.08);
  --icon-bg-hover: rgba(255, 255, 255, 0.12);
  --btn-bg: rgba(0,0,0,0.4);
  --btn-border: rgba(255,255,255,0.1);
  --btn-hover: rgba(255,255,255,0.15);
}

/* =========================================
   2. 基础布局
   ========================================= */
.card-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)); 
  gap: 24px 20px;
  padding-bottom: 80px;
  min-height: 100%; 
  overflow: visible; 
}
@media (min-width: 1024px) {
  .card-grid { grid-template-columns: repeat(6, 1fr); gap: 28px 20px; }
}

.card-wrapper { min-height: 200px; perspective: 1000px; }

.card-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; min-height: 200px; width: 100%; padding: 20px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  color: var(--text-title);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-radius: 16px; position: relative;
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  /* ✅ 整卡可拖拽 */
  cursor: grab; 
  box-sizing: border-box; 
  touch-action: pan-y;
}

/* 拖拽中样式 */
.card-item.is-dragging {
  cursor: grabbing; opacity: 0.9;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 悬停效果 (编辑模式下) */
.card-item:not(.is-dragging):hover {
  transform: translateY(-8px) scale(1.03);
  background: var(--card-bg-hover);
  border-color: rgba(0, 255, 157, 0.3);
  box-shadow: var(--card-shadow-hover);
}
.grid-container.dark-theme .card-item:not(.is-dragging):hover {
  border-color: rgba(255, 255, 255, 0.3);
}

/* =========================================
   3. 操作按钮（移动端优化）
   ========================================= */
.action-buttons { 
  position: absolute; 
  top: 5px;   
  right: 5px; 
  display: flex;
  gap: 8px;
  z-index: 50;
}

/* 确保按钮区域不可拖拽 */
.action-buttons,
.action-buttons * {
  -webkit-user-drag: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.icon-btn {
  position: relative;
  background: var(--btn-bg); 
  border: 1px solid var(--btn-border);
  color: #666;
  border-radius: 8px; 
  width: 32px; 
  height: 32px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  cursor: pointer; 
  transition: all 0.2s ease;
  
  /* ✅ 移动端优化 */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  pointer-events: auto;
}

/* 🌟 扩大点击热区 */
.icon-btn::after {
  content: '';
  position: absolute;
  top: -10px;
  bottom: -10px;
  left: -10px;
  right: -10px;
  border-radius: 50%;
}

.grid-container.dark-theme .icon-btn { color: #ccc; }

/* 桌面端悬停 */
@media (hover: hover) and (pointer: fine) {
  .icon-btn:hover { 
    background: var(--btn-hover); 
    transform: scale(1.1); 
  }
  .edit-btn:hover { color: #2196F3; }
  .del-btn:hover { color: #F44336; }
}

/* 移动端点击反馈 */
@media (hover: none) and (pointer: coarse) {
  .icon-btn {
    width: 40px;  /* 加大点击区域 */
    height: 40px;
  }
  
  .action-buttons {
    gap: 10px;
  }
  
  .icon-btn:active {
    background: var(--btn-hover);
    transform: scale(0.92);
  }
  
  .edit-btn:active { color: #2196F3; }
  .del-btn:active { color: #F44336; }
}

/* =========================================
   4. 图标与内容
   ========================================= */
.card-icon-wrapper {
  width: 72px; height: 72px; 
  margin-bottom: 12px; border-radius: 12px; overflow: hidden;
  background: var(--icon-bg);
  padding: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), inset 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04); transition: all 0.3s;
}

.card-item:hover .card-icon-wrapper { background: var(--icon-bg-hover); }
.grid-container.dark-theme .card-icon-wrapper { border-color: rgba(255,255,255,0.1); }

.site-favicon { width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s; }
.card-item:hover .site-favicon { transform: scale(1.1); }

.fallback-icon {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 48px; font-weight: bold; color: #00ff9d;
  text-shadow: 0 2px 4px rgba(0, 255, 157, 0.3);
}

.card-info {
  width: 100%;
}

.card-title {
  font-size: 14px; font-weight: 700; width: 100%; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis; margin-bottom: 4px;
  color: var(--text-title);
}

.card-desc {
  font-size: 12px; opacity: 0.6; width: 100%; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-desc);
}

/* =========================================
   5. 添加卡片
   ========================================= */
.add-card { 
  border: 2px dashed var(--btn-border); 
  background: transparent; 
  box-shadow: none;
  cursor: pointer;
}

.add-card:hover { 
  border-color: #00ff9d; 
  background: rgba(0, 255, 157, 0.05); 
}

.add-icon { 
  font-size: 32px; 
  color: #00ff9d; 
  margin-bottom: 0; 
}

/* =========================================
   6. 拖拽幽灵效果
   ========================================= */
.ghost .card-item {
  opacity: 0.5; 
  background: rgba(0, 255, 157, 0.08);
  border: 2px dashed #00ff9d;
}
</style>

