<template>
  <div class="login">
    <particle-background />
    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <h3 class="title">Lacus - 大数据平台</h3>
      <div id="darkbannerwrap"></div>
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
      <el-checkbox v-model="loginForm.rememberMe" style="margin: 0px 0px 25px 0px">记住密码</el-checkbox>
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
    <!--  底部  -->
    <div class="el-login-footer">
      <span>Copyright © 2022-2023 lacus All Rights Reserved.</span>
    </div>
  </div>
</template>

<script setup>
import Cookies from 'js-cookie';
import ParticleBackground from '@/components/ParticleBackground/index.vue';
// import { getCodeImg } from '@/api/loginApi';
import * as loginApi from '@/api/loginApi';
import { decrypt, encrypt } from '@/utils/rsaUtil';

const store = useStore();
const router = useRouter();
const { proxy } = getCurrentInstance();

const loginForm = ref({
  username: 'demo',
  password: '123456',
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
      // 勾选了需要记住密码设置在cookie中设置记住用户明和名命
      if (loginForm.value.rememberMe) {
        Cookies.set('username', loginForm.value.username, { expires: 30 });
        Cookies.set('password', encrypt(loginForm.value.password), { expires: 30 });
        Cookies.set('rememberMe', loginForm.value.rememberMe, { expires: 30 });
      } else {
        // 否则移除
        Cookies.remove('username');
        Cookies.remove('password');
        Cookies.remove('rememberMe');
      }
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
  const password = Cookies.get('password');
  const rememberMe = Cookies.get('rememberMe');
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe),
  };
}

getCode();
getCookie();
</script>

<style lang="scss" scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #000;
  position: relative;
  overflow: hidden;
}

.title {
  margin: 10px 0 0 -43px;
  padding: 18px 10px 18px 60px;
  background: #409eff;
  position: relative;
  color: #fff;
  font-size: 16px;
}

#darkbannerwrap {
  background: url(../assets/images/aiwrap.png);
  width: 18px;
  height: 10px;
  margin: 0 0 20px -43px;
  position: relative;
}

.login-form {
  border-radius: 6px;
  background: #ffffff;
  width: 400px;
  padding: 25px 25px 5px 25px;

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

.login-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
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

.el-login-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: #fff;
  font-family: Arial;
  font-size: 12px;
  letter-spacing: 1px;
}

.login-code-img {
  height: 40px;
  padding-left: 12px;
}
</style>
