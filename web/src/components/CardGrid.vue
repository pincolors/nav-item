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
      :scroll="true"
      :scroll-sensitivity="200"
      :scroll-speed="20"
      :force-fallback="true"
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
            <div v-if="isEditMode" class="drag-handle" title="按住任意位置拖拽">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
            </div>

            <div v-if="isEditMode" class="action-buttons">
              <button class="icon-btn edit-btn" @click.stop="$emit('edit', element)" title="设置">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L5.09 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"></path></svg>
              </button>
              <button class="icon-btn del-btn" @click.stop="$emit('delete', element.id)" title="删除">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
              </button>
            </div>

            <div class="card-icon-wrapper">
              <div v-if="isLoading(element.id)" class="skeleton-icon"></div>
              <img 
                v-show="shouldShowImage(element.id)"
                :src="getIconSrc(element)" 
                class="real-icon"
                :class="{ 'visible': isLoaded(element.id) }"
                @load="onImgLoad(element.id)"
                @error="onImgError(element.id, element)"
              />
              <div v-if="isFallback(element.id)" class="fallback-icon">
                {{ (element.title || '?').charAt(0).toUpperCase() }}
              </div>
            </div>

            <div class="card-info">
              <div class="card-title">{{ element.title }}</div>
              <div class="card-desc">{{ element.desc }}</div>
            </div>
          </component>
        </div>
      </template>
      
      <template #footer>
         <div v-if="isEditMode" class="card-wrapper">
           <div class="card-item add-card" @click="$emit('add')">
             <div class="add-icon">+</div>
             <div class="card-title" style="margin-top: 8px; opacity: 0.6;">添加站点</div>
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
const localCards = ref([...props.cards]);
const iconState = reactive({});

watch(() => props.cards, (newVal) => { localCards.value = [...newVal]; });

function onDragEnd() { emit('update:cards', localCards.value); }
function handleClick(e) { if (props.isEditMode) e.preventDefault(); }

const getState = (id) => !iconState[id] ? (iconState[id] = { step: 0, loaded: false, error: false }) : iconState[id];
const getDomain = (url) => { try { return new URL(url).hostname; } catch (e) { return ''; } };
const getIconSrc = (card) => {
  const state = getState(card.id);
  const domain = getDomain(card.url);
  if (state.step === 0) { if (card.logo_url) return card.logo_url; state.step = 1; }
  if (state.step === 1) return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  if (state.step === 2) return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  return ''; 
};
const onImgLoad = (id) => getState(id).loaded = true;
const onImgError = (id, card) => {
  const state = getState(id);
  state.loaded = false; 
  state.step < 3 ? state.step++ : state.error = true;
};
const isLoading = (id) => { const state = getState(id); return state.step < 3 && !state.loaded; };
const shouldShowImage = (id) => getState(id).step < 3;
const isLoaded = (id) => getState(id).loaded;
const isFallback = (id) => getState(id).step >= 3;
</script>

<style scoped>
/* 1. 网格布局 */
.card-grid {
  display: grid;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  gap: 30px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  
  /* === 关键修正：确保 grid 不会限制滚动 === */
  min-height: 100%; 
  overflow: visible; 
}

@media (min-width: 1200px) {
  .card-grid { grid-template-columns: repeat(6, 1fr); }
}

.card-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1.25 / 1;
  perspective: 1200px;
}

/* 2. 卡片核心样式 */
.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: 24px;
  color: var(--text-color);
  text-decoration: none;
  position: relative;
  overflow: hidden;
  user-select: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06), 0 14px 28px rgba(0, 0, 0, 0.10);
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease;
}

/* 浮空底影 */
.card-item::after {
  content: "";
  position: absolute;
  left: 16px; right: 16px; bottom: -14px; height: 22px;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.10) 35%, transparent 70%);
  filter: blur(8px);
  opacity: 0.65;
  transition: all 0.35s ease;
  z-index: -1;
}

/* 顶部高光 */
.card-item::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.12) 25%, transparent 55%);
  pointer-events: none;
  opacity: 0.45;
}
:deep(.dark-mode) .card-item::before {
  background: linear-gradient(180deg, rgba(255,255,255,0.12), transparent 40%);
  opacity: 0.6;
}

/* 拖拽状态 */
.card-item.is-dragging { cursor: grab; }
.card-item.is-dragging:active { cursor: grabbing; }

/* 悬浮交互 */
.card-item:not(.is-dragging):hover {
  transform: translateY(-10px) rotateX(2deg) scale(1.01);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.10), 0 36px 64px rgba(0, 0, 0, 0.16);
  z-index: 2;
}
.card-item:not(.is-dragging):hover::after {
  transform: translateY(8px) scale(1.08);
  opacity: 0.95;
}

/* 3. 图标系统 */
.card-icon-wrapper {
  width: 72px; height: 72px; margin-bottom: 12px;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
}

.real-icon {
  width: 100%; height: 100%; object-fit: contain;
  opacity: 0; transform: scale(0.8);
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  filter: drop-shadow(0 6px 10px rgba(0,0,0,0.15));
}
.real-icon.visible { opacity: 1; transform: scale(1); }

.fallback-icon {
  width: 100%; height: 100%;
  border-radius: 22px;
  background: rgba(0, 255, 157, 0.12);
  color: var(--primary-color);
  display: flex; align-items: center; justify-content: center;
  font-size: 36px; font-weight: 800;
  box-shadow: 0 6px 14px rgba(0, 255, 157, 0.18);
}

.skeleton-icon {
  position: absolute; inset: 0; border-radius: 22px;
  background: linear-gradient(90deg, rgba(163,177,198,0.12) 25%, rgba(163,177,198,0.22) 37%, rgba(163,177,198,0.12) 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}
@keyframes skeleton-loading {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

/* 4. 文本 */
.card-info { text-align: center; width: 100%; padding: 0 12px; }
.card-title {
  font-size: 15px; font-weight: 700; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  letter-spacing: 0.3px; opacity: 0.9;
}
.card-desc { display: none !important; }

/* 5. 控件 */
.drag-handle {
  position: absolute; top: 10px; left: 10px; color: #a3b1c6; pointer-events: none;
}
.action-buttons {
  position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; z-index: 10;
}
.icon-btn {
  width: 28px; height: 28px; border-radius: 8px; border: none;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  background: transparent; color: #a3b1c6;
}
.edit-btn:hover { color: var(--primary-color); transform: scale(1.1); background: rgba(0, 255, 157, 0.12); }
.del-btn:hover { color: #ff4d4f; transform: scale(1.1); background: rgba(255, 77, 79, 0.12); }

.add-card {
  border: 2px dashed rgba(163, 177, 198, 0.4); background: transparent; box-shadow: none;
}
.add-card:hover { border-color: var(--primary-color); background: rgba(0, 255, 157, 0.06); }
.add-icon { font-size: 36px; color: var(--primary-color); font-weight: 300; }

.ghost { opacity: 0.4; background: var(--primary-color); border: 2px solid var(--primary-color); box-shadow: none; }

@media (max-width: 768px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 20px; }
  .card-icon-wrapper { width: 60px; height: 60px; }
  .fallback-icon { font-size: 30px; }
  .card-item:hover { transform: translateY(-6px); }
}
</style>
