# 能力基线：shared-ui-toolkit（共享组件与工具集）

## Purpose

本能力域固化全局共享组件、指令与工具函数的现状契约：分页/字典标签/上传/树选择/Monaco/Cron 等组件的 props 与事件约定，$modal/$tab/$cache/$download 全局对象行为，useDict 字典机制，以及浏览器端存储键位的完整清单。业务模块 spec 引用组件时以本文件为准。

## Requirements

### Requirement: 分页组件契约

全局 Pagination 组件必须以 props: total（必填）、page（v-model:page）、limit（默认 20，v-model:limit）、pageSizes（默认 [10,20,30,50]）、layout（默认 'total, sizes, prev, pager, next, jumper'）、background（true）、autoScroll（翻页后平滑滚回顶部 800ms）、hidden 控制；页码变化 emit('pagination', {page, limit})；pagerCount 在窄屏（<992px）自动降为 5。业务列表页统一以 `v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize"` 接线。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 切换每页条数

- **WHEN** 用户把 pageSize 从 10 改为 50 且当前页超出范围
- **THEN** 页码重置为 1 并触发 pagination 事件重新查询

### Requirement: 字典标签与字典获取

DictTag 组件按字典项 cssTag 渲染对应风格的 el-tag。useDict(...types) 的取数顺序固定：先查 Vuex user.dictTypes（登录时下发），未命中则 GET /system/config/dict/{dictType} 实时拉取且不回写 Vuex；返回 ref 集合，元素结构 {label, value, elTagType}。selectDictLabel(s) 按值匹配回显文本，未命中原样显示该值。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 未预载字典实时拉取

- **WHEN** 页面使用一个登录时未下发的字典类型
- **THEN** 组件挂载时发起一次 dict 接口请求完成渲染（后续进入页面仍会重复请求）

### Requirement: 上传组件契约

FileUpload 与 ImageUpload 必须以上传地址 `{VITE_APP_BASE_API}/file/upload` 提交（el-upload action），请求头固定携带 `Authorization: Bearer <token>`；props 含 value/modelValue（回显字符串或逗号分隔）、fileSize（MB 上限，超限提示「上传文件大小不能超过 x MB!」）、fileType（扩展名数组，不符提示「文件格式不正确…」）、limit/isShowTip 等。资源管理页的大文件通道不走此组件而走独立 axios 上传（见 http-gateway）。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 超限文件被拒

- **WHEN** 选择大于 fileSize 上限的文件
- **THEN** 前端直接弹错且不发起上传请求

### Requirement: Monaco 编辑器封装

MonacoEditor 公共组件必须支持 props value/language/theme 等（默认 vs-dark），worker 加载路径基于 `{origin}/monaco-editor/min/vs`；Flink SQL 表单与 dig 专家编辑器另有页面内直连 monaco.editor.create 的用法（语言分别为 sql/json），两者并存。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: JSON 编辑器初始化

- **WHEN** dig 专家模式页挂载
- **THEN** 以 json 语言 + vs-dark 主题创建编辑器并写入模板内容

### Requirement: Cron 表达式生成

CronInput 必须提供输入框 +「生成」按钮弹出对话框的组合：快捷选择（simple，含每 5 分钟/每小时/每天零点等常用表达式）与高级模式切换；内置 cron-parser 计算并在界面展示未来执行时间预览。CronTab 为七段式（秒/分/时/日/月/周）Tab 面板——注意实际只有 6 个 Tab 无「年」，每字段支持任意值/指定/周期/循环等类型。两组件均以 v-model 双向绑定表达式字符串。根目录 CRON_GENERATOR_UPGRADE.md 宣称的「7 个 Tab 含年字段」与代码现状不符。

| 使用方 | 场景 |
|---|---|
| metadata SyncJobDialog | 数据源定时同步 cron |
| spark SqlForm/JarForm | Spark 任务调度周期 |

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 快捷生成每日零点

- **WHEN** 在快捷面板选择「每天零点」
- **THEN** 输入框回填对应表达式并展示下次执行时间预览

### Requirement: 导航与布局辅助组件

