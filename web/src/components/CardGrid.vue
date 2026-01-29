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
/* ✨✨✨ 核心修改：确保手机端行间距正常 ✨✨✨ */

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

/* ✨✨✨ 增强立体感：白色模式下的卡片样式 ✨✨✨ */
.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  
  min-height: 140px;
  width: 100%;
  padding: 20px;
  
  /* 🎨 白色模式立体感：多层阴影 + 边框光泽 */
  background: rgba(255, 255, 255, 0.95); /* 更接近纯白 */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  border-radius: 16px;
  
  /* 📦 多层边框：外层浅灰 + 内层高光 */
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 
    /* 主阴影：柔和的底部投影 */
    0 2px 8px rgba(0, 0, 0, 0.04),
    /* 次阴影：更深的边缘阴影 */
    0 4px 16px rgba(0, 0, 0, 0.06),
    /* 内阴影：顶部高光效果 */
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  
  color: inherit;
  text-decoration: none;
  position: relative;
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  box-sizing: border-box;
  touch-action: pan-y;
  
  /* 🌟 添加微妙的渐变背景增强层次 */
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(250, 250, 252, 1) 100%
  );
}

/* 🎯 悬停效果：更强的立体感 */
.card-item:not(.is-dragging):hover {
  transform: translateY(-8px) scale(1.03); /* 更明显的抬升 */
  
  /* 悬停时加强阴影 */
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 16px 48px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  
  border-color: rgba(0, 255, 157, 0.3); /* 加入品牌色边框 */
  
  /* 悬停时背景稍微变亮 */
  background: rgba(255, 255, 255, 1);
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(248, 250, 252, 1) 100%
  );
}

/* 🌙 暗色模式适配：保持原有玻璃拟态效果 */
@media (prefers-color-scheme: dark) {
  .card-item {
    background: rgba(255, 255, 255, 0.06);
    background-image: none;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 
      0 4px 6px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .card-item:not(.is-dragging):hover {
    background: rgba(255, 255, 255, 0.1);
    background-image: none;
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 
      0 12px 24px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
}

/* 拖拽中样式 */
.card-item.is-dragging {
  cursor: grabbing;
  opacity: 0.9;
  box-shadow: 
    0 12px 28px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 幽灵样式 */
.ghost .card-item {
  opacity: 0.5;
  background: rgba(0, 255, 157, 0.08);
  border: 2px dashed #00ff9d;
  box-shadow: 0 4px 12px rgba(0, 255, 157, 0.2);
}

/* === 内容区域：增强图标容器立体感 === */

.card-icon-wrapper {
  width: 72px; 
  height: 72px; 
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  
  /* 🎨 图标容器也加立体效果 */
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 1) 0%,
    rgba(241, 245, 249, 1) 100%
  );
  
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  /* 微妙的内阴影 */
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.04),
    inset 0 1px 2px rgba(0, 0, 0, 0.05);
  
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
}

/* 悬停时图标容器也有反馈 */
.card-item:hover .card-icon-wrapper {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(248, 250, 252, 1) 100%
  );
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 2px rgba(0, 0, 0, 0.03);
}

/* 暗色模式图标容器 */
@media (prefers-color-scheme: dark) {
  .card-icon-wrapper {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.2),
      inset 0 1px 2px rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .card-item:hover .card-icon-wrapper {
    background: rgba(255, 255, 255, 0.12);
  }
}

.real-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s;
}

/* 悬停时图标微微放大 */
.card-item:hover .real-icon {
  transform: scale(1.1);
}

.fallback-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: bold;
  color: #00ff9d;
  text-shadow: 0 2px 4px rgba(0, 255, 157, 0.3);
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
  
  /* 白色模式下文字稍微深一点 */
  color: rgba(0, 0, 0, 0.9);
}

.card-desc {
  font-size: 12px;
  opacity: 0.6;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(0, 0, 0, 0.6);
}

@media (prefers-color-scheme: dark) {
  .card-title {
    color: rgba(255, 255, 255, 0.95);
  }
  .card-desc {
    color: rgba(255, 255, 255, 0.6);
  }
}

/* === 编辑模式控件 === */
.drag-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  opacity: 0.4;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  padding: 4px;
  display: flex;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  .drag-indicator {
    background: rgba(255, 255, 255, 0.1);
    opacity: 0.5;
  }
}

.action-buttons {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  z-index: 10;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.icon-btn:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

@media (prefers-color-scheme: dark) {
  .icon-btn {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);
  }
}

.edit-btn:hover { 
  background: rgba(0, 255, 157, 0.15); 
  color: #00ff9d;
  border-color: rgba(0, 255, 157, 0.3);
}

.del-btn:hover { 
  background: rgba(255, 68, 68, 0.15); 
  color: #ff4444;
  border-color: rgba(255, 68, 68, 0.3);
}

.add-card {
  border: 2px dashed rgba(0, 0, 0, 0.15);
  background: transparent;
  box-shadow: none;
}

.add-card:hover {
  border-color: #00ff9d;
  background: rgba(0, 255, 157, 0.05);
  box-shadow: 
    0 4px 12px rgba(0, 255, 157, 0.1),
    inset 0 1px 0 rgba(0, 255, 157, 0.1);
}

@media (prefers-color-scheme: dark) {
  .add-card {
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.add-icon {
  font-size: 32px;
  color: #00ff9d;
  margin-bottom: 0;
  text-shadow: 0 2px 8px rgba(0, 255, 157, 0.3);
}
</style>



