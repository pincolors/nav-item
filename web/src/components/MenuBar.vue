<template>
  <div class="menu-scroll-wrapper">
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
                'is-pressing': pressingId === menu.id
              }"
              @click="handleClick(menu)"
              @touchstart="handleTouchStart(menu)"
              @touchend="handleTouchEnd"
              @touchcancel="handleTouchEnd"
              @mousedown="handleMouseDown(menu)"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseUp"
            >
              <span class="menu-name">{{ menu.name }}</span>
              
              <!-- 长按进度指示器 -->
              <div v-if="isEditMode && pressingId === menu.id" class="press-indicator">
                <svg class="progress-ring" width="24" height="24">
                  <circle
                    class="progress-ring-circle"
                    stroke="var(--primary-color)"
                    stroke-width="2"
                    fill="transparent"
                    r="10"
                    cx="12"
                    cy="12"
                    :style="{ strokeDashoffset: progressOffset }"
                  />
                </svg>
              </div>
              
              <!-- 删除按钮 -->
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

    <!-- 二级菜单 -->
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
  isEditMode: { type: Boolean, default: false }
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
.menu-scroll-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
}

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

.menu-outer::-webkit-scrollbar { 
  display: none; 
}

.menu-list {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 16px;
  padding: 0 20px 10px 20px;
  align-items: center;
  min-width: min-content;
}

.menu-item-wrapper {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
              opacity 0.3s ease;
  will-change: transform;
}

.menu-list.sortable-drag .menu-item-wrapper:not(.sortable-chosen):not(.sortable-ghost) {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
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
  font-weight: 800; 
  font-family: system-ui, -apple-system, sans-serif;
  
  /* 🎨 亮色模式：深灰色（未选中） */
  color: rgba(0, 0, 0, 0.5);
  
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.8;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.menu-item.is-edit-mode {
  padding-right: 28px;
}

.menu-item:hover {
  background: rgba(128,128,128,0.05);
  /* 🎨 亮色模式悬停：深色 */
  color: rgba(0, 0, 0, 0.75);
  opacity: 1;
}

.menu-item.is-pressing {
  background: rgba(6, 182, 212, 0.1);
  transform: scale(1.05);
}

/* 🎨🎨🎨 激活状态 - 亮色模式：青色 🎨🎨🎨 */
.menu-item.active {
  color: #0891B2; /* 青色 */
  opacity: 1;
  background: transparent;
  font-weight: 900; 
}

.menu-item.active::after {
  content: '';
  position: absolute;
  bottom: 0px; 
  left: 15px; 
  right: 15px;
  height: 4px;
  border-radius: 4px;
  /* 亮色模式：青色渐变 */
  background: linear-gradient(90deg, #06B6D4, #0891B2);
  box-shadow: 0 2px 8px rgba(8, 145, 178, 0.5);
}

.chosen-menu .menu-item {
  opacity: 0.8;
  cursor: grabbing;
}

.dragging-menu {
  opacity: 1 !important;
  cursor: grabbing !important;
  z-index: 9999 !important;
}

.dragging-menu .menu-item {
  transform: rotate(3deg) scale(1.1);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3),
              0 5px 15px rgba(0, 0, 0, 0.2);
  background: var(--card-bg) !important;
  opacity: 1 !important;
  border: 2px solid #0891B2; /* 青色边框 */
}

.ghost-menu {
  opacity: 0.5 !important;
}

.ghost-menu .menu-item {
  background: linear-gradient(135deg, 
    rgba(6, 182, 212, 0.1), 
    rgba(8, 145, 178, 0.1)) !important;
  border: 2px dashed #0891B2 !important; /* 青色虚线 */
  color: #0891B2 !important;
  position: relative;
  overflow: hidden;
}

.ghost-menu .menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(6, 182, 212, 0.3), 
    transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.ghost-menu .menu-item::after {
  display: none;
}

.fallback-drag {
  opacity: 1 !important;
  cursor: grabbing !important;
}

.fallback-drag .menu-item {
  transform: rotate(3deg) scale(1.1);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3) !important;
  background: var(--card-bg) !important;
}

