<template>
  <div class="menu-scroll-wrapper" :class="{ 'dark-theme': isDarkMode }">
    <div class="menu-outer" ref="menuOuterRef">
      <draggable 
        v-model="localMenus"
        item-key="id"
        class="menu-list"
        :disabled="!isEditMode"
        :animation="300"
        :easing="'cubic-bezier(0.25, 0.8, 0.25, 1)'"
        :delay="500"
        :delay-on-touch-only="false"
        :touch-start-threshold="10"
        ghost-class="ghost-menu"
        drag-class="dragging-menu"
        chosen-class="chosen-menu"
        :force-fallback="true"
        :fallback-class="'fallback-drag'"
        :fallback-on-body="true"
        :scroll-sensitivity="100"
        :scroll-speed="10"
        @start="onDragStart"
        @end="onDragEnd"
        @change="onChange"
      >
        <template #item="{ element: menu }">
          <div 
            class="menu-item-wrapper"
            :data-id="menu.id"
          >
            <div 
              class="menu-item" 
              :class="{ 
                active: activeId === menu.id, 
                'is-edit-mode': isEditMode,
                'is-dragging-item': isDragging,
                'is-pressing': pressingId === menu.id,
                'dark-mode-item': isDarkMode 
              }"
              @click="handleClick(menu)"
              @touchstart="handleTouchStart(menu)"
              @touchend="handleTouchEnd"
              @touchcancel="handleTouchEnd"
              @mousedown="handleMouseDown(menu)"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseUp"
            >
              <button 
                v-if="isEditMode" 
                class="menu-edit" 
                @click.stop="handleRename(menu)"
                @touchstart.stop
                type="button"
                aria-label="重命名菜单"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>

              <span class="menu-name">{{ menu.name }}</span>
              
              <div v-if="isEditMode && pressingId === menu.id" class="press-indicator">
                <svg class="progress-ring" width="24" height="24">
                  <circle
                    class="progress-ring-circle"
                    stroke="var(--accent-color)"
                    stroke-width="2"
                    fill="transparent"
                    r="10"
                    cx="12"
                    cy="12"
                    :style="{ strokeDashoffset: progressOffset }"
                  />
                </svg>
              </div>
              
              <button 
                v-if="isEditMode" 
                class="menu-del" 
                @click.stop="handleDelete(menu.id)"
                @touchstart.stop
                type="button"
                aria-label="删除菜单"
              >
                ✕
              </button>
            </div>
          </div>
        </template>

        <template #footer>
          <button 
            v-if="isEditMode" 
            class="add-menu-btn" 
            @click="$emit('add')"
            type="button"
            aria-label="添加菜单"
          >
            +
          </button>
        </template>
      </draggable>
    </div>

    <div v-if="activeMenu && activeMenu.subMenus && activeMenu.subMenus.length" class="sub-menu-outer">
      <div class="sub-menu-bar">
        <button
          v-for="sub in activeMenu.subMenus" 
          :key="sub.id" 
          class="sub-menu-item"
          :class="{ active: activeSubMenuId === sub.id }"
          type="button"
          @click="$emit('select', sub, activeMenu)"
        >
          {{ sub.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import draggable from 'vuedraggable';

const props = defineProps({
  menus: { type: Array, required: true },
  activeId: [Number, String],
  activeSubMenuId: [Number, String],
  isEditMode: { type: Boolean, default: false },
  isDarkMode: { type: Boolean, default: false }
});

const emit = defineEmits(['select', 'update:menus', 'add', 'delete']);

const menuOuterRef = ref(null);
const isDragging = ref(false);
const pressingId = ref(null);
const pressTimer = ref(null);
const progressOffset = ref(63);

const localMenus = computed({
  get: () => props.menus,
  set: (value) => emit('update:menus', value)
});

const activeMenu = computed(() => 
  props.menus.find(m => m.id === props.activeId)
);

function handleClick(menu) {
  if (isDragging.value) return;
  if (pressingId.value) return;
  emit('select', menu);
}

// 【新增】处理重命名逻辑
function handleRename(menu) {
  const newName = prompt('重命名菜单', menu.name);
  if (newName === null || newName.trim() === '') return;
  
  const newMenus = [...props.menus];
  const target = newMenus.find(m => m.id === menu.id);
  if (target) {
    target.name = newName.trim();
    emit('update:menus', newMenus);
  }
}

function handleTouchStart(menu) {
  if (!props.isEditMode) return;
  startPressing(menu);
}

function handleTouchEnd() {
  stopPressing();
}

function handleMouseDown(menu) {
  if (!props.isEditMode) return;
  startPressing(menu);
}

function handleMouseUp() {
  stopPressing();
}

function startPressing(menu) {
  pressingId.value = menu.id;
  progressOffset.value = 63;
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    progressOffset.value = 63 - (63 * progress / 500);
    
    if (progress >= 500) {
      clearInterval(interval);
    }
  }, 10);
  
  pressTimer.value = setTimeout(() => {
    clearInterval(interval);
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, 500);
}

function stopPressing() {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
  pressingId.value = null;
  progressOffset.value = 63;
}

function onDragStart() {
  isDragging.value = true;
  stopPressing();
}

function onDragEnd() {
  setTimeout(() => {
    isDragging.value = false;
  }, 100);
}

function onChange(evt) {
  console.log('Position changed:', evt);
}

function handleDelete(id) {
  emit('delete', id);
}
</script>

<style scoped>
/* =========================================
   1. 定义 CSS 变量
   ========================================= */

.menu-scroll-wrapper {
  --text-primary: rgba(0, 0, 0, 0.75);
  --text-secondary: rgba(0, 0, 0, 0.65);
  --text-hover: #000000;
  --accent-color: #0891B2;
  --accent-light: #06B6D4;
  --bg-color: #ffffff;
  --bg-hover: rgba(128, 128, 128, 0.08);
  --bg-hover-strong: rgba(128, 128, 128, 0.15);
  --border-dashed: rgba(128, 128, 128, 0.3);
  --card-bg-drag: #ffffff;
  
  width: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

.menu-scroll-wrapper.dark-theme {
  --text-primary: rgba(255, 255, 255, 0.85);
  --text-secondary: rgba(255, 255, 255, 0.75);
  --text-hover: #ffffff;
  --accent-color: #22D3EE;
  --accent-light: #67E8F9;
  --bg-color: transparent;
  --bg-hover: rgba(255, 255, 255, 0.08);
  --bg-hover-strong: rgba(255, 255, 255, 0.15);
  --border-dashed: rgba(255, 255, 255, 0.3);
  --card-bg-drag: #1e1e1e;
}

.menu-item.dark-mode-item {
  --text-primary: rgba(255, 255, 255, 0.85);
  --text-hover: #ffffff;
  --accent-color: #22D3EE;
  --card-bg-drag: #1f2937;
  --bg-hover-strong: rgba(255, 255, 255, 0.15);
}

/* =========================================
   2. 布局样式
   ========================================= */

.menu-outer {
  width: 100%;
  display: flex;
  justify-content: center;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  scroll-behavior: smooth;
}
.menu-outer::-webkit-scrollbar { display: none; }

.menu-list {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 0 20px 10px 20px;
  align-items: center;
  min-width: min-content;
}

.menu-item-wrapper {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease;
  will-change: transform;
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 18px; 
  font-weight: 700; 
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--text-primary) !important;
  -webkit-text-fill-color: var(--text-primary) !important;
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
  user-select: none;
  background: transparent;
}

/* 【修改】编辑模式下的内边距，给左右按钮留位置 */
.menu-item.is-edit-mode { 
  padding-right: 28px; 
  padding-left: 28px; 
}

.menu-item:hover {
  background: var(--bg-hover) !important;
  color: var(--text-hover) !important;
  -webkit-text-fill-color: var(--text-hover) !important;
}

.menu-item.is-pressing {
  background: var(--bg-hover-strong) !important;
  transform: scale(1.05);
}

/* 【修改】激活状态 - 下划线变细 */
.menu-item.active {
  color: var(--accent-color) !important;
  -webkit-text-fill-color: var(--accent-color) !important;
  background: transparent !important;
  font-weight: 800; 
}

.menu-item.active::after {
  content: '';
  position: absolute;
  /* 稍微上移，悬浮感更好 */
  bottom: 2px; 
  left: 15px; 
  right: 15px;
  /* 变细为 2px */
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--accent-light), var(--accent-color)) !important;
  box-shadow: 0 1px 4px var(--accent-color);
}

