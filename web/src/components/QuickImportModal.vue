<template>
  <div v-if="visible" class="glass-overlay" @click="close">
    <div class="glass-dialog" @click.stop>
      <h3>⚡ 快速批量导入</h3>

      <div class="glass-form-group">
        <label>导入到哪个菜单？</label>
        <select v-model="targetMenuId" class="glass-input glass-select">
          <option v-for="menu in menus" :key="menu.id" :value="menu.id">
            {{ menu.name }}
          </option>
        </select>
      </div>

      <div class="glass-form-group">
        <label>
          输入站点列表 <span class="glass-tip inline-tip">(格式：名称 链接，一行一个)</span>
        </label>
        <textarea
          v-model="rawText"
          class="glass-input glass-textarea"
          placeholder="例如：&#10;Google https://google.com&#10;百度, https://baidu.com&#10;GitHub | https://github.com"
          rows="8"
          v-focus
        ></textarea>
      </div>

      <div class="preview-info" v-if="parsedCount > 0">
        识别到 <strong>{{ parsedCount }}</strong> 个有效站点
      </div>

      <div class="glass-actions">
        <button class="glass-btn-cancel" @click="close" :disabled="isImporting">取消</button>
        <button class="glass-btn-primary" @click="handleImport" :disabled="isImporting || parsedCount === 0">
          {{ isImporting ? '正在导入...' : '开始导入' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  visible: Boolean,
  menus: Array,
  currentMenuId: [Number, String]
});

const emit = defineEmits(['update:visible', 'import']);

const targetMenuId = ref(props.currentMenuId);
const rawText = ref('');
const isImporting = ref(false);

watch(() => props.currentMenuId, (val) => { if (val) targetMenuId.value = val; });
watch(() => props.visible, (val) => {
  if (val) { rawText.value = ''; isImporting.value = false; }
});

const vFocus = { mounted: (el) => el.focus() };

const parsedSites = computed(() => {
  if (!rawText.value.trim()) return [];
  return rawText.value.split('\n')
    .map(line => line.trim()).filter(line => line)
    .map(line => {
      const match = line.match(/^([^,，|\s]+)[,，|\s]+(https?:\/\/\S+)$/i);
      if (match) return { title: match[1], url: match[2] };
      const parts = line.split(/\s+/);
      if (parts.length >= 2 && parts[parts.length - 1].startsWith('http')) {
        const url = parts.pop();
        return { title: parts.join(' '), url };
      }
      return null;
    })
    .filter(Boolean);
});

const parsedCount = computed(() => parsedSites.value.length);

const close = () => { if (!isImporting.value) emit('update:visible', false); };

const handleImport = async () => {
  if (parsedCount.value === 0) return;
  isImporting.value = true;
  emit('import', {
    menuId: targetMenuId.value,
    sites: parsedSites.value,
    done: () => { isImporting.value = false; close(); }
  });
};
</script>

<style scoped>
h3 {
  margin: 0 0 24px 0;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--glass-primary);
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  font-size: 14px;
  color: var(--glass-label-color);
}

.inline-tip {
  font-weight: normal;
  font-size: 12px;
  display: inline;
  margin-top: 0;
}

.preview-info {
  text-align: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--glass-primary);
}

.glass-btn-primary:disabled,
.glass-btn-cancel:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
</style>
