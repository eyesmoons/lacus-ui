<template>
    <div class="navbar">
        <hamburger
                id="hamburger-container"
                :is-active="getters.sidebar.opened"
                class="hamburger-container"
                @toggleClick="toggleSideBar"
        />
        <breadcrumb id="breadcrumb-container" class="breadcrumb-container" v-if="!$store.state.settings.topNav"/>
        <top-nav id="topmenu-container" class="topmenu-container" v-if="$store.state.settings.topNav"/>

        <div class="right-menu">
            <div class="avatar-container">
                <el-dropdown @command="handleCommand" class="right-menu-item hover-effect" trigger="click">
                    <div class="avatar-wrapper">
                        <img :src="getters.avatar" class="user-avatar"/>
                        <el-icon>
                            <caret-bottom/>
                        </el-icon>
                    </div>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <router-link to="/user/profile">
                                <el-dropdown-item>个人中心</el-dropdown-item>
                            </router-link>
                            <el-dropdown-item command="setLayout">
                                <span>布局设置</span>
                            </el-dropdown-item>
                            <el-dropdown-item divided command="logout">
                                <span>退出登录</span>
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
    </div>
</template>

<script setup>
import {ElMessageBox} from 'element-plus';
import Breadcrumb from '@/components/Breadcrumb';
import TopNav from '@/components/TopNav';
import Hamburger from '@/components/Hamburger';
import Screenfull from '@/components/Screenfull';
import SizeSelect from '@/components/SizeSelect';
import HeaderSearch from '@/components/HeaderSearch';
import ProjectGit from '@/components/Project/Git';
import ProjectDoc from '@/components/Project/Doc';

const store = useStore();
const getters = computed(() => store.getters);

function toggleSideBar() {
    store.dispatch('app/toggleSideBar');
}

function handleCommand(command) {
    switch (command) {
        case 'setLayout':
            setLayout();
            break;
        case 'logout':
            logout();
            break;
        default:
            break;
    }
}

function logout() {
    ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => store.dispatch('LogOut')
            // 登出接口失败时回退为本地清理，否则 token 不会被移除，
            // 跳转后路由守卫仍会放行，用户实际并未登出
            .catch(() => store.dispatch('FedLogOut'))
            .finally(() => {
                location.href = '/index';
            }))
        .catch(() => {
        });
}

const emits = defineEmits(['setLayout']);

function setLayout() {
    emits('setLayout');
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(to right, #1e3a5f, #2c4a6f);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
  border-bottom: none;

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-tap-highlight-color: transparent;
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }
  }

  .breadcrumb-container {
    float: left;
    padding-left: 12px;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;
    display: flex;
    align-items: center;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 12px;
      height: 100%;
      font-size: 17px;
      color: #5a5e66;
      vertical-align: text-bottom;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 4px;

      &.hover-effect {
        cursor: pointer;

        &:hover {
          background: rgba(30, 58, 95, 0.08);
          color: #1e3a5f;
        }
      }
    }

    .avatar-container {
      margin-right: 30px;

      .avatar-wrapper {
        margin-top: 12px;
        position: relative;
        padding: 4px 12px;
        border-radius: 6px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .user-avatar {
          cursor: pointer;
          width: 36px;
          height: 36px;
        }

        i {
          cursor: pointer;
          position: absolute;
          right: -18px;
          top: 26px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          transition: transform 0.3s ease;
        }
      }
    }
  }
}
</style>