Sidebar 相关辅助组件必须满足：Breadcrumb 按 matched 路由渲染面包屑；Hamburger 切换侧边栏折叠；Screenfull 全屏切换；SizeSelect 切换 Element Plus 尺寸（写 Cookie size）；HeaderSearch 基于 fuse.js 对菜单进行关键字检索跳转；TopNav 在 topNav 开关下渲染顶部菜单条（数据取 topbarRouters）；SvgIcon 渲染 svg 图标集；iFrame 以 iframe 内嵌外链页面（Druid 使用）；IconSelect 提供图标选择器；TreeSelect 包装 el-tree-select 支持树形单选；RightToolbar 组合刷新/显隐搜索/列控制按钮（emit update:showSearch/search 事件）；ParentView 作为多级菜单的路由占位容器；Project 展示 logo 区。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 菜单全文搜索

- **WHEN** 在 HeaderSearch 输入「血缘」
- **THEN** 模糊匹配出数据血缘菜单项且回车即跳转

### Requirement: 全局消息与页签对象

$modal 必须提供 msg/msgError/msgSuccess/msgWarning（ElMessage 系列）、alert/alertError/alertSuccess/alertWarning（标题统一「系统提示」）、notify 系列、confirm/prompt（warning 型确认框，文案按钮确定/取消）、loading/closeLoading（全屏遮罩）。$tab 必须提供 refreshPage（删缓存后经 /redirect 重进实现刷新）、openPage/closePage/closeOpenPage/closeAllPage/closeLeftPage/closeRightPage/closeOtherPage/updatePage 十个页签操作。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 表单提交确认

- **WHEN** 代码调用 proxy.$modal.confirm('是否删除？') 且用户点确定
- **THEN** Promise resolve 进入删除逻辑，点取消则 reject 不执行

### Requirement: 缓存封装与下载插件

$cache 必须提供 session/local 两组 get/set/setJSON/getJSON/remove 方法（对 sessionStorage/localStorage 的空值守卫封装）。$download 插件必须提供 name(name,isDelete)（GET {baseURL}/file/download?fileName=&delete= blob 下载，从响应头 download-filename 取文件名）与 zip(url,name) 两个方法，失败响应经 printErrMsg 按 errorCode 映射报错；与 utils/request.js 的 download(url,params,filename)（表单式导出）并存分工。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 服务端文件下载

- **WHEN** 调用 $download.name('报表.xlsx')
- **THEN** 以 Bearer 头请求 /lacus-api/file/download 并保存为响应头指定的文件名

### Requirement: 复制指令

v-copyText 必须将绑定值存为点击时复制的文本（execCommand('copy') 兼容方案），arg='callback' 时绑定的函数作为复制后回调调用。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 点击复制

- **WHEN** 元素声明 v-copyText="'要复制的内容'"
- **THEN** 点击该元素后剪贴板获得文本，注册了回调则同时触发回调

### Requirement: 工具函数清单

utils 各文件的职责边界必须保持：common.js（useDynamicTitle/resetForm/handleTree 树构造/addTimeRange/parseStrEmpty/deepClone/getNormalPath/isBlobData 等）；dateUtil.js（parseTime 模板格式化/getTimeDistance 相对时间/formatDate）；strUtil.js（encodeURIParams/paramsToQueryString/queryStringToParams/byteLength/createUniqueString/camelCase 等）；validate.js（isHttp/isExternal/validURL/validEmail 等）；elementUtil.js 与 scrollUtil.js（元素定位与滚动辅助）。resetForm/handleTree/addTimeRange/parseTime 已在 main.js 注册为全局属性可直接调用。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 树形数据组装

- **WHEN** 后端返回平铺的部门数组（id/parentId）
- **THEN** handleTree(data) 组装为 children 嵌套树供树控件渲染

### Requirement: 浏览器存储键位总账

全部浏览器存储键位固定如下，新增键位需评审：
Cookies：Admin-Token（会话令牌）、sidebarStatus（侧边栏状态 0/1）、size（组件尺寸）、username/password(RSA 密文)/rememberMe（记住密码，30 天）；localStorage：layout-setting（布局设置 JSON）；sessionStorage：sessionObj（防重复提交指纹）。此外 TagsView 页签列表仅存 Vuex 内存态，不做持久化，刷新后页签清空仅保留 affix 固定项。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 存储审计

- **WHEN** 审查应用写入的全部存储键
- **THEN** 键位集合与本清单一致，无未申报的持久化数据
