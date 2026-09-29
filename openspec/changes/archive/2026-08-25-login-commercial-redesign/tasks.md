# 登录页商业化改版 · 任务清单

## 1. 登录页重构

- [x] 1.1 重写 `src/views/login.vue` template：`.login` 改为 flex 双栏容器；左栏 `.brand-pane`（logo 标识行 + 定位标语 + 4 条能力亮点列表）；右栏 `.form-pane`（「欢迎登录」标题 + 平台名副标题 + 现有 el-form 表单整体迁移 + 底部版权行）
- [x] 1.2 script 清理：移除 `ParticleBackground` import 与模板引用，其余登录逻辑（getCode/getCookie/handleLogin/Cookie 存取）零改动保留
- [x] 1.3 style 重写：左栏 `linear-gradient(135deg, #0b1b33 0%, #123c8c 55%, #2563eb 100%)` + 两个青色 radial 光斑装饰层；亮点项 Check 图标主色；右栏白底居中；版权行入右栏尾部；<992px 媒体查询隐藏品牌区
- [ ] 1.4 视觉验收：`npm run dev` 打开 /login，桌面双栏/窄屏单栏两种形态目测，logo 深底可读性确认（不可读则加白色衬底）（待人工验收）

## 2. 移除 three.js 依赖

- [x] 2.1 删除 `src/components/ParticleBackground/` 目录
- [x] 2.2 从 `package.json` dependencies 移除 `"three": "^0.171.0"` 并重装 lockfile（`npm install` 刷新 package-lock.json）
- [x] 2.3 构建验证：`npx vite build --mode staging` 成功，产物体积较改版前下降且无 three 相关 chunk

## 3. 回归验证

- [ ] 3.1 登录流程回归：正确账号登录成功跳转首页；错误密码提示并刷新验证码；勾选记住密码后刷新页面账号回填（待人工验收：后端已可用但自动化浏览器回归因会话中断未完成）
- [ ] 3.2 全局主题回归：登录页新视觉与首页横幅、侧边栏深色形成统一色系；设置抽屉换色不影响登录页布局结构（待人工验收）
