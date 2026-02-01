<template>
  <div class="grid-container" :class="{ 'dark-theme': isDarkMode }">
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
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
              </svg>
            </div>

            <div v-if="isEditMode" class="action-buttons">
              <button class="icon-btn edit-btn" @click.stop="$emit('edit', element)" title="编辑">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button class="icon-btn del-btn" @click.stop="$emit('delete', element.id)" title="删除">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>

            <div class="card-icon-wrapper">
              <div v-if="loadingIcons[element.id]" class="icon-skeleton"></div>
              
              <img 
                v-else-if="!iconError[element.id]"
                :src="getIconSrc(element)" 
                class="real-icon"
                @load="onImgLoad(element.id)"
                @error="onImgError(element.id)"
                loading="lazy"
                decoding="async"
                :alt="element.title || element.name"
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
import { ref, watch, reactive, onMounted } from 'vue';
import draggable from 'vuedraggable';

const props = defineProps({ 
  cards: Array, 
  isEditMode: Boolean,
  // 1️⃣ 新增：接收暗黑模式状态
  isDarkMode: Boolean 
});

const emit = defineEmits(['update:cards', 'edit', 'delete', 'add']);
const localCards = ref([...props.cards || []]);
const iconError = reactive({});
const loadingIcons = reactive({});
const iconCache = new Map();
const failedAttempts = reactive({}); 

watch(() => props.cards, (newVal) => { 
  localCards.value = [...newVal || []];
  preloadIcons(newVal);
}, { deep: true });

onMounted(() => {
  initializeLoadingStates();
  preloadIcons(props.cards);
});

function initializeLoadingStates() {
  if (!props.cards) return;
  props.cards.forEach(card => {
    loadingIcons[card.id] = true;
    failedAttempts[card.id] = 0; 
  });
}

function preloadIcons(cards) {
  if (!cards) return;
  
  cards.forEach(card => {
    const iconUrl = getIconSrc(card);
    
    if (!iconUrl || iconCache.has(iconUrl)) {
      loadingIcons[card.id] = false;
      return;
    }
    
    const img = new Image();
    img.src = iconUrl;
    
    img.onload = () => {
      iconCache.set(iconUrl, true);
      loadingIcons[card.id] = false;
    };
    
    img.onerror = () => {
      handleIconError(card);
    };
  });
}

function onDragEnd() { 
  emit('update:cards', localCards.value); 
}

function handleClick(e) { 
  if (props.isEditMode) e.preventDefault(); 
}

const getIconSrc = (site) => {
  if (site.icon && site.icon.startsWith('http')) return site.icon;
  if (site.logo_url) return site.logo_url;
  
  try {
    const domain = new URL(site.url).hostname;
    const attemptCount = failedAttempts[site.id] || 0;
    
    const apis = [
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://api.faviconkit.com/${domain}/128`,
      `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${site.url}&size=128`,
      `https://${domain}/favicon.ico`
    ];
    
    return apis[Math.min(attemptCount, apis.length - 1)];
  } catch (e) {
    return '';
  }
};

const handleIconError = (card) => {
  const currentAttempt = failedAttempts[card.id] || 0;
  if (currentAttempt < 4) {
    failedAttempts[card.id] = currentAttempt + 1;
    setTimeout(() => {
      const newUrl = getIconSrc(card);
      const img = new Image();
      img.src = newUrl;
      img.onload = () => {
        iconCache.set(newUrl, true);
        loadingIcons[card.id] = false;
        iconError[card.id] = false;
      };
      img.onerror = () => {
        handleIconError(card); 
      };
    }, 100 * (currentAttempt + 1)); 
  } else {
    loadingIcons[card.id] = false;
    iconError[card.id] = true;
  }
};

const onImgLoad = (id) => {
  loadingIcons[id] = false;
};

const onImgError = (id) => {
  const card = localCards.value.find(c => c.id === id);
  if (card) {
    handleIconError(card);
  }
};
</script>

<style scoped>
/* 3️⃣ 核心修改：CSS 适配 */
/* 修改逻辑：所有的暗黑样式，现在不仅支持 @media (系统级)，
   还支持 .grid-container.dark-theme (手动级)
*/

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
  .card-grid {
    grid-template-columns: repeat(6, 1fr); 
    gap: 28px 20px;
  }
}

.card-wrapper {
  min-height: 140px;
  perspective: 1000px;
}

/* === 卡片基础样式 (亮色默认) === */
.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 140px;
  width: 100%;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 4px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  color: inherit;
  text-decoration: none;
  position: relative;
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  box-sizing: border-box;
  touch-action: pan-y;
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(250, 250, 252, 1) 100%
  );
}

.card-item:not(.is-dragging):hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 16px 48px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  border-color: rgba(0, 255, 157, 0.3);
  background: rgba(255, 255, 255, 1);
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(248, 250, 252, 1) 100%
  );
}

/* === 🌙 暗黑模式适配 (支持系统级 OR 手动级) === */
@media (prefers-color-scheme: dark) {
  .card-item {
    background: rgba(255, 255, 255, 0.06);
    background-image: none;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  .card-item:not(.is-dragging):hover {
    background: rgba(255, 255, 255, 0.1);
    background-image: none;
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
}

/* 👇👇👇 手动强制暗黑模式样式 (关键修复) 👇👇👇 */
.grid-container.dark-theme .card-item {
  background: rgba(255, 255, 255, 0.06) !important;
  background-image: none !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}

.grid-container.dark-theme .card-item:not(.is-dragging):hover {
  background: rgba(255, 255, 255, 0.1) !important;
  background-image: none !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

.card-item.is-dragging {
  cursor: grabbing;
  opacity: 0.9;
  box-shadow: 
    0 12px 28px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.1);
}

.ghost .card-item {
  opacity: 0.5;
  background: rgba(0, 255, 157, 0.08);
  border: 2px dashed #00ff9d;
  box-shadow: 0 4px 12px rgba(0, 255, 157, 0.2);
}

/* === 图标容器 === */
.card-icon-wrapper {
  width: 64px; 
  height: 64px; 
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(241, 245, 249, 1) 100%);
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), inset 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  position: relative;
}

