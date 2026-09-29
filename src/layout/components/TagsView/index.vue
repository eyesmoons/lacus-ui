<template>
    <div id="tags-view-container" class="tags-view-container">
        <scroll-pane ref="scrollPaneRef" class="tags-view-wrapper" @scroll="handleScroll">
            <router-link
                    v-for="tag in visitedViews"
                    :key="tag.path"
                    :data-path="tag.path"
                    :class="isActive(tag) ? 'active' : ''"
                    :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
                    class="tags-view-item"
                    :style="activeStyle(tag)"
                    @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''"
                    @contextmenu.prevent="openMenu(tag, $event)"
            >
                {{ tag.title }}
                <span v-if="!isAffix(tag)" @click.prevent.stop="closeSelectedTag(tag)">
          <close class="el-icon-close" style="width: 1em; height: 1em; vertical-align: middle"/>
        </span>
            </router-link>
        </scroll-pane>
        <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
            <li @click="refreshSelectedTag(selectedTag)">
                <refresh-right style="width: 1em; height: 1em"/>
                刷新页面
            </li>
            <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">
                <close style="width: 1em; height: 1em"/>
                关闭当前
            </li>
            <li @click="closeOthersTags">
                <circle-close style="width: 1em; height: 1em"/>
                关闭其他
            </li>
            <li v-if="!isFirstView()" @click="closeLeftTags">
                <back style="width: 1em; height: 1em"/>
                关闭左侧
            </li>
            <li v-if="!isLastView()" @click="closeRightTags">
                <right style="width: 1em; height: 1em"/>
                关闭右侧
            </li>
            <li @click="closeAllTags(selectedTag)">
                <circle-close style="width: 1em; height: 1em"/>
                全部关闭
            </li>
        </ul>
    </div>
</template>

<script setup>
import ScrollPane from './ScrollPane';
import {getNormalPath} from '@/utils/common';

const visible = ref(false);
const top = ref(0);
const left = ref(0);
const selectedTag = ref({});
const affixTags = ref([]);
const scrollPaneRef = ref(null);

const {proxy} = getCurrentInstance();
const store = useStore();
const route = useRoute();
const router = useRouter();

const visitedViews = computed(() => store.state.tagsView.visitedViews);
const routes = computed(() => store.state.permission.routes);
const theme = computed(() => store.state.settings.theme);

watch(route, () => {
    addTags();
    moveToCurrentTag();
});
watch(visible, (value) => {
    if (value) {
        document.body.addEventListener('click', closeMenu);
    } else {
        document.body.removeEventListener('click', closeMenu);
    }
});
onMounted(() => {
    initTags();
    addTags();
});

function isActive(r) {
    return r.path === route.path;
}

function activeStyle(tag) {
    if (!isActive(tag)) return {};
    return {
        'background-color': theme.value,
        'border-color': theme.value,
    };
}

function isAffix(tag) {
    return tag.meta && tag.meta.affix;
}

function isFirstView() {
    try {
        return selectedTag.value.fullPath === visitedViews.value[1].fullPath || selectedTag.value.fullPath === '/index';
    } catch (err) {
        return false;
    }
}

function isLastView() {
    try {
        return selectedTag.value.fullPath === visitedViews.value[visitedViews.value.length - 1].fullPath;
    } catch (err) {
        return false;
    }
}

function filterAffixTags(routes, basePath = '') {
    let tags = [];
    routes.forEach((route) => {
        if (route.meta && route.meta.affix) {
            const tagPath = getNormalPath(`${basePath}/${route.path}`);
            tags.push({
                fullPath: tagPath,
                path: tagPath,
                name: route.name,
                meta: {...route.meta},
            });
        }
        if (route.children) {
            const tempTags = filterAffixTags(route.children, route.path);
            if (tempTags.length >= 1) {
                tags = [...tags, ...tempTags];
            }
        }
    });
    return tags;
}

function initTags() {
    const res = filterAffixTags(routes.value);
    affixTags.value = res;
    for (const tag of res) {
        // Must have tag name
        if (tag.name) {
            store.dispatch('tagsView/addVisitedView', tag);
        }
    }
}

function addTags() {
    const {name} = route;
    if (name) {
        store.dispatch('tagsView/addView', route);
    }
    return false;
}

function moveToCurrentTag() {
    nextTick(() => {
        for (const r of visitedViews.value) {
            if (r.path === route.path) {
                scrollPaneRef.value.moveToTarget(r);
                // when query is different then update
                if (r.fullPath !== route.fullPath) {
                    store.dispatch('tagsView/updateVisitedView', route);
                }
            }
        }
    });
}