.press-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle {
  stroke-dasharray: 63;
  stroke-dashoffset: 63;
  transition: stroke-dashoffset 0.01s linear;
  stroke-linecap: round;
  filter: drop-shadow(0 0 3px #0891B2);
}

.menu-name {
  position: relative;
  z-index: 1;
}

.menu-del {
  position: absolute; 
  top: -4px; 
  right: -4px;
  background: #ff4d4f; 
  color: white;
  border: none;
  border-radius: 50%; 
  width: 20px; 
  height: 20px;
  font-size: 12px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  opacity: 0; 
  transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
  z-index: 10;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.menu-item:hover .menu-del { 
  opacity: 1; 
  transform: scale(1); 
}

.menu-del:hover {
  background: #ff7875;
  transform: scale(1.15) !important;
}

.menu-del:active {
  transform: scale(0.95) !important;
}

.add-menu-btn {
  display: flex; 
  align-items: center; 
  justify-content: center;
  min-width: 44px; 
  width: 44px; 
  height: 44px;
  flex-shrink: 0;
  margin-left: 10px;
  border: 2px dashed rgba(128,128,128,0.3);
  border-radius: 12px;
  font-weight: bold;
  font-size: 24px;
  color: var(--text-color);
  cursor: pointer;
  opacity: 0.6;
  background: transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
}

.add-menu-btn:hover {
  border-color: #0891B2; /* 青色 */
  color: #0891B2;
  background: rgba(6, 182, 212, 0.08);
  opacity: 1;
  transform: scale(1.05);
}

.add-menu-btn:active {
  transform: scale(0.95);
}

/* === 二级菜单样式 === */
.sub-menu-outer {
  width: 100%;
  display: flex;
  justify-content: center;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.sub-menu-outer::-webkit-scrollbar { 
  display: none; 
}

.sub-menu-bar {
  display: flex; 
  flex-wrap: nowrap;
  gap: 10px; 
  padding: 5px 20px 15px; 
  min-width: min-content;
}

.sub-menu-item {
  flex-shrink: 0;
  font-size: 14px; 
  padding: 6px 16px;
  border-radius: 20px; 
  background: rgba(128,128,128,0.05);
  
  /* 🎨 亮色模式：中灰色 */
  color: rgba(0, 0, 0, 0.6); 
  opacity: 0.85; 
  
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  font-weight: 600; 
  white-space: nowrap;
  border: none;
}

.sub-menu-item:hover {
  opacity: 1;
  color: rgba(0, 0, 0, 0.85);
  transform: translateY(-1px);
  background: rgba(128,128,128,0.1);
}

.sub-menu-item:active {
  transform: translateY(0);
}

/* 🎨 亮色模式激活状态：青色 */
.sub-menu-item.active {
  background: rgba(6, 182, 212, 0.12); 
  color: #0891B2; 
  font-weight: 700;
  border: 1px solid rgba(6, 182, 212, 0.3); 
  opacity: 1;
}

/* 🌙🌙🌙 暗色模式配色 - 青色系 🌙🌙🌙 */
@media (prefers-color-scheme: dark) {
  .menu-item {
    /* 暗色模式：浅灰色（未选中） */
    color: rgba(255, 255, 255, 0.5);
  }
  
  .menu-item:hover {
    background: rgba(255, 255, 255, 0.05);
    /* 暗色模式悬停：亮白色 */
    color: rgba(255, 255, 255, 0.8);
  }
  
  .menu-item.is-pressing {
    background: rgba(34, 211, 238, 0.15);
  }
  
  /* 激活状态：亮青色 */
  .menu-item.active {
    color: #22D3EE; /* 亮青色 */
  }
  
  .menu-item.active::after {
    /* 暗色模式：亮青色渐变 */
    background: linear-gradient(90deg, #67E8F9, #22D3EE);
    box-shadow: 0 2px 8px rgba(34, 211, 238, 0.5);
  }
  
  .dragging-menu .menu-item {
    background: #25262b !important;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6),
                0 5px 15px rgba(34, 211, 238, 0.3);
    border: 2px solid #22D3EE;
  }
  
  .ghost-menu .menu-item {
    background: linear-gradient(135deg, 
      rgba(34, 211, 238, 0.1), 
      rgba(103, 232, 249, 0.1)) !important;
    border: 2px dashed #22D3EE !important;
    color: #22D3EE !important;
  }
  
  .ghost-menu .menu-item::before {
    background: linear-gradient(90deg, 
      transparent, 
      rgba(34, 211, 238, 0.3), 
      transparent);
  }
  
  .progress-ring-circle {
    filter: drop-shadow(0 0 3px #22D3EE);
  }
  
  .add-menu-btn:hover {
    border-color: #22D3EE;
    color: #22D3EE;
    background: rgba(34, 211, 238, 0.1);
  }
  
  /* 二级菜单暗色模式 */
  .sub-menu-item { 
    background: rgba(255,255,255,0.08); 
    color: rgba(255, 255, 255, 0.6);
  }
  
  .sub-menu-item:hover {
    background: rgba(255,255,255,0.12);
    color: rgba(255, 255, 255, 0.9);
  }
  
  .sub-menu-item.active { 
    color: #22D3EE; 
    background: rgba(34, 211, 238, 0.15);
    border: 1px solid rgba(34, 211, 238, 0.3);
  }
}

/* 旧版暗黑模式适配（向下兼容） */
:global(.dark-mode) .menu-item {
  color: rgba(255, 255, 255, 0.5);
}

:global(.dark-mode) .menu-item:hover {
  background: rgba(255,255,255,0.05);
  color: rgba(255, 255, 255, 0.8);
}

:global(.dark-mode) .menu-item.active {
  color: #22D3EE;
}

:global(.dark-mode) .menu-item.active::after {
  background: linear-gradient(90deg, #67E8F9, #22D3EE);
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.5);
}

:global(.dark-mode) .menu-item.is-pressing {
  background: rgba(34, 211, 238, 0.15);
}

:global(.dark-mode) .dragging-menu .menu-item {
  background: #25262b !important;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6),
              0 5px 15px rgba(34, 211, 238, 0.3);
  border: 2px solid #22D3EE;
}

:global(.dark-mode) .sub-menu-item { 
  background: rgba(255,255,255,0.08); 
  color: rgba(255, 255, 255, 0.6);
}

:global(.dark-mode) .sub-menu-item.active { 
  color: #22D3EE; 
  background: rgba(34, 211, 238, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.3);
}

/* === 移动端优化 === */
@media (max-width: 768px) {
  .menu-item {
    font-size: 16px;
    padding: 8px 16px;
  }
  
  .menu-item.is-edit-mode {
    padding-right: 24px;
  }
  
  .sub-menu-item {
    font-size: 13px;
    padding: 5px 14px;
  }
  
  .menu-del {
    width: 18px;
    height: 18px;
    font-size: 11px;
  }
}

/* === 性能优化 === */
.menu-list * {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.menu-item-wrapper,
.dragging-menu,
.ghost-menu {
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
</style>
