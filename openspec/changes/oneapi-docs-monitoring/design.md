## Context

OneAPI 模块现状见 `openspec/specs/oneapi-domain/spec.md`：列表 `src/views/oneapi/index.vue`、四步向导 `create.vue`/`edit.vue`、详情 `detail.vue`（4 Tab：接口信息/SQL脚本/请求参数/返回参数）、API 层 `src/api/oneapi/apiInfoApi.js`。本变更新增文档导出与可观测性三页，均属前端消费后端 REST 契约，不改既有列表/向导/状态机行为。本仓库为前端工程，后端需提供下列新端点；前端契约已在两份 delta spec 中固化。

ECharts 5.3.2 已在工程内（`import * as echarts from 'echarts'` + `echarts.init(el,'macarons').setOption`，见 `src/views/monitor/cache/index.vue`），统计趋势图复用此模式。

## Goals / Non-Goals

**Goals:**
- 复用既有「查询表单 + el-table + pagination」列表范式，新增三个页面与导出能力。
- 文档导出与监控/统计/历史共用既有请求封装 `@/utils/request`，文件下载走 `responseType: 'blob'`。
- 监控/统计/历史三页共享调用记录数据源语义但各自独立页面与路由。

**Non-Goals:**
- 不做后端实现（仅定义前端消费的端点契约，后端由他方实现）。
- 不引入新图表库或新 UI 框架；统计图复用 ECharts 既有模式。
- 不改既有 OneAPI 列表/向导/状态机/编辑保护行为。
- 不做实时推送（监控/统计为按需拉取，非 WebSocket 实时）。

## Decisions

### D1: 新增 API 模块文件而非扩张 apiInfoApi.js

导出/监控/统计/历史是四个独立领域，各建文件：`src/api/oneapi/docExportApi.js`、`monitorApi.js`、`statsApi.js`、`historyApi.js`。**理由**：`apiInfoApi.js` 已 11 个端点接近认知上限，按域拆分与工程其他模块（如 metadata 按域拆 dbApi/tableApi）一致。**替代方案**：全塞进 apiInfoApi.js——被否，文件过大且职责混杂。

### D2: 文档导出为后端渲染 Markdown + 前端 blob 下载

`GET /one/api/export?apiIds=1,2,3` 后端按接口聚合 Markdown 返回，前端以 `responseType:'blob'` 接收并触发下载（复用工程 `download` 工具或 `<a download>`）。**理由**：文档结构一致性强、可批量分节、前端无需重拼参数表/响应表；Markdown 文本由后端基于已发布配置生成最权威。**替代方案**：前端拼装 Markdown——被否，需在两端重复参数/响应列渲染逻辑，易与详情页漂移。

### D3: 统计趋势复用 ECharts 既有 init/setOption 模式

`stats.vue` 内 `import * as echarts`，`onMounted` 中 `echarts.init(ref, 'macarons')`，数据返回后 `setOption` 折线/柱状；窗口 resize 监听 `resize()`。**理由**：与 `monitor/cache/index.vue` 完全一致，无学习成本，不引新依赖。**替代方案**：封装全局 `<EChart>` 组件——非目标，本次三处图表不值得为此新建抽象。

### D4: 监控阈值标红用 row-class-name

`monitor.vue` 的 el-table 用 `:row-class-name` 对错误率 > 5% 的行返回 `'row-warn'`，scoped style 加 `.row-warn { color: var(--el-color-danger); }`。**理由**：声明式、不污染单元格模板。**替代方案**：每个单元格 v-if 加 class——繁琐。

### D5: 路由与菜单挂载在 OneAPI 根下

新增路由 `/oneapi/monitor`、`/oneapi/stats`、`/oneapi/history`，组件对应 `views/oneapi/monitor.vue` 等；菜单经后端动态路由下发（与既有 OneAPI 菜单同机制），前端只提供组件。导出按钮直接加在既有 `index.vue`（批量）与 `detail.vue`（单个），不新开路由。

### D6: 历史下钻用 el-dialog 内联

`history.vue` 行内「详情」打开 `el-dialog` 展示入参/响应摘要/错误信息，数据随列表项携带或按 id 懒拉（`GET /one/api/history/{callId}`）。**理由**：与工程内其他「列表→弹窗下钻」一致，不引新路由。

## Risks / Trade-offs

- [后端端点未就绪] → 前端按契约先行，mock 联调；端点签名以 spec 为准，后端实现须对齐 `apiIds`/时间区间/分页参数命名。
- [大区间统计/历史查询慢] → 时间区间预设封顶 7 天，自定义区间前端校验起止必填且合理；分页参数沿用工程默认 pageSize。
- [批量导出 apiIds 过长超 URL 长度] → 现阶段逗号拼接到 query；若超限后续改 POST body，契约层不绑定传输方式（spec 仅写 apiIds 集合语义）。
- [ECharts 实例未销毁内存泄漏] → `onBeforeUnmount` 调 `chart.dispose()` 并移除 resize 监听，对齐工程既有 dispose 习惯。

## Migration Plan

1. 前端先行：按 spec 实现四个页面/入口与 API 模块，联调期用 mock 数据。
2. 后端交付端点后切真实数据，逐页验收（导出→监控→统计→历史）。
3. 回滚：新页面为增量路由，移除菜单项与路由即回滚；导出按钮以 feature flag 或权限点控制可见性。