.card-item:hover .card-icon-wrapper {
  background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(0, 0, 0, 0.03);
}

/* 🌙 系统级暗黑 */
@media (prefers-color-scheme: dark) {
  .card-icon-wrapper {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  .card-item:hover .card-icon-wrapper {
    background: rgba(255, 255, 255, 0.12);
  }
}

/* 👇👇👇 手动级暗黑 (强制覆盖) */
.grid-container.dark-theme .card-icon-wrapper {
  background: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}
.grid-container.dark-theme .card-item:hover .card-icon-wrapper {
  background: rgba(255, 255, 255, 0.12) !important;
}

/* 骨架屏 */
.icon-skeleton {
  position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px;
  background: linear-gradient(90deg, rgba(200, 200, 200, 0.2) 25%, rgba(200, 200, 200, 0.3) 50%, rgba(200, 200, 200, 0.2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite ease-in-out;
  border-radius: 8px;
}
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

@media (prefers-color-scheme: dark) {
  .icon-skeleton {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%);
  }
}
/* 👇 手动暗黑骨架屏 */
.grid-container.dark-theme .icon-skeleton {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%) !important;
}

.real-icon { width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s; }
.card-item:hover .real-icon { transform: scale(1.1); }

.fallback-icon {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: bold; color: #00ff9d;
  text-shadow: 0 2px 4px rgba(0, 255, 157, 0.3);
}

.card-title {
  font-size: 14px; font-weight: 700; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 4px; color: rgba(0, 0, 0, 0.9);
}
.card-desc {
  font-size: 12px; opacity: 0.6; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: rgba(0, 0, 0, 0.6);
}

@media (prefers-color-scheme: dark) {
  .card-title { color: rgba(255, 255, 255, 0.95); }
  .card-desc { color: rgba(255, 255, 255, 0.6); }
}
/* 👇 手动暗黑字体 */
.grid-container.dark-theme .card-title { color: rgba(255, 255, 255, 0.95) !important; }
.grid-container.dark-theme .card-desc { color: rgba(255, 255, 255, 0.6) !important; }

/* 控件 */
.drag-indicator {
  position: absolute; top: 8px; left: 8px; opacity: 0.4;
  background: rgba(120, 120, 120, 0.2);
  border-radius: 50%; padding: 4px; display: flex; box-shadow: none; pointer-events: none;
  color: rgba(0, 0, 0, 0.5);
}
@media (prefers-color-scheme: dark) {
  .drag-indicator { background: rgba(255, 255, 255, 0.12); color: rgba(255, 255, 255, 0.5); }
}
.grid-container.dark-theme .drag-indicator { background: rgba(255, 255, 255, 0.12) !important; color: rgba(255, 255, 255, 0.5) !important; }

.action-buttons {
  position: absolute; top: 6px; right: 6px; display: flex !important; gap: 6px; z-index: 100; pointer-events: auto;
}
.icon-btn {
  background: transparent; border: none; border-radius: 8px; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;
  box-shadow: none; flex-shrink: 0;
}
.icon-btn:hover { transform: scale(1.15); }
.icon-btn:active { transform: scale(0.9); }
.edit-btn { color: #2196F3; }
.edit-btn:hover { background: rgba(33, 150, 243, 0.1); color: #1565C0; }
.del-btn { color: #F44336; }
.del-btn:hover { background: rgba(244, 67, 54, 0.1); color: #C62828; }

@media (prefers-color-scheme: dark) {
  .icon-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); }
  .icon-btn:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-1px) scale(1.1); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); }
  .edit-btn { color: #64B5F6; }
  .edit-btn:hover { background: rgba(33, 150, 243, 0.25); color: #90CAF9; border-color: #42A5F5; }
  .del-btn { color: #EF5350; }
  .del-btn:hover { background: rgba(244, 67, 54, 0.25); color: #E57373; border-color: #EF5350; }
}

/* 👇 手动暗黑按钮 */
.grid-container.dark-theme .icon-btn { 
  background: rgba(255, 255, 255, 0.08) !important; 
  border: 1px solid rgba(255, 255, 255, 0.12) !important; 
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important; 
}
.grid-container.dark-theme .icon-btn:hover { 
  background: rgba(255, 255, 255, 0.15) !important; 
}
.grid-container.dark-theme .edit-btn { color: #64B5F6 !important; }
.grid-container.dark-theme .del-btn { color: #EF5350 !important; }

.add-card { border: 2px dashed rgba(0, 0, 0, 0.15); background: transparent; box-shadow: none; }
.add-card:hover { border-color: #00ff9d; background: rgba(0, 255, 157, 0.05); box-shadow: 0 4px 12px rgba(0, 255, 157, 0.1), inset 0 1px 0 rgba(0, 255, 157, 0.1); }

@media (prefers-color-scheme: dark) {
  .add-card { border-color: rgba(255, 255, 255, 0.2); }
}
.grid-container.dark-theme .add-card { border-color: rgba(255, 255, 255, 0.2) !important; }

.add-icon { font-size: 32px; color: #00ff9d; margin-bottom: 0; text-shadow: 0 2px 8px rgba(0, 255, 157, 0.3); }
</style>
