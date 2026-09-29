# Tasks: oneapi-docs-monitoring

## 1. API 模块

- [ ] 1.1 新建 `src/api/oneapi/docExportApi.js`：`exportApiDoc(apiIds)` → `GET /one/api/export?apiIds=`，`responseType:'blob'`
- [ ] 1.2 新建 `src/api/oneapi/monitorApi.js`：`getMonitorOverview(params)` → `GET /one/api/monitor/overview`
- [ ] 1.3 新建 `src/api/oneapi/statsApi.js`：`getStatsSummary(params)` → `GET /one/api/stats/summary`、`getStatsTrend(params)` → `GET /one/api/stats/trend`
- [ ] 1.4 新建 `src/api/oneapi/historyApi.js`：`listCallHistory(query)` → `GET /one/api/history/paging`、`getCallDetail(callId)` → `GET /one/api/history/{callId}`

## 2. 接口文档导出

- [ ] 2.1 `src/views/oneapi/index.vue`：列表顶部工具栏加「批量导出」按钮，`:disabled="selection.length===0"`，loading 态防重复
- [ ] 2.2 实现批量导出：勾选 → `exportApiDoc(apiIds.join(','))` → blob 下载 `接口文档.md`；失败提示「导出失败，请重试」并保留勾选与查询
- [ ] 2.3 `src/views/oneapi/detail.vue`：接口信息 Tab 加「导出文档」按钮，仅 `status===1` 可用，否则禁用提示「接口未上线，无法导出」
- [ ] 2.4 实现单个导出：`exportApiDoc(apiId)` → 下载 `<接口名称>.md`

## 3. API 监控看板

- [ ] 3.1 新建 `src/views/oneapi/monitor.vue`：查询表单（时间区间默认近 24h、数据源下拉、状态下拉）+ el-table + 排序
- [ ] 3.2 表格列：接口名称/调用次数/成功数/失败数/错误率/平均耗时/P95 耗时；`:row-class-name` 对错误率>5% 标红（`.row-warn`）
- [ ] 3.3 `onMounted` 拉取 `getMonitorOverview`，查询/重置按钮联动

## 4. 统计概览页

- [ ] 4.1 新建 `src/views/oneapi/stats.vue`：时间区间预设（近1h/24h/7天/自定义）+ 数据源筛选
- [ ] 4.2 概览卡片区：调用总量、成功率（`getStatsSummary`）
- [ ] 4.3 趋势图区：`import * as echarts`，`onMounted` init 折线（次数/耗时）与错误趋势（`getStatsTrend`），resize 监听 + `onBeforeUnmount` dispose
- [ ] 4.4 Top 调用接口表（按次数降序前 10，来自 summary）
- [ ] 4.5 自定义区间校验：起止必填且结束不早于开始，否则提示不请求

## 5. 调用历史列表

- [ ] 5.1 新建 `src/views/oneapi/history.vue`：查询表单（接口/状态/时间区间）+ el-table + pagination
- [ ] 5.2 列：接口名称/请求方式/响应状态/耗时(ms)/调用方/调用时间/入参摘要；行操作「详情」
- [ ] 5.3 详情下钻 `el-dialog`：完整入参、响应体摘要、失败错误信息（按需 `getCallDetail(callId)` 懒拉）

## 6. 路由与联调

- [ ] 6.1 路由文件登记 `/oneapi/monitor`、`//oneapi/stats`、`/oneapi/history` 指向对应组件（动态路由由后端下发则仅备组件）
- [ ] 6.2 权限点约定：导出 `oneapi:doc:export`、监控 `oneapi:monitor:view`、统计 `oneapi:stats:view`、历史 `oneapi:history:view`（与既有 `metadata:*` 风格一致），按钮加 `v-hasPermission`
- [ ] 6.3 前端 dev server 联调：导出（单/批）、监控看板、统计图、历史下钻逐页验收；mock 期对齐契约后切真实端点