/* =========================================
   3. 拖拽与按钮样式
   ========================================= */

.chosen-menu .menu-item { opacity: 0.8; cursor: grabbing; }

.dragging-menu, .fallback-drag { z-index: 9999 !important; }

.dragging-menu .menu-item,
.fallback-drag .menu-item {
  background: var(--card-bg-drag) !important; 
  color: var(--text-primary) !important;
  -webkit-text-fill-color: var(--text-primary) !important;
  border: 2px solid var(--accent-color) !important;
  transform: rotate(3deg) scale(1.1);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3) !important;
  opacity: 1 !important;
}

.ghost-menu { opacity: 0.5 !important; }
.ghost-menu .menu-item {
  background: var(--bg-hover-strong) !important;
  border: 2px dashed var(--accent-color) !important;
  color: var(--accent-color) !important;
  -webkit-text-fill-color: var(--accent-color) !important;
  position: relative;
  overflow: hidden;
}

/* =========================================
   4. 按钮样式 (新增编辑按钮)
   ========================================= */

.press-indicator {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none; z-index: 5;
}
.progress-ring { transform: rotate(-90deg); }
.progress-ring-circle {
  stroke: var(--accent-color) !important;
  transition: stroke-dashoffset 0.01s linear;
  stroke-linecap: round;
  filter: drop-shadow(0 0 3px var(--accent-color));
}

