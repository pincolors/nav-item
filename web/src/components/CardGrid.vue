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
            <!-- 拖拽提示 -->
            <div v-if="isEditMode" class="drag-handle">
              ⋮⋮
            </div>

            <!-- 操作按钮 -->
            <div v-if="isEditMode" class="action-buttons">
              <button class="icon-btn edit-btn" @click.stop="$emit('edit', element)">
                ⚙️
              </button>
              <button class="icon-btn del-btn" @click.stop="$emit('delete', element.id)">
                🗑️
              </button>
            </div>

            <!-- 图标 -->
            <div class="card-icon-wrapper">
              <div v-if="isLoading(element.id)" class="skeleton-icon"></div>

              <img
                v-show="shouldShowImage(element.id)"
                :src="getIconSrc(element)"
                class="real-icon"
                :class="{ visible: isLoaded(element.id) }"
                @load="onImgLoad(element.id)"
                @error="onImgError(element.id)"
              />

              <div v-if="isFallback(element.id)" class="fallback-icon">
                {{ element.title?.charAt(0)?.toUpperCase() || '?' }}
              </div>
            </div>

            <!-- 文本 -->
            <div class="card-info">
              <div class="card-title">{{ element.title }}</div>
            </div>
          </component>
        </div>
      </template>

      <!-- 添加卡片 -->
      <template #footer>
        <div v-if="isEditMode" class="card-wrapper">
          <div class="card-item add-card" @click="$emit('add')">
            <div class="add-icon">+</div>
            <div class="card-title">添加站点</div>
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
  (val) => (localCards.value = [...val])
)

function onDragEnd() {
  emit('update:cards', localCards.value)
}

function handleClick(e) {
  if (props.isEditMode) e.preventDefault()
}

/* ---------- 图标加载逻辑 ---------- */

const getState = (id) =>
  iconState[id] ||
  (iconState[id] = { step: 0, loaded: false })

const getDomain = (url) => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

const getIconSrc = (card) => {
  const state = getState(card.id)
  const domain = getDomain(card.url)

  if (state.step === 0 && card.logo_url) return card.logo_url
  if (state.step <= 1) return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  if (state.step === 2) return `https://icons.duckduckgo.com/ip3/${domain}.ico`
  return ''
}

const onImgLoad = (id) => {
  getState(id).loaded = true
}

const onImgError = (id) => {
  const state = getState(id)
  state.loaded = false
  state.step++
}

const isLoading = (id) => {
  const s = getState(id)
  return !s.loaded && s.step < 3
}

const shouldShowImage = (id) => getState(id).step < 3
const isLoaded = (id) => getState(id).loaded
const isFallback = (id) => getState(id).step >= 3
</script>

<style scoped>
.grid-container {
  width: 100%;
}

.card-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  padding: 20px;
}

.card-wrapper {
  aspect-ratio: 1.25 / 1;
}

.card-item {
  height: 100%;
  border-radius: 20px;
  background: var(--card-bg, #1e1e1e);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  position: relative;
}

.drag-handle {
  position: absolute;
  top: 8px;
  left: 10px;
  opacity: 0.4;
}

.action-buttons {
  position: absolute;
  top: 8px;
  right: 10px;
  display: flex;
  gap: 6px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
}

.card-icon-wrapper {
  width: 64px;
  height: 64px;
}

.real-icon {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: 0.3s;
}
.real-icon.visible {
  opacity: 1;
}

.fallback-icon {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  background: rgba(0, 255, 157, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.card-title {
  margin-top: 10px;
  font-size: 14px;
}

.add-card {
  border: 2px dashed rgba(255,255,255,0.3);
}

.add-icon {
  font-size: 32px;
}

.ghost {
  opacity: 0.4;
}
</style>
