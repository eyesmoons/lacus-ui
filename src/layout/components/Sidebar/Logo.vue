<template>
    <div class="sidebar-logo-container" :class="{ 'collapse': collapse }"
         :style="{ backgroundColor: sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground }">
        <transition name="sidebarLogoFade">
            <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
                <img v-if="logo" :src="logo" class="sidebar-logo"/>
                <h1 v-else class="sidebar-title"
                    :style="{ color: sideTheme === 'theme-dark' ? variables.logoTitleColor : variables.logoLightTitleColor }">
                    {{ title }}</h1>
            </router-link>
            <router-link v-else key="expand" class="sidebar-logo-link" to="/">
                <img v-if="logo" :src="logo" class="sidebar-logo"/>
                <h1 class="sidebar-title"
                    :style="{ color: sideTheme === 'theme-dark' ? variables.logoTitleColor : variables.logoLightTitleColor }">
                    {{ title }}</h1>
            </router-link>
        </transition>
    </div>
</template>

<script setup>
import variables from '@/assets/styles/variables.module.scss';
import logo from '@/assets/logo/logo.png';

defineProps({
    collapse: {
        type: Boolean,
        required: true,
    },
});

const title = ref('Lacus大数据平台');
const store = useStore();
const sideTheme = computed(() => store.state.settings.sideTheme);
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2c4a6f 100%);
  text-align: center;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;

    & .sidebar-logo {
      width: 32px;
      height: 32px;
      vertical-align: middle;
      margin-right: 12px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #ffffff;
      font-weight: 600;
      line-height: 50px;
      font-size: 17px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      vertical-align: middle;
      letter-spacing: 0.5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
}
</style>