/* 删除按钮 (红色) */
.menu-del {
  position: absolute; top: -4px; right: -4px;
  background: #ff4d4f !important; color: white !important;
  -webkit-text-fill-color: white !important;
  border: none; border-radius: 50%; 
  width: 20px; height: 20px; font-size: 12px; 
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
  z-index: 10; cursor: pointer; padding: 0; line-height: 1;
}

/* 【新增】编辑按钮 (蓝色) */
.menu-edit {
  position: absolute; top: -4px; left: -4px;
  background: #3b82f6 !important; color: white !important;
  -webkit-text-fill-color: white !important;
  border: none; border-radius: 50%; 
  width: 20px; height: 20px; 
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  z-index: 10; cursor: pointer; padding: 0; line-height: 1;
}

/* 悬停时显示按钮 */
.menu-item:hover .menu-del,
.menu-item:hover .menu-edit { opacity: 1; transform: scale(1); }

.menu-del:hover { background: #ff7875 !important; transform: scale(1.15) !important; }
.menu-del:active { transform: scale(0.95) !important; }

.menu-edit:hover { background: #2563eb !important; transform: scale(1.15) !important; }
.menu-edit:active { transform: scale(0.95) !important; }

/* 手机端适配：编辑模式下常显按钮 */
@media (max-width: 768px) {
  .menu-item { font-size: 16px; padding: 8px 16px; }
  .menu-item.is-edit-mode { 
    padding-right: 24px; 
    padding-left: 24px; 
  }
  .sub-menu-item { font-size: 13px; padding: 5px 14px; }
  
  /* 强制显示 */
  .menu-item.is-edit-mode .menu-del,
  .menu-item.is-edit-mode .menu-edit {
    opacity: 1 !important;
    transform: scale(1) !important;
  }
}

.add-menu-btn {
  display: flex; align-items: center; justify-content: center;
  min-width: 44px; width: 44px; height: 44px;
  flex-shrink: 0; margin-left: 10px;
  border: 2px dashed var(--border-dashed) !important;
  border-radius: 12px;
  font-weight: bold; font-size: 24px;
  color: var(--text-secondary) !important;
  -webkit-text-fill-color: var(--text-secondary) !important;
  cursor: pointer; opacity: 0.6; background: transparent !important;
  transition: all 0.25s; padding: 0;
}
.add-menu-btn:hover {
  border-color: var(--accent-color) !important;
  color: var(--accent-color) !important;
  -webkit-text-fill-color: var(--accent-color) !important;
  background: var(--bg-hover) !important;
  opacity: 1; transform: scale(1.05);
}

.sub-menu-outer {
  width: 100%; display: flex; justify-content: center;
  overflow-x: auto; overflow-y: hidden;
  scrollbar-width: none;
}
.sub-menu-outer::-webkit-scrollbar { display: none; }
.sub-menu-bar {
  display: flex; flex-wrap: nowrap; gap: 10px; 
  padding: 5px 20px 15px; min-width: min-content;
}
.sub-menu-item {
  flex-shrink: 0; font-size: 14px; padding: 6px 16px;
  border-radius: 20px; 
  background: var(--bg-hover) !important;
  color: var(--text-primary) !important;
  -webkit-text-fill-color: var(--text-primary) !important;
  opacity: 1; cursor: pointer;
  transition: all 0.2s; font-weight: 600; 
  white-space: nowrap; border: none;
}
.sub-menu-item:hover {
  color: var(--text-hover) !important;
  -webkit-text-fill-color: var(--text-hover) !important;
  transform: translateY(-1px);
  background: var(--bg-hover-strong) !important;
}
.sub-menu-item.active {
  background: var(--bg-hover-strong) !important;
  color: var(--accent-color) !important;
  -webkit-text-fill-color: var(--accent-color) !important;
  font-weight: 700;
  border: 1px solid var(--accent-color) !important;
}

.menu-list *, .menu-item *, .sub-menu-item * {
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
}
.menu-item-wrapper, .dragging-menu, .ghost-menu {
  -webkit-transform: translateZ(0); transform: translateZ(0);
  -webkit-backface-visibility: hidden; backface-visibility: hidden;
}
</style>

