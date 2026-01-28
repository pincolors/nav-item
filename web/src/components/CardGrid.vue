<template>
  <div class="grid-container">
    <draggable 
      :list="localCards" 
      item-key="id" 
      class="card-grid"
      :disabled="!isEditMode"
      @end="onDragEnd"
      ghost-class="ghost"
      filter=".action-buttons"
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
            <div v-if="isEditMode" class="drag-indicator">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
            </div>

            <div v-if="isEditMode" class="action-buttons">
              <button class="icon-btn edit-btn" @click.stop="$emit('edit', element)">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </button>
              <button class="icon-btn del-btn" @click.stop="$emit('delete', element.id)">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>

            <div class="card-icon-wrapper">
              <img 
                v-if="!iconError[element.id]"
                :src="getIconSrc(element)" 
                class="real-icon"
                @error="onImgError(element.id)"
                loading="lazy"
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

const props = defineProps({ cards: Array, isEditMode: Boolean });
const emit = defineEmits(['update:cards', 'edit', 'delete', 'add']);
const localCards = ref([...props.cards || []]);
const iconError = reactive({});

watch(() => props.cards, (newVal) => { localCards.value = [...newVal || []]; }, { deep: true });

function onDragEnd() { emit('update:cards', localCards.value); }
function handleClick(e) { if (props.isEditMode) e.preventDefault(); }

// 图标逻辑简化，参考 App.tsx 的处理方式
const getIconSrc = (site) => {
  if (site.icon && site.icon.startsWith('http')) return site.icon;
  if (site.logo_url) return site.logo_url; // 兼容旧字段
  try {
    const domain = new URL(site.url).hostname;
    // 使用 Google API 作为默认 (App.tsx 逻辑)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch (e) {
    return '';
  }
};

const onImgError = (id) => { iconError[id] = true; };
</script>

<style scoped>
/* ✨✨✨ 核心修改区域：完全复刻 App.tsx 的 Grid 布局 ✨✨✨ 
*/

.card-grid {
  display: grid;
  width: 100%;
  /* 👇 这里是 App.tsx 手机适配的精髓：自动填充，最小140px，自适应列数 */
  grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)); 
  gap: 20px; /* 对应 App.tsx 的 gap: 3.5 (~28px)，稍微调小一点适应 Vue 布局 */
  padding-bottom: 80px;
  
  /* 防止 Grid 限制滚动 */
  min-height: 100%; 
  overflow: visible; 
}

/* 桌面端适配：App.tsx 默认是 6 列 */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(6, 1fr); 
  }
}

.card-wrapper {
  /* 确保卡片高度填满网格单元，这一点在 App.tsx 里很重要 */
  height: 100%; 
  perspective: 1000px;
}

/* ✨✨✨ 卡片样式：复刻 App.tsx 的 Paper 样式 ✨✨✨ 
*/
.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* 垂直居中 */
  text-align: center;
  
  height: 100%;
  padding: 20px; /* 对应 App.tsx 的 p: 2.5 */
  
  /* 玻璃拟态背景 */
  background: rgba(255, 255, 255, 0.06); /* App.tsx: rgba(0,0,0,0.04) or dark mode equivalent */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  border-radius: 16px; /* App.tsx: borderRadius: 4 (MUI scale) -> 16px */
  border: 1px solid rgba(255, 255, 255, 0.12);
  
  color: inherit;
  text-decoration: none;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  cursor: pointer;
  
  /* 📱 App.tsx 里的 touch-action: none 防止拖拽滚动冲突 */
  touch-action: pan-y; 
}

/* 悬停效果 (App.tsx hover style) */
.card-item:not(.is-dragging):hover {
  transform: translateY(-5px) scale(1.02); /* App.tsx: translateY(-10px) scale(1.05) */
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

/* 拖拽中样式 */
.card-item.is-dragging {
  cursor: grabbing;
  opacity: 1; /* 保持可见 */
}

/* 幽灵样式 (拖拽占位符) */
.ghost .card-item {
  opacity: 0.4;
  background: rgba(0, 255, 157, 0.1);
  border: 2px dashed #00ff9d;
}

/* === 内容区域 === */

.card-icon-wrapper {
  width: 64px; 
  height: 64px; 
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  /* 给图标加一个浅色背景容器，让它更整齐 */
  background: rgba(255,255,255,0.05);
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.real-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s;
}

.fallback-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: #00ff9d;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12px;
  opacity: 0.6;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* === 编辑模式控件 === */
.drag-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  opacity: 0.5;
  background: rgba(0,0,0,0.2);
  border-radius: 50%;
  padding: 4px;
  display: flex;
}

.action-buttons {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 6px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover { background: rgba(0,255,157,0.2); color: #00ff9d; }
.del-btn:hover { background: rgba(255,68,68,0.2); color: #ff4444; }

.add-card {
  border: 2px dashed rgba(255,255,255,0.2);
  background: transparent;
}
.add-card:hover {
  border-color: #00ff9d;
  background: rgba(0,255,157,0.05);
}
.add-icon {
  font-size: 32px;
  color: #00ff9d;
  margin-bottom: 0;
}
</style>
