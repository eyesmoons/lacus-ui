# 登录页商业化改版 · 设计文档

## Context

当前 `src/views/login.vue`（237 行）：`.login` 黑底全屏 + `ParticleBackground`（three.js 2000 粒子）铺底 + 居中 400px 白卡，卡片带 `#2563eb` 标题条与负 margin 的特殊设计。script 部分为标准 RuoYi 登录逻辑（验证码、记住密码 Cookie、RSA 加密存储、redirect 跳转），**全部保留不动**。

已核实的影响面：
- `ParticleBackground` 仅被 login.vue 引用；`three` 仅在该组件 import——可安全移除
- 项目已有品牌资产：`src/assets/logo/logo.png`
- 视觉基线沿用 home-commercial-redesign 确立的科技深蓝色板：主色 #2563EB、深海军蓝 #0B1B33、横幅渐变 #123C8C→#3B6FE0、青色点缀 #66D9FF

## Goals / Non-Goals

**Goals:**
- 左右分栏企业级登录页，第一屏传达产品定位
- 移除 three.js（约 600KB gzip 后约 150KB）降低登录页加载成本
- 表单逻辑零改动，纯视觉/布局层重构

**Non-Goals:**
- 不动注册页（register.vue 有自己的背景图体系）
- 不做国际化、不做多主题登录页
- 不引入新依赖（图标用现有 @element-plus/icons-vue 与 svg-icon）

## Decisions

1. **左栏宽度 55% / 右栏 45%**：品牌区是卖点主体，但表单区仍需 ≥400px 舒适宽度；1440px 屏下右栏约 648px，充裕。
2. **渐变色阶三段式**：#0B1B33（侧边栏同源深蓝）→ #123C8C（首页横幅起点）→ #2563EB（主色），使登录页与「侧边栏—首页横幅」形成同一色彩叙事；叠加两个 radial 光斑（青 #66D9FF 低透明度）呼应首页横幅装饰。
3. **亮点列表用 el-icon Check + 文案**：不依赖插画素材（避免新增图片资产），勾选图标 + 14px 文案在深底上干净利落；四条文案取自平台真实能力域（采集/计算/API/质量），与首页副标语一致。
4. **Logo 复用 `@/assets/logo/logo.png`**：白底 logo 在深色区需确认观感——若为深色图形则加白色圆形衬底容器（实现时目测调整）。
5. **three 从 dependencies 移除而非保留**：全 src 无其他引用（已 grep 核实）；移除后必须跑一次构建验证无隐式引用。
6. **响应式断点 992px**：与首页 chart-row 的 lg 断点一致，<992px 品牌区 display:none，表单区占满全屏居中。
7. **版权行放右栏底部**（非 fixed 全屏）：双栏结构下 fixed 底部横条会横穿品牌区，改为右栏 flex 尾部元素。

## Risks / Trade-offs

- [移除 three 后构建失败（存在未 grep 到的引用）] → 任务清单含独立构建验证步骤，失败则回滚依赖移除仅删组件引用
- [logo.png 在深色底不可读] → 实现时目测，必要时套白色圆角衬底或改用文字标识为主、logo 为辅
- [窄屏表单区高度溢出（验证码+注册链接）] → 表单容器允许纵向滚动兜底
