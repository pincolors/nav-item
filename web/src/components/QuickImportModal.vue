<template>
  <div v-if="visible" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <h3>⚡ 快速批量导入</h3>
      
      <div class="form-group">
        <label>导入到哪个菜单？</label>
        <select v-model="targetMenuId" class="neumorphic-input">
          <option v-for="menu in menus" :key="menu.id" :value="menu.id">
            {{ menu.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>
          输入站点列表 <span class="tip">(格式：名称 链接，一行一个)</span>
        </label>
        <textarea 
          v-model="rawText" 
          class="neumorphic-input textarea" 
          placeholder="例如：&#10;Google https://google.com&#10;百度, https://baidu.com&#10;GitHub | https://github.com"
          rows="8"
          v-focus
        ></textarea>
      </div>

      <div class="preview-info" v-if="parsedCount > 0">
        识别到 <strong>{{ parsedCount }}</strong> 个有效站点
      </div>

      <div class="modal-actions">
        <button class="neumorphic-btn cancel" @click="close" :disabled="isImporting">取消</button>
        <button class="neumorphic-btn save" @click="handleImport" :disabled="isImporting || parsedCount === 0">
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

// 自动同步当前选中的菜单
watch(() => props.currentMenuId, (val) => {
  if (val) targetMenuId.value = val;
});

// 重置状态
watch(() => props.visible, (val) => {
  if (val) {
    rawText.value = '';
    isImporting.value = false;
  }
});

// 自定义指令
const vFocus = {
  mounted: (el) => el.focus()
};

// 智能解析逻辑
const parsedSites = computed(() => {
  if (!rawText.value.trim()) return [];
  
  return rawText.value.split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => {
      // 尝试匹配常见分隔符：逗号、竖线、空格、制表符
      // 匹配逻辑：(名称)(分隔符)(URL)
      const match = line.match(/^([^,，|\s]+)[,，|\s]+(https?:\/\/\S+)$/i);
      if (match) {
        return { title: match[1], url: match[2] };
      }
      // 如果没有匹配到，尝试简单按空格分割（容错）
      const parts = line.split(/\s+/);
      if (parts.length >= 2 && parts[parts.length-1].startsWith('http')) {
        const url = parts.pop();
        const title = parts.join(' ');
        return { title, url };
      }
      return null;
    })
    .filter(site => site !== null);
});

const parsedCount = computed(() => parsedSites.value.length);

const close = () => {
  if (!isImporting.value) {
    emit('update:visible', false);
  }
};

const handleImport = async () => {
  if (parsedCount.value === 0) return;
  isImporting.value = true;
  
  // 将解析好的数据传回父组件处理
  emit('import', {
    menuId: targetMenuId.value,
    sites: parsedSites.value,
    done: () => {
      isImporting.value = false;
      close();
    }
  });
};
</script>

<style scoped>
/* 复用之前的拟态风格 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(8px);
  z-index: 3000; display: flex; align-items: center; justify-content: center;
}
.modal-content {
  background: var(--bg-color, #e0e5ec); color: var(--text-color, #4a5568);
  padding: 32px; border-radius: 24px; width: 90%; max-width: 450px;
  box-shadow: 15px 15px 30px rgba(163, 177, 198, 0.6), -15px -15px 30px rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.4);
}
:global(.dark-mode) .modal-content {
  box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);
}
h3 { margin: 0 0 24px; text-align: center; color: var(--primary-color, #00ff9d); }
.form-group { margin-bottom: 20px; }
label { display: block; margin-bottom: 8px; font-weight: 700; font-size: 14px; margin-left: 4px; }
.tip { font-weight: normal; opacity: 0.6; font-size: 12px; }

.neumorphic-input {
  width: 100%; padding: 12px 16px; background: var(--bg-color, #e0e5ec);
  border-radius: 12px; border: none; outline: none; color: inherit; box-sizing: border-box;
  box-shadow: inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255,255,255,0.5);
}
:global(.dark-mode) .neumorphic-input {
  background: rgba(0,0,0,0.2); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}
.textarea { resize: vertical; min-height: 120px; font-family: monospace; line-height: 1.5; }

.preview-info {
  text-align: center; margin-bottom: 20px; font-size: 14px; color: var(--primary-color);
}

.modal-actions { display: flex; gap: 16px; margin-top: 10px; }
.neumorphic-btn {
  flex: 1; padding: 12px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}
.save {
  background: var(--primary-color, #00ff9d); color: #fff;
  box-shadow: 4px 4px 10px rgba(0, 255, 157, 0.4);
}
.save:disabled { opacity: 0.5; cursor: not-allowed; }
.cancel { background: transparent; color: inherit; opacity: 0.7; }
.cancel:hover { background: rgba(0,0,0,0.05); }
</style>
