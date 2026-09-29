## Why

前端已为 OneAPI 新增文档导出与可观测性三页（见变更 `oneapi-docs-monitoring`），但其消费的 6 个后端端点尚无实现：调用历史表 `one_api_call_history` 仅在运行时应用 `lacus-one-api-app` 写入，admin 侧无实体/Mapper/Service/Controller，监控与统计无从聚合，文档导出也无渲染逻辑。本次变更在 admin 侧补齐这些端点，使前端三页与导出入口可用。

## What Changes

- **新增 admin 侧调用历史读模型**：在 `lacus-dao` 建 `OneApiCallHistoryEntity` + `OneApiCallHistoryMapper`（读 `one_api_call_history` 表，按 `api_url` 关联 `one_api_info`），在 `lacus-service` 建 `IOneApiCallHistoryService` + impl，在 `lacus-domain` 建 `OneApiMonitorBusiness` 编排聚合与 DTO。
- **接口文档导出端点** `GET /one/api/export?apiIds=`：按 apiIds 批量取 `one_api_info`，解析 `apiConfig`，渲染为 Markdown（含元信息/请求参数/响应参数/示例）并以 `text/markdown` 返回。
- **API 监控端点** `GET /one/api/monitor/overview`：按时间区间/数据源/状态聚合各接口的调用次数、成功数、失败数、错误率、平均/P95 耗时，错误率>5% 不在后端标红（前端职责），仅返回数值。
- **统计端点** `GET /one/api/stats/summary`（总量/成功率/Top10/平均耗时）与 `GET /one/api/stats/trend`（按时间分桶的次数/耗时/错误数）。
- **调用历史端点** `GET /one/api/history/paging`（分页，关联出接口名/请求方式等）与 `GET /one/api/history/{callId}`（单次详情：入参/响应摘要/错误信息）。
- 所有新端点加 `@PreAuthorize` 权限注解（`oneapi:doc:export`/`oneapi:monitor:view`/`oneapi:stats:view`/`oneapi:history:view`），沿用 `ResponseDTO`/`PageDTO` 约定。

## Capabilities

### New Capabilities

- `oneapi-doc-export-service`: OneAPI 接口文档导出后端服务——按 apiIds 渲染 Markdown 文档的契约（数据来源、apiConfig 解析、文档结构、权限、传输）。
- `oneapi-observability-service`: OneAPI 可观测性后端服务——基于 `one_api_call_history` 的监控概览/统计概览/统计趋势/调用历史分页与详情的契约（聚合口径、关联键、时间区间、分页、权限、响应形状）。

### Modified Capabilities

（无。`oneapi-domain` 现有 OneAPI 列表/向导/状态机行为不变；新端点为新增，不改写既有 Controller 方法。）
