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
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
              </svg>
            </div>

            <div v-if="isEditMode" class="action-buttons">
              <button class="icon-btn edit-btn" @click.stop="$emit('edit', element)" title="编辑">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button class="icon-btn del-btn" @click.stop="$emit('delete', element.id)" title="删除">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>

            <div class="card-icon-wrapper">
              <!-- 🎨 骨架屏加载动画 -->
              <div v-if="loadingIcons[element.id]" class="icon-skeleton"></div>
              
              <!-- 🖼️ 真实图标 -->
              <img 
                v-else-if="!iconError[element.id]"
                :src="getCurrentIconUrl(element)" 
                class="real-icon"
                @load="onImgLoad(element)"
                @error="onImgError(element)"
                loading="lazy"
                decoding="async"
                :alt="element.title || element.name"
              />
              
              <!-- 🔤 后备字母图标 -->
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
import { ref, watch, reactive, onMounted } from 'vue';
import draggable from 'vuedraggable';

const props = defineProps({ 
  cards: Array, 
  isEditMode: Boolean 
});

const emit = defineEmits(['update:cards', 'edit', 'delete', 'add']);

const localCards = ref([...props.cards || []]);
const iconError = reactive({});
const loadingIcons = reactive({});
const failedAttempts = reactive({}); // 记录每个站点失败的次数

// 🆕 本地存储缓存键
const CACHE_KEY = 'nav-icon-cache-v1';
const CACHE_EXPIRE_DAYS = 7; // 缓存7天

// 🆕 API 列表（按速度优先级排序）
const API_LIST = [
  { name: 'duckduckgo', template: (domain) => `https://icons.duckduckgo.com/ip3/${domain}.ico` },
  { name: 'google', template: (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128` },
  { name: 'faviconkit', template: (domain) => `https://api.faviconkit.com/${domain}/128` },
  { name: 'google-v2', template: (url) => `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=128` },
  { name: 'direct', template: (domain) => `https://${domain}/favicon.ico` }
];

// 🆕 从 localStorage 加载缓存
function loadIconCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return {};
    
    const data = JSON.parse(cached);
    const now = Date.now();
    const expireTime = CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
    
    // 清理过期缓存
    const validCache = {};
    for (const [domain, item] of Object.entries(data)) {
      if (now - item.timestamp < expireTime) {
        validCache[domain] = item;
      }
    }
    
    return validCache;
  } catch (e) {
    console.warn('加载图标缓存失败:', e);
    return {};
  }
}

// 🆕 保存缓存到 localStorage
function saveIconCache(domain, apiIndex, url) {
  try {
    const cache = loadIconCache();
    cache[domain] = {
      apiIndex,  // 记录成功的 API 索引
      url,       // 记录成功的 URL
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('保存图标缓存失败:', e);
  }
}

// 🆕 获取域名
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.warn('无效的 URL:', url);
    return null;
  }
}

// 🆕 获取当前应该使用的图标 URL
function getCurrentIconUrl(site) {
  // 1. 优先使用自定义图标
  if (site.icon && site.icon.startsWith('http')) {
    return site.icon;
  }
  if (site.logo_url) {
    return site.logo_url;
  }
  
  const domain = getDomain(site.url);
  if (!domain) return '';
  
  // 2. 检查缓存
  const cache = loadIconCache();
  if (cache[domain]) {
    return cache[domain].url;
  }
  
  // 3. 根据失败次数选择 API
  const attemptIndex = failedAttempts[site.id] || 0;
  const apiIndex = Math.min(attemptIndex, API_LIST.length - 1);
  const api = API_LIST[apiIndex];
  
  // 4. 生成 URL（某些 API 需要完整 URL，某些只需要 domain）
  if (api.name === 'google-v2') {
    return api.template(site.url);
  } else {
    return api.template(domain);
  }
}

// 🆕 图标加载成功
function onImgLoad(site) {
  const siteId = site.id;
  loadingIcons[siteId] = false;
  
  // 保存成功的 API 到缓存
  const domain = getDomain(site.url);
  if (domain) {
    const attemptIndex = failedAttempts[siteId] || 0;
    const url = getCurrentIconUrl(site);
    saveIconCache(domain, attemptIndex, url);
    console.log(`✅ 图标加载成功: ${site.title || site.name} (API: ${API_LIST[attemptIndex].name})`);
  }
}

// 🆕 图标加载失败（自动降级）
function onImgError(site) {
  const siteId = site.id;
  const currentAttempt = failedAttempts[siteId] || 0;
  
  // 如果还有备用 API，尝试下一个
  if (currentAttempt < API_LIST.length - 1) {
    console.warn(`⚠️ API ${API_LIST[currentAttempt].name} 失败，尝试下一个...`);
    failedAttempts[siteId] = currentAttempt + 1;
    
    // 延迟一点，避免同时发送太多请求
    setTimeout(() => {
      // 触发重新渲染（Vue 会自动调用 getCurrentIconUrl）
      loadingIcons[siteId] = true;
      
      // 模拟重新加载
      setTimeout(() => {
        loadingIcons[siteId] = false;
      }, 50);
    }, 100 * (currentAttempt + 1));
    
  } else {
    // 所有 API 都失败了，显示字母图标
    console.error(`❌ 所有 API 都失败: ${site.title || site.name}`);
    loadingIcons[siteId] = false;
    iconError[siteId] = true;
  }
}

// 🆕 初始化加载状态
function initializeLoadingStates() {
  if (!props.cards) return;
  props.cards.forEach(card => {
    loadingIcons[card.id] = true;
    failedAttempts[card.id] = 0;
  });
}

// 🆕 预加载图标（可选，用于提前缓存）
function preloadIcons(cards) {
  if (!cards) return;
  
  cards.forEach(card => {
    // 确保加载状态已初始化
    if (loadingIcons[card.id] === undefined) {
      loadingIcons[card.id] = true;
    }
  });
}

function onDragEnd() { 
  emit('update:cards', localCards.value); 
}

function handleClick(e) { 
  if (props.isEditMode) e.preventDefault(); 
}

watch(() => props.cards, (newVal) => { 
  localCards.value = [...newVal || []];
  preloadIcons(newVal);
}, { deep: true });

onMounted(() => {
  initializeLoadingStates();
  preloadIcons(props.cards);
});
</script>

<style scoped>
/* ... 之前的所有样式保持不变 ... */
/* 这里只粘贴骨架屏相关的样式，其他的和之前一样 */

.icon-skeleton {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  background: linear-gradient(
    90deg,
    rgba(200, 200, 200, 0.2) 25%,
    rgba(200, 200, 200, 0.3) 50%,
    rgba(200, 200, 200, 0.2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite ease-in-out;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@media (prefers-color-scheme: dark) {
  .icon-skeleton {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 25%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 75%
    );
  }
}

/* 其他样式保持和之前完全一样 */
.card-grid { /* ... */ }
.card-wrapper { /* ... */ }
.card-item { /* ... */ }
/* ... 等等 ... */
</style>
