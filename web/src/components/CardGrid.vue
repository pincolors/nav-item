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
/* ...保留其他的 .card-item, .icon-btn 等样式... */

/* 👇 给卡片外壳加一个强制的底部边距，这是双重保险 */
.card-wrapper {
  height: 100%;
  perspective: 1000px;
  margin-bottom: 24px !important; /* 🔥 强制推开下方的卡片 */
}

/* ...其他样式保持不变... */
</style>

<style>
.card-grid {
  display: grid !important; /* 强制启用 Grid */
  width: 100%;
  
  /* 这里的 gap 是核心，分开上下左右 */
  grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
  column-gap: 20px;
  row-gap: 24px !important; /* 强制拉开行间距 */
  
  padding-bottom: 80px;
  min-height: 100%;
  overflow: visible;
}

/* 桌面端适配 */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}
</style>



