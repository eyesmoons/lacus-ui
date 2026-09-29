<template>
  <div class="login">
    <!-- 左侧品牌区 -->
    <div class="brand-pane">
      <div class="brand-pane__glow brand-pane__glow--one"></div>
      <div class="brand-pane__glow brand-pane__glow--two"></div>
      <div class="brand-pane__inner">
        <div class="brand-header">
          <span class="brand-header__logo">
            <img src="@/assets/logo/logo.png" alt="Lacus" />
          </span>
          <span class="brand-header__name">Lacus 数据平台</span>
        </div>
        <h1 class="brand-slogan">采集 · 计算 · 质量<br />服务化</h1>
        <p class="brand-desc">一站式大数据开发治理平台，让数据资产持续创造价值</p>
        <ul class="brand-features">
          <li><el-icon><check /></el-icon><span>多源实时采集，SeaTunnel 可视化集成</span></li>
          <li><el-icon><check /></el-icon><span>Flink / Spark 实时与离线一体化计算</span></li>
          <li><el-icon><check /></el-icon><span>SQL 即服务，快速发布统一 API</span></li>
          <li><el-icon><check /></el-icon><span>全链路数据质量检测与治理</span></li>
        </ul>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="form-pane">
      <div class="form-inner">
        <h2 class="form-title">欢迎登录</h2>
        <p class="form-subtitle">Lacus 数据平台</p>
        <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" type="link" size="large" auto-complete="off" placeholder="账号">
              <template #prefix>
                <svg-icon icon-class="user" class="el-input__icon input-icon" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              size="large"
              auto-complete="off"
              placeholder="密码"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <svg-icon icon-class="password" class="el-input__icon input-icon" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="code" v-if="isCaptchaOn">
            <el-input
              v-model="loginForm.code"
              size="large"
              auto-complete="off"
              placeholder="验证码"
              style="width: 63%"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <svg-icon icon-class="validCode" class="el-input__icon input-icon" />
              </template>
            </el-input>
            <div class="login-code">
              <img :src="codeUrl" @click="getCode" class="login-code-img" />
            </div>
          </el-form-item>
          <el-checkbox v-model="loginForm.rememberMe" style="margin: 0px 0px 25px 0px">记住账号</el-checkbox>
          <el-form-item style="width: 100%">
            <el-button :loading="loading" size="large" type="primary" style="width: 100%" @click.prevent="handleLogin">
              <span v-if="!loading">登 录</span>
              <span v-else>登 录 中...</span>
            </el-button>
            <div style="float: right" v-if="register">
              <router-link class="link-type" :to="'/register'">立即注册</router-link>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <div class="form-footer">
        <span>Copyright © 2022-2023 lacus All Rights Reserved.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import Cookies from 'js-cookie';
import { Check } from '@element-plus/icons-vue';
import * as loginApi from '@/api/loginApi';
import { encrypt } from '@/utils/rsaUtil';

const store = useStore();
const router = useRouter();
const { proxy } = getCurrentInstance();

const loginForm = ref({
  username: '',
  password: '',
  rememberMe: false,
  code: '',
  uuid: '',
});

const loginRules = {
  username: [{ required: true, trigger: 'blur', message: '请输入您的账号' }],
  password: [{ required: true, trigger: 'blur', message: '请输入您的密码' }],
  code: [{ required: true, trigger: 'change', message: '请输入验证码' }],
};

const codeUrl = ref('');
const loading = ref(false);
// 验证码开关
const isCaptchaOn = ref(true);
// 注册开关
const register = ref(false);
const redirect = ref(undefined);

function handleLogin() {
  proxy.$refs.loginRef.validate((valid) => {
    if (valid) {
      loading.value = true;
      // 勾选"记住账号"时仅记住账号名，不落盘任何形式的密码
      if (loginForm.value.rememberMe) {
        Cookies.set('username', loginForm.value.username, { expires: 30 });
        Cookies.set('rememberMe', loginForm.value.rememberMe, { expires: 30 });
      } else {
        Cookies.remove('username');
        Cookies.remove('rememberMe');
      }
      // 清理历史版本曾写入的密码 cookie
      Cookies.remove('password');
      // 调用action的登录方法
      store
        .dispatch('Login', loginForm.value)
        .then(() => {
          router.push({ path: redirect.value || '/' });
        })
        .catch(() => {
          loading.value = false;
          // 重新获取验证码
          if (isCaptchaOn.value) {
            getCode();
          }
        });
    }
  });
}

function getCode() {
  loginApi.getCodeImg().then((res) => {
    isCaptchaOn.value = res.isCaptchaOn === undefined ? true : res.isCaptchaOn;
    if (isCaptchaOn.value) {
      codeUrl.value = `data:image/gif;base64,${res.img}`;
      loginForm.value.uuid = res.uuid;
    }
  });
}

function getCookie() {
  const username = Cookies.get('username');
  const rememberMe = Cookies.get('rememberMe');
  loginForm.value = {
    ...loginForm.value,
    username: username === undefined ? loginForm.value.username : username,
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe),
  };
  // 历史版本可能残留可被解密的密码 cookie，主动清除
  Cookies.remove('password');
}

getCode();
getCookie();
</script>

<style lang="scss" scoped>
.login {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* ---------- 左侧品牌区 ---------- */
.brand-pane {
  position: relative;
  flex: 0 0 55%;
  display: flex;
  align-items: center;
  padding: 60px 72px;
  background: linear-gradient(135deg, #0b1b33 0%, #123c8c 55%, #2563eb 100%);
  color: #fff;
  overflow: hidden;
}

.brand-pane__glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;

  &--one {
    top: -120px;
    right: -80px;
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, rgba(102, 217, 255, 0.28) 0%, rgba(102, 217, 255, 0) 68%);
  }

  &--two {
    bottom: -160px;
    left: -100px;
    width: 480px;
    height: 480px;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, rgba(37, 99, 235, 0) 70%);
  }
}

.brand-pane__inner {
  position: relative;
  z-index: 1;
  max-width: 520px;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 56px;
}

.brand-header__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.94);

  img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
}

.brand-header__name {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.brand-slogan {
  margin: 0 0 16px;
  font-size: 40px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: 0.06em;
}

.brand-desc {
  margin: 0 0 48px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.72);
}

.brand-features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.88);
  }

  .el-icon {
    color: #66d9ff;
    font-size: 17px;
  }
}

/* ---------- 右侧表单区 ---------- */
.form-pane {
  position: relative;
  flex: 1 1 45%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  min-width: 0;
}

.form-inner {
  width: 400px;
  max-width: calc(100% - 48px);
}

.form-title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.form-subtitle {
  margin: 0 0 36px;
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
}

.login-form {
  .el-input {
    height: 40px;

    input {
      height: 40px;
    }
  }

  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 0px;
  }
}

.login-code {
  width: 33%;
  height: 40px;
  float: right;

  img {
    cursor: pointer;
    vertical-align: middle;
  }
}

.login-code-img {
  height: 40px;
  padding-left: 12px;
}

.link-type {
  color: var(--el-color-primary, #2563eb);
  text-decoration: none;
  font-size: 13px;
}

.form-footer {
  position: absolute;
  bottom: 24px;
  left: 0;
  width: 100%;
  text-align: center;
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  letter-spacing: 1px;
}

/* ---------- 响应式：<992px 隐藏品牌区 ---------- */
@media (max-width: 992px) {
  .brand-pane {
    display: none;
  }

  .form-pane {
    flex: 1 1 100%;
  }
}
</style>
