<template>
  <svg
    v-if="name === 'user-cog'"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M10 15H6a4 4 0 0 0-4 4v2" />
    <path d="m14.305 16.53.923-.382" />
    <path d="m15.228 13.852-.923-.383" />
    <path d="m16.852 12.228-.383-.923" />
    <path d="m16.852 17.772-.383.924" />
    <path d="m19.148 12.228.383-.923" />
    <path d="m19.53 18.696-.382-.924" />
    <path d="m20.772 13.852.924-.383" />
    <path d="m20.772 16.148.924.383" />
    <circle cx="18" cy="15" r="3" />
    <circle cx="9" cy="7" r="4" />
  </svg>

  <svg
    v-else-if="name === 'sun'"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="lucide lucide-sun"
  >
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2"></path>
    <path d="M12 20v2"></path>
    <path d="m4.93 4.93 1.41 1.41"></path>
    <path d="m17.66 17.66 1.41 1.41"></path>
    <path d="M2 12h2"></path>
    <path d="M20 12h2"></path>
    <path d="m6.34 17.66-1.41 1.41"></path>
    <path d="m19.07 4.93-1.41 1.41"></path>
  </svg>

  <svg
    v-else-if="name === 'moon'"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
</template>

<script setup>
// 定义 props，接收父组件传来的图标名称
defineProps({
  name: {
    type: String,
    required: true,
    // 添加验证：确保传入的名字只能是这三个，防止手误拼错
    validator: (value) => ['user-cog', 'sun', 'moon'].includes(value)
  }
});
</script>

<style scoped>
/* 基础样式：让图标与文字垂直居中，并添加平滑的颜色/大小过渡动画 */
svg {
  vertical-align: -0.125em; /* 稍微下沉一点，和文字对齐得更好 */
  transition: color 0.3s ease, transform 0.3s ease;
}
</style>
