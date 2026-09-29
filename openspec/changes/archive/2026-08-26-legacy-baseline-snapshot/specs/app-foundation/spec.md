# 能力基线：app-foundation（应用骨架与启动）

## Purpose

本能力域固化 lacus-ui 前端应用骨架的现状行为契约：应用启动装配流程、全局组件与方法挂载、Layout 布局体系（侧边栏/顶栏/多页签/keep-alive）、主题与布局设置持久化、首页工作台的数据聚合展示、构建与环境配置。所有条目均为存量代码的实际行为描述，作为后续需求的对照基准。

## ADDED Requirements

### Requirement: 应用启动装配

应用入口 `src/main.js` 必须按以下顺序完成装配：创建 Vue 应用后，先挂载全局属性（useDict、download、parseTime、resetForm、handleTree、addTimeRange、selectDictLabel），再注册全局组件（DictTag、Pagination、TreeSelect、FileUpload、ImageUpload、ImagePreview、RightToolbar、svg-icon），随后安装 router、store、plugins（$tab/$permissionChecker/$cache/$modal/$download 五个全局对象）、Element Plus 图标库；指令通过 `directive(app)` 注册 v-hasRole、v-hasPermission、v-copyText 三项；最后以 zh-cn 语言包初始化 Element Plus，其全局尺寸取自 Cookie `size`（缺省 default），挂载到 #app。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 应用启动完成

- **WHEN** 浏览器加载应用入口
- **THEN** 所有全局组件在任意模板中可直接使用（无需 import），所有页面可通过 proxy 调用 $modal/$tab/$cache/$download/$permissionChecker 与 useDict/download/parseTime 等方法，未显式设置尺寸时 Element Plus 组件为 default 尺寸

### Requirement: SVG 图标体系

应用必须通过 vite-plugin-svg-icons 加载 `src/assets/icons/svg` 下的全部图标：入口处执行 `virtual:svg-icons-register`，全局注册 `<svg-icon icon-class="名称">` 组件。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 使用图标

- **WHEN** 模板中使用 `<svg-icon icon-class="user">`
- **THEN** 渲染出 assets/icons/svg/user.svg 对应的图标

### Requirement: Layout 布局结构

主布局必须由四部分组成：左侧 Sidebar（渲染 store 中 sidebarRouters 生成的菜单树）、顶部 Navbar（含面包屑、用户下拉、布局设置入口等）、TagsView 多页签栏（settings.tagsView 为 true 时显示）、AppMain 内容区。内容区必须使用 `<router-view>` 配合 `<transition name="fade-transform" mode="out-in">` 过渡和 `<keep-alive :include="cachedViews">` 缓存组件实例，且组件 key 为完整路由路径。路由 meta.noCache 为 true 的页面不进入缓存列表。固定头部 settings.fixedHeader 开启时头部区域 fixed 定位。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 页面被多页签缓存

- **WHEN** 用户访问某列表页（路由 name 已进入 cachedViews 且未标记 noCache）后切换到其他页签再返回
- **THEN** 该页面组件实例被保留，之前的查询状态不丢失

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 关闭侧边栏

- **WHEN** 点击折叠按钮触发 toggleSideBar
- **THEN** 侧边栏收起/展开，且 Cookie `sidebarStatus` 写入 0 或 1，刷新后保持折叠状态

### Requirement: 响应式断点行为

视口宽度小于 992px 时应用必须自动切换为 mobile 设备模式并收起侧边栏（无动画）；移动模式下点击遮罩层可关闭已展开的侧边栏。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 缩小浏览器窗口

- **WHEN** 窗口宽度从 1200px 缩小到 900px
- **THEN** device 切换为 mobile，侧边栏自动关闭并出现抽屉遮罩

### Requirement: 布局设置持久化

主题色、侧边栏主题（sideTheme）、topNav、tagsView、fixedHeader、sidebarLogo、dynamicTitle 七项布局设置必须持久化于 localStorage 键 `layout-setting`（Settings 面板修改时整体写入，恢复默认时移除该键）；读取发生在 settings store 初始化时，缺省值为代码内默认值（主题 #2563EB、sideTheme theme-dark、topNav false、tagsView true、fixedHeader false、sidebarLogo true、dynamicTitle false）。网页标题按 dynamicTitle 开关决定是否拼接当前路由标题。Element Plus 全局尺寸存 Cookie `size`。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 修改主题色

- **WHEN** 用户在设置面板选择新主题色
- **THEN** 界面主题即时生效，且 localStorage['layout-setting'] 中 theme 字段更新，刷新后仍生效

### Requirement: 首页工作台

登录后的首页（/index）必须调用 `GET /monitor/dashboard`（参数 days=7）聚合展示：问候语与当日日期的品牌横幅；七张 KPI 卡片（数据源、实时采集、Flink 任务、Spark 任务、数据集成、统一 API、质量规则，数值缺失显示 --，运行中数量大于 0 时红点提示）；近 7 天任务运行趋势图（ECharts 堆叠柱状图：成功/失败/其他，叠加成功率折线，右轴百分比）；实例状态分布环图（SUCCESS 绿/FAILED 红/RUNNING 蓝/WAITING 橙/STOPPED 灰）；三条健康指标条（CPU 使用率、服务器内存、JVM 已用，占比 ≥90% 标红 exception、≥75% 标黄 warning），点击跳转服务器监控页；近期任务实例表格（四引擎最新 8 条，详情按钮优先打开 row.trackingUrl 外链、否则路由跳转 row.path）；最近告警列表（级别 CRITICAL/ERROR 红、WARN 黄、INFO 灰）；六个快捷操作入口。数据加载失败时必须显示错误告警条并提供刷新按钮重试，不弹全局错误通知以外的阻断提示。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 工作台正常加载

- **WHEN** 已登录用户进入首页
- **THEN** 展示 KPI 卡片、两张图表与健康指标条，「更新时间」显示后端 generatedAt 或本地时间

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 工作台接口失败

- **WHEN** GET /monitor/dashboard 返回非 200 或网络失败
- **THEN** 页面显示"工作台数据加载失败"错误条（说明文案+刷新引导），图表区域显示空状态而非报错崩溃

### Requirement: 构建与环境配置

构建必须基于 Vite 2：路径别名 `@`→src、`~`→项目根；开发服务器监听 127.0.0.1:8080 并将 `/lacus-api` 前缀代理到 `http://127.0.0.1:8090` 且重写去除前缀；生产构建按环境变量 VITE_BUILD_COMPRESS 可选生成 .gz/.br 压缩产物（不删除原文件）；unplugin-auto-import 自动导入 vue/vue-router API 及 vuex 的 useStore（源码中 ref/computed/watch/useStore/useRouter 等无需 import）；vite-plugin-vue-setup-extend 支持 `<script setup name="X">` 命名。两个环境（development/production）的 VITE_APP_BASE_API 均为 `/lacus-api`。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 本地开发代理

- **WHEN** 开发环境前端发起请求 `/lacus-api/system/user/list`
- **THEN** 请求被代理到 `http://127.0.0.1:8090/system/user/list`（/lacus-api 前缀被 rewrite 去除）

### Requirement: 未使用的微前端依赖

package.json 声明了 qiankun ^2.10.15 依赖，但 src/、vite/ 与 index.html 中没有任何引用或初始化代码。现状为"声明未使用"，主应用/子应用能力均未启用。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 检索微前端接入点

- **WHEN** 在源码中检索 qiankun 相关导入或注册
- **THEN** 无任何命中，应用以独立单体形态运行
