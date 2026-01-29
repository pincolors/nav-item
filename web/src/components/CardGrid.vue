<template>
  <div class="grid-container">
    <draggable 
      :list="localCards" 
      item-key="id" 
      class="card-grid-layout"
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

const getIconSrc = (site) => {
  if (site.icon && site.icon.startsWith('http')) return site.icon;
  if (site.logo_url) return site.logo_url;
  try {
    const domain = new URL(site.url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch (e) {
    return '';
  }
};
const onImgError = (id) => { iconError[id] = true; };
</script>

<style>
/* 这里的类名必须和 template 里的 class="card-grid-layout" 对应 */
.card-grid-layout {
  display: grid !important; 
  width: 100%;
  
  /* 手机端默认：强制 2 列，防止出现“1个、2个”混排的乱象 */
  grid-template-columns: repeat(2, 1fr) !important;
  
  /* 间距控制：上下左右都拉开 */
  gap: 16px !important;
  
  padding-bottom: 80px;
  min-height: 100%;
}

/* 桌面端：当屏幕宽度足够时，自动铺满 */
@media (min-width: 768px) {
  .card-grid-layout {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
    gap: 24px !important;
  }
}
</style>

<style scoped>
.grid-container {
  width: 100%;
  box-sizing: border-box;
}

.card-wrapper {
  /* 这一步很关键：确保卡片占满 Grid 分配的格子 */
  width: 100%;
  height: 100%; 
  aspect-ratio: 1.25 / 1; /* 强制统一宽高比，防止高低不平 */
  perspective: 1000px;
}

/* 卡片本体样式 */
.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  
  width: 100%;
  height: 100%;
  padding: 16px;
  
  /* 玻璃拟态背景 */
  background: rgba(255, 255, 255, 0.5); 
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  color: inherit;
  text-decoration: none;
  position: relative;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  cursor: pointer;
  box-sizing: border-box; /* 防止 padding 撑大盒子 */
}

/* 暗黑模式适配 (通过父级 .dark-mode 传递) */
:deep(.dark-mode) .card-item {
  background: rgba(40, 40, 40, 0.6);
  border-color: rgba(255, 255, 255, 0.05);
}

.card-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

/* 图标容器 */
.card-icon-wrapper {
  width: 48px; 
  height: 48px; 
  margin-bottom: 10px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.real-icon {
  width: 100%; height: 100%; object-fit: contain;
}

.fallback-icon {
  font-size: 24px; font-weight: bold; color: #00ff9d;
}

.card-title {
  font-size: 13px; font-weight: 700; width: 100%;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 2px;
}
.card-desc {
  font-size: 11px; opacity: 0.6; width: 100%;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* 编辑控件 */
.action-buttons {
  position: absolute; top: 4px; right: 4px; display: flex; gap: 2px;
}
.icon-btn {
  background: rgba(0,0,0,0.05); border: none; border-radius: 4px;
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  color: inherit; cursor: pointer;
}
.drag-indicator {
  position: absolute; top: 6px; left: 6px; opacity: 0.3;
}
.add-card { border: 2px dashed rgba(150,150,150,0.3); background: transparent; }
.add-icon { font-size: 28px; color: #00ff9d; }

/* 拖拽占位符 */
.ghost .card-item {
  opacity: 0.4;
  background: rgba(0, 255, 157, 0.1);
  border: 2px dashed #00ff9d;
}
</style>
