<template>
  <Teleport to="body">
    <div v-if="visible" 
         class="glass-overlay"
         :class="{ 'dark-mode': isDarkMode }"
         @click.self="handleCancel">
      <div class="glass-dialog confirm-dialog" @click.stop>

        <!-- 图标（可选）-->
        <div v-if="icon" class="confirm-icon" :class="iconClass">
          {{ icon }}
        </div>

        <!-- 标题 -->
        <h3>{{ title }}</h3>

        <!-- 描述文字（可选）-->
        <p v-if="description" class="confirm-desc">{{ description }}</p>

        <div class="glass-actions">
          <button class="glass-btn-cancel" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button class="glass-btn-primary confirm-btn" :class="confirmClass" @click="handleConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  visible:     { type: Boolean, default: false },
  isDarkMode:  { type: Boolean, default: false },
  title:       { type: String,  default: '确认操作？' },
  description: { type: String,  default: '' },
  icon:        { type: String,  default: '' },
  // icon 背景色类型：default / danger / warning / success
  iconType:    { type: String,  default: 'default' },
  cancelText:  { type: String,  default: '取消' },
  confirmText: { type: String,  default: '确认' },
  // 确认按钮类型：default / danger
  confirmType: { type: String,  default: 'default' },
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

const iconClass = computed(() => ({
  'icon-danger':  props.iconType === 'danger',
  'icon-warning': props.iconType === 'warning',
  'icon-success': props.iconType === 'success',
}));

const confirmClass = computed(() => ({
  'btn-danger': props.confirmType === 'danger',
}));

function handleConfirm() {
  emit('confirm');
  emit('update:visible', false);
}

function handleCancel() {
  emit('cancel');
  emit('update:visible', false);
}
</script>

<script>
import { computed } from 'vue';
</script>

<style scoped>
/* Teleport 脱离 dark-mode，手动声明暗色变量 */
.glass-overlay.dark-mode {
  --glass-text-color:           #ffffff;
  --glass-label-color:          rgba(255, 255, 255, 0.50);
  --glass-dialog-bg:            rgba(30, 32, 40, 0.55);
  --glass-dialog-border:        rgba(255, 255, 255, 0.12);
  --glass-dialog-shadow:        0 20px 60px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08);
  --glass-dialog-blur:          blur(28px) saturate(180%);
  --glass-overlay-bg:           rgba(0, 0, 0, 0.30);
  --glass-input-bg:             rgba(255, 255, 255, 0.08);
  --glass-input-border:         rgba(255, 255, 255, 0.14);
  --glass-input-color:          #ffffff;
  --glass-icon-btn-bg:          rgba(255, 255, 255, 0.10);
  --glass-primary:              #00c87a;
  --glass-primary-hover:        #00e68a;
  --glass-primary-shadow:       rgba(0, 200, 122, 0.35);
  --glass-primary-shadow-hover: rgba(0, 200, 122, 0.50);
}

.confirm-dialog {
  max-width: 320px;
  text-align: center;
  background: rgba(255, 255, 255, 0.30) !important;
  padding: 32px 28px 28px;
}

.dark-mode .confirm-dialog {
  background: rgba(30, 32, 40, 0.55) !important;
}

/* 图标 */
.confirm-icon {
  width: 60px; height: 60px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; margin: 0 auto 20px auto;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.confirm-icon.icon-danger {
  background: rgba(255, 77, 79, 0.15);
  border-color: rgba(255, 77, 79, 0.3);
}

.confirm-icon.icon-warning {
  background: rgba(255, 165, 0, 0.15);
  border-color: rgba(255, 165, 0, 0.3);
}

.confirm-icon.icon-success {
  background: rgba(0, 200, 122, 0.15);
  border-color: rgba(0, 200, 122, 0.3);
}

/* 标题 */
h3 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--glass-text-color);
}

/* 描述 */
.confirm-desc {
  margin: 0 0 24px 0;
  font-size: 13px;
  color: var(--glass-label-color);
  line-height: 1.5;
}

/* 危险确认按钮 */
.confirm-btn.btn-danger {
  background: #ff4d4f !important;
  box-shadow: 0 4px 20px rgba(255, 77, 79, 0.3) !important;
}
.confirm-btn.btn-danger:hover {
  background: #ff7875 !important;
  box-shadow: 0 6px 24px rgba(255, 77, 79, 0.45) !important;
}
</style>
