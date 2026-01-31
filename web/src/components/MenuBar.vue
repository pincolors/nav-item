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
          <div class="menu-item-wrapper" :data-id="menu.id">
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

              <!-- 长按进度 -->
              <div
                v-if="isEditMode && pressingId === menu.id"
                class="press-indicator"
              >
                <svg class="progress-ring" width="24" height="24">
                  <circle
                    class="progress-ring-circle"
                    r="10"
                    cx="12"
                    cy="12"
                    fill="transparent"
                    stroke-width="2"
                    :style="{ strokeDashoffset: progressOffset }"
                  />
                </svg>
              </div>

              <!-- 删除 -->
              <button
                v-if="isEditMode"
                class="menu-del"
                @click.stop="handleDelete(menu.id)"
                @touchstart.stop
                type="button"
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
          >
            +
          </button>
        </template>
      </draggable>
    </div>

    <!-- 二级菜单 -->
    <div
      v-if="activeMenu && activeMenu.subMenus?.length"
      class="sub-menu-outer"
    >
      <div class="sub-menu-bar">
        <button
          v-for="sub in activeMenu.subMenus"
          :key="sub.id"
          class="sub-menu-item"
          :class="{ active: activeSubMenuId === sub.id }"
          @click="$emit('select', sub, activeMenu)"
        >
          {{ sub.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'

const props = defineProps({
  menus: { type: Array, required: true },
  activeId: [Number, String],
  activeSubMenuId: [Number, String],
  isEditMode: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'update:menus', 'add', 'delete'])

const menuOuterRef = ref(null)
const isDragging = ref(false)
const pressingId = ref(null)
const pressTimer = ref(null)
const progressOffset = ref(63)

const localMenus = computed({
  get: () => props.menus,
  set: v => emit('update:menus', v)
})

const activeMenu = computed(() =>
  props.menus.find(m => m.id === props.activeId)
)

function handleClick(menu) {
  if (isDragging.value || pressingId.value) return
  emit('select', menu)
}

function handleTouchStart(menu) {
  if (!props.isEditMode) return
  startPress(menu)
}

function handleTouchEnd() {
  stopPress()
}

function handleMouseDown(menu) {
  if (!props.isEditMode) return
  startPress(menu)
}

function handleMouseUp() {
  stopPress()
}

function startPress(menu) {
  pressingId.value = menu.id
  progressOffset.value = 63

  let elapsed = 0
  const interval = setInterval(() => {
    elapsed += 10
    progressOffset.value = 63 - (63 * elapsed) / 500
    if (elapsed >= 500) clearInterval(interval)
  }, 10)

  pressTimer.value = setTimeout(() => {
    clearInterval(interval)
    navigator.vibrate?.(50)
  }, 500)
}

function stopPress() {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value)
    pressTimer.value = null
  }
  pressingId.value = null
  progressOffset.value = 63
}

function onDragStart() {
  isDragging.value = true
  stopPress()
}

function onDragEnd() {
  setTimeout(() => (isDragging.value = false), 100)
}

function onChange(e) {
  console.log('drag change', e)
}

function handleDelete(id) {
  emit('delete', id)
}
</scrit>
  <style scoped>
/* ===============================
   🎨 主题变量（关键）
=============================== */

/* ☀️ 默认亮色 */
:root {
  --menu-text: rgba(0, 0, 0, 0.75);
  --menu-text-hover: rgba(0, 0, 0, 0.95);
  --menu-text-active: #0891B2;

  --menu-bg-hover: rgba(128, 128, 128, 0.08);
  --menu-bg-press: rgba(6, 182, 212, 0.1);

  --menu-drag-border: #0891B2;
  --menu-progress: #0891B2;
}

/* 🌙 页面夜间（你自己控制） */
:root.dark {
  --menu-text: rgba(255, 255, 255, 0.75);
  --menu-text-hover: rgba(255, 255, 255, 0.95);
  --menu-text-active: #22D3EE;

  --menu-bg-hover: rgba(255, 255, 255, 0.08);
  --menu-bg-press: rgba(34, 211, 238, 0.15);

  --menu-drag-border: #22D3EE;
  --menu-progress: #22D3EE;
}

/* ===============================
   📦 容器
=============================== */

.menu-scroll-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.menu-outer {
  overflow-x: auto;
  scrollbar-width: none;
}

.menu-outer::-webkit-scrollbar {
  display: none;
}

.menu-list {
  display: flex;
  gap: 16px;
  padding: 0 20px 10px;
  min-width: min-content;
}

/* ===============================
   🧩 菜单项
=============================== */

.menu-item-wrapper {
  flex-shrink: 0;
}

.menu-item {
  position: relative;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;

  color: var(--menu-text);
  transition: all 0.25s ease;
}

.menu-item:hover {
  color: var(--menu-text-hover);
  background: var(--menu-bg-hover);
}

.menu-item.is-pressing {
  background: var(--menu-bg-press);
  transform: scale(1.05);
}

.menu-item.active {
  color: var(--menu-text-active);
  font-weight: 900;
}

.menu-item.active::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 0;
  height: 4px;
  border-radius: 4px;
  background: currentColor;
  box-shadow: 0 2px 8px currentColor;
}

/* ===============================
   🟦 拖拽
=============================== */

.dragging-menu .menu-item {
  transform: rotate(3deg) scale(1.1);
  border: 2px solid var(--menu-drag-border);
  box-shadow: 0 15px 35px rgba(0,0,0,0.3);
}

.ghost-menu .menu-item {
  opacity: 0.5;
  border: 2px dashed var(--menu-drag-border);
}

/* ===============================
   ⏱ 长按进度
=============================== */

.press-indicator {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle {
  stroke: var(--menu-progress);
  stroke-dasharray: 63;
  stroke-dashoffset: 63;
  transition: stroke-dashoffset 0.01s linear;
}

/* ===============================
   ❌ 删除
=============================== */

.menu-del {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff4d4f;
  color: #fff;
  border: none;
  font-size: 12px;
  opacity: 0;
  transition: 0.2s;
}

.menu-item:hover .menu-del {
  opacity: 1;
}

/* ===============================
   ➕ 添加
=============================== */

.add-menu-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 2px dashed rgba(128,128,128,0.4);
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.6;
}

.add-menu-btn:hover {
  opacity: 1;
}

/* ===============================
   📂 二级菜单
=============================== */

.sub-menu-outer {
  overflow-x: auto;
  scrollbar-width: none;
}

.sub-menu-outer::-webkit-scrollbar {
  display: none;
}

.sub-menu-bar {
  display: flex;
  gap: 10px;
  padding: 6px 20px 14px;
}

.sub-menu-item {
  padding: 6px 16px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  background: rgba(128,128,128,0.1);
  color: var(--menu-text);
}

.sub-menu-item.active {
  color: var(--menu-text-active);
  background: var(--menu-bg-press);
}
</style>