function refreshSelectedTag(view) {
    proxy.$tab.refreshPage(view);
}

function closeSelectedTag(view) {
    proxy.$tab.closePage(view).then(({visitedViews}) => {
        if (isActive(view)) {
            toLastView(visitedViews, view);
        }
    });
}

function closeRightTags() {
    proxy.$tab.closeRightPage(selectedTag.value).then((visitedViews) => {
        if (!visitedViews.find((i) => i.fullPath === route.fullPath)) {
            toLastView(visitedViews);
        }
    });
}

function closeLeftTags() {
    proxy.$tab.closeLeftPage(selectedTag.value).then((visitedViews) => {
        if (!visitedViews.find((i) => i.fullPath === route.fullPath)) {
            toLastView(visitedViews);
        }
    });
}

function closeOthersTags() {
    router.push(selectedTag.value).catch(() => {
    });
    proxy.$tab.closeOtherPage(selectedTag.value).then(() => {
        moveToCurrentTag();
    });
}

function closeAllTags(view) {
    proxy.$tab.closeAllPage().then(({visitedViews}) => {
        if (affixTags.value.some((tag) => tag.path === route.path)) {
            return;
        }
        toLastView(visitedViews, view);
    });
}

function toLastView(visitedViews, view) {
    const latestView = visitedViews.slice(-1)[0];
    if (latestView) {
        router.push(latestView.fullPath);
    } else {
        // now the default is to redirect to the home page if there is no tags-view,
        // you can adjust it according to your needs.
        if (view.name === 'Dashboard') {
            // to reload home page
            router.replace({path: `/redirect${view.fullPath}`});
        } else {
            router.push('/');
        }
    }
}

function openMenu(tag, e) {
    const menuMinWidth = 105;
    const offsetLeft = proxy.$el.getBoundingClientRect().left; // container margin left
    const {offsetWidth} = proxy.$el; // container width
    const maxLeft = offsetWidth - menuMinWidth; // left boundary
    const l = e.clientX - offsetLeft + 15; // 15: margin right

    if (l > maxLeft) {
        left.value = maxLeft;
    } else {
        left.value = l;
    }

    top.value = e.clientY;
    visible.value = true;
    selectedTag.value = tag;
}

function closeMenu() {
    visible.value = false;
}

function handleScroll() {
    closeMenu();
}
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 38px;
  width: 100%;
  background: linear-gradient(to right, #ffffff, #fafbfc);
  border-bottom: 1px solid #e8eaec;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .tags-view-wrapper {
    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: 28px;
      line-height: 28px;
      border: 1px solid #e4e7ed;
      color: #606266;
      background: #ffffff;
      padding: 0 12px;
      font-size: 13px;
      margin-left: 6px;
      margin-top: 5px;
      border-radius: 4px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:first-of-type {
        margin-left: 12px;
      }

      &:last-of-type {
        margin-right: 12px;
      }

      &.active {
        background: linear-gradient(135deg, #1e3a5f 0%, #2c4a6f 100%);
        color: #ffffff;
        border-color: transparent;
        box-shadow: 0 2px 8px rgba(30, 58, 95, 0.3);

        &::before {
          content: '';
          background: #ffffff;
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          position: relative;
          margin-right: 4px;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
        }
      }

      &:hover:not(.active) {
        background-color: #f5f7fa;
        border-color: #dcdfe6;
      }
    }
  }

  .contextmenu {
    margin: 0;
    background: #fff;
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 6px 0;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 400;
    color: #333;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border: 1px solid #e8eaec;

    li {
      margin: 0;
      padding: 8px 20px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: linear-gradient(to right, rgba(30, 58, 95, 0.08), rgba(44, 74, 111, 0.08));
        color: #1e3a5f;
      }
    }
  }
}
</style>

<style lang="scss">
//reset element css of el-icon-close
.tags-view-wrapper {
  .tags-view-item {
    .el-icon-close {
      width: 16px;
      height: 16px;
      vertical-align: 2px;
      border-radius: 50%;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      transform-origin: 100% 50%;

      &:before {
        transform: scale(0.6);
        display: inline-block;
        vertical-align: -3px;
      }

      &:hover {
        background-color: #b4bccc;
        color: #fff;
        width: 12px !important;
        height: 12px !important;
      }
    }
  }
}
</style>
