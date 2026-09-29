<template>
    <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            @select="handleSelect"
    >
        <template v-for="(item, index) in topMenus" :key="item.path + index">
            <el-menu-item :style="{'--theme': theme}" :index="item.path"
            >
                <svg-icon :icon-class="item.meta.icon"/>
                {{ item.meta.title }}
            </el-menu-item
            >
        </template>
    </el-menu>
</template>

<script setup>
import {constantRoutes} from '@/router';
import {isHttp} from '@/utils/validate';

// 隐藏侧边栏路由
const hideList = ['/index', '/user/profile'];

const store = useStore();
const route = useRoute();
const router = useRouter();

// 主题颜色
const theme = computed(() => store.state.settings.theme);
// 所有的路由信息
const routers = computed(() => store.state.permission.topbarRouters);

// 顶部显示菜单
const topMenus = computed(() => {
    const topMenus = [];
    routers.value.map((menu) => {
        if (menu.hidden !== true) {
            // 兼容顶部栏一级菜单内部跳转
            if (menu.path === '/') {
                topMenus.push(menu.children[0]);
            } else {
                topMenus.push(menu);
            }
        }
    });
    return topMenus;
});

// 设置子路由
const childrenMenus = computed(() => {
    const childrenMenus = [];
    routers.value.map((router) => {
        for (const item in router.children) {
            if (router.children[item].parentPath === undefined) {
                if (router.path === '/') {
                    router.children[item].path = `/${router.children[item].path}`;
                } else if (!isHttp(router.children[item].path)) {
                    router.children[item].path = `${router.path}/${router.children[item].path}`;
                }
                router.children[item].parentPath = router.path;
            }
            childrenMenus.push(router.children[item]);
        }
    });
    return constantRoutes.concat(childrenMenus);
});

// 默认激活的菜单
const activeMenu = computed(() => {
    const {path} = route;
    let activePath = path;
    if (path !== undefined && path.lastIndexOf('/') > 0 && hideList.indexOf(path) === -1) {
        const tmpPath = path.substring(1, path.length);
        activePath = `/${tmpPath.substring(0, tmpPath.indexOf('/'))}`;
        store.dispatch('app/toggleSideBarHide', false);
    } else if (!route.children) {
        activePath = path;
        store.dispatch('app/toggleSideBarHide', true);
    }
    activeRoutes(activePath);
    return activePath;
});



function handleSelect(key, keyPath) {
    const route = routers.value.find((item) => item.path === key);
    if (isHttp(key)) {
        // http(s):// 路径新窗口打开
        window.open(key, '_blank');
    } else if (!route || !route.children) {
        // 没有子路由路径内部打开
        router.push({path: key});
        store.dispatch('app/toggleSideBarHide', true);
    } else {
        // 显示左侧联动菜单
        activeRoutes(key);
        store.dispatch('app/toggleSideBarHide', false);
    }
}

function activeRoutes(key) {
    const routes = [];
    if (childrenMenus.value && childrenMenus.value.length > 0) {
        childrenMenus.value.map((item) => {
            if (key == item.parentPath || (key == 'index' && item.path == '')) {
                routes.push(item);
            }
        });
    }
    if (routes.length > 0) {
        store.commit('SET_SIDEBAR_ROUTERS', routes);
    }
    return routes;
}


</script>

<style lang="scss">
.topmenu-container.el-menu--horizontal {
  background: transparent !important;
  border-bottom: none !important;
  box-shadow: none !important;
}

.topmenu-container.el-menu--horizontal > .el-menu-item {
  float: left;
  height: 50px !important;
  line-height: 50px !important;
  font-size: 15px !important;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85) !important;
  padding: 0 20px !important;
  margin: 0 2px !important;
  border-radius: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.topmenu-container.el-menu--horizontal > .el-menu-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #ffd700, transparent);
  transition: width 0.3s ease;
}

.topmenu-container.el-menu--horizontal > .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

.topmenu-container.el-menu--horizontal > .el-menu-item:hover::after {
  width: 60%;
}

.topmenu-container.el-menu--horizontal > .el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.15) !important;
  border-bottom: none !important;
  color: #ffffff !important;
  font-weight: 600;
}

.topmenu-container.el-menu--horizontal > .el-menu-item.is-active::after {
  width: 80%;
  background: linear-gradient(90deg, transparent, #4fc3f7, transparent);
}

/* sub-menu item */
.topmenu-container.el-menu--horizontal > .el-sub-menu .el-sub-menu__title {
  float: left;
  height: 50px !important;
  line-height: 50px !important;
  font-size: 15px !important;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85) !important;
  padding: 0 20px !important;
  margin: 0 2px !important;
  border-radius: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.topmenu-container.el-menu--horizontal > .el-sub-menu .el-sub-menu__title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #ffd700, transparent);
  transition: width 0.3s ease;
}

.topmenu-container.el-menu--horizontal > .el-sub-menu .el-sub-menu__title:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

.topmenu-container.el-menu--horizontal > .el-sub-menu .el-sub-menu__title:hover::after {
  width: 60%;
}

.topmenu-container.el-menu--horizontal > .el-sub-menu.is-active .el-submenu__title {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
  font-weight: 600;
}

.topmenu-container.el-menu--horizontal > .el-sub-menu.is-active .el-submenu__title::after {
  width: 80%;
  background: linear-gradient(90deg, transparent, #4fc3f7, transparent);
}
</style>
