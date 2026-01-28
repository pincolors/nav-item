<template>
  <div class="grid-container">
    <draggable
      :list="localCards"
      item-key="id"
      class="card-grid"
      :disabled="!isEditMode"
      ghost-class="ghost"
      @end="onDragEnd"
      :force-fallback="true"
    >
      <template #item="{ element }">
        <div class="card-wrapper">
          <component
            :is="isEditMode ? 'div' : 'a'"
            class="card-item"
            :href="!isEditMode ? element.url : undefined"
            :target="!isEditMode ? '_blank' : undefined"
            @click="onClick"
          >
            <!-- 编辑态操作 -->
            <div v-if="isEditMode" class="action-buttons">
              <button class="icon-btn edit" @click.stop="$emit('edit', element)">⚙</button>
              <button class="icon-btn delete" @click.stop="$emit('delete', element.id)">✕</button>
            </div>

            <!-- 图标 -->
            <div class="icon-wrapper">
              <div v-if="isLoading(element.id)" class="skeleton"></div>

              <img
                v-show="shouldShowImage(element.id)"
                :src="getIconSrc(element)"
                class="icon"
                :class="{ loaded: isLoaded(element.id) }"
                @load="onImgLoad(element.id)"
                @error="onImgError(element.id)"
              />

              <div v-if="isFallback(element.id)" class="fallback">
                {{ element.title?.charAt(0)?.toUpperCase() || '?' }}
              </div>
            </div>

            <!-- 标题 -->
            <div class="title">{{ element.title }}</div>
          </component>
        </div>
      </template>

      <!-- 添加卡片 -->
      <template #footer>
        <div v-if="isEditMode" class="card-wrapper">
          <div class="card-item add-card" @click="$emit('add')">
            <div class="add-icon">+</div>
            <div class="title muted">添加站点</div>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, watch, reactive } from 'vue'
import draggable from 'vuedraggable'

const props = defineProps({
  cards: { type: Array, required: true },
  isEditMode: { type: Boolean, default: false }
})

const emit = defineEmits(['update:cards', 'edit', 'delete', 'add'])

const localCards = ref([...props.cards])
const iconState = reactive({})

watch(
  () => props.cards,
  (v) => (localCards.value = [...v])
)

function onDragEnd() {
  emit('update:cards', localCards.value)
}

function onClick(e) {
  if (props.isEditMode) e.preventDefault()
}

/* ---------- 图标加载 ---------- */

const state = (id) =>
  iconState[id] || (iconState[id] = { step: 0, loaded: false })

const domain = (url) => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

const getIconSrc = (card) => {
  const s = state(card.id)
  const d = domain(card.url)

  if (s.step === 0 && card.logo_url) return card.logo_url
  if (s.step <= 1) return `https://www.google.com/s2/favicons?domain=${d}&sz=128`
  if (s.step === 2) return `https://icons.duckduckgo.com/ip3/${d}.ico`
  return ''
}

const onImgLoad = (id) => (state(id).loaded = true)
const onImgError = (id) => {
  const s = state(id)
  s.loaded = false
  s.step++
}

const isLoading = (id) => !state(id).loaded && state(id).step < 3
const shouldShowImage = (id) => state(id).step < 3
const isLoaded = (id) => state(id).loaded
const isFallback = (id) => state(id).step >= 3
</script>

<style scoped>
/* ================== 布局层 ================== */

.grid-container,
.card-grid {
  overflow: visible !important;
}

.card-grid {
  display: grid;
  gap: 28px;
  padding: 28px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

/* ================== 立体壳（关键） ================== */

.card-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1.25 / 1;

  perspective: 1200px;
  transform-style: preserve-3d;
  isolation: isolate; /* 🔒 防父级污染 */
}

/* ================== 卡片本体 ================== */

.card-item {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 24px;
  background: var(--card-bg, #1f2530);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: inherit;

  transform-style: preserve-3d;
  transition:
    transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.35s ease;
}

/* 底部浮空阴影（灵魂） */
.card-item::after {
  content: "";
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: -14px;
  height: 22px;

  background: radial-gradient(
    ellipse at center,
    rgba(0,0,0,0.25) 0%,
    rgba(0,0,0,0.12) 40%,
    transparent 70%
  );

  filter: blur(8px);
  opacity: 0.7;
  transform: translateZ(-1px);
  z-index: -1;

  transition: all 0.35s ease;
}

/* hover 浮起 */
@media (hover: hover) {
  .card-item:hover {
    transform: translateY(-10px) rotateX(2deg) scale(1.01);
  }

  .card-item:hover::after {
    transform: translateY(6px) scale(1.08);
    opacity: 0.95;
  }
}

/* ================== 内容 ================== */

.icon-wrapper {
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
  position: relative;
}

.icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transform: scale(0.85);
  transition: 0.35s;
}

.icon.loaded {
  opacity: 1;
  transform: scale(1);
}

.skeleton {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.08) 25%,
    rgba(255,255,255,0.18) 37%,
    rgba(255,255,255,0.08) 63%
  );
  background-size: 400% 100%;
  animation: skeleton 1.4s infinite;
}

@keyframes skeleton {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

.fallback {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  background: rgba(0,255,157,0.14);
  color: var(--primary-color, #00ff9d);
  font-size: 32px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
}

.muted {
  opacity: 0.6;
}

/* ================== 编辑态 ================== */

.action-buttons {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
  z-index: 10;
}

.icon-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: rgba(0,0,0,0.35);
  color: #fff;
}

.icon-btn.delete:hover {
  background: rgba(255,77,79,0.9);
}

/* ================== 添加卡 ================== */

.add-card {
  border: 2px dashed rgba(255,255,255,0.25);
  background: transparent;
  box-shadow: none;
}

.add-icon {
  font-size: 36px;
  color: var(--primary-color, #00ff9d);
}

.ghost {
  opacity: 0.4;
}
</style>
