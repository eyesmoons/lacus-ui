## 1. 调用历史读模型（admin 侧）

- [ ] 1.1 在 `lacus-dao` 新建 `OneApiCallHistoryEntity`，映射 `one_api_call_history` 表（historyId/callDate/callIp/apiUrl/callStatus/callCode/errorInfo/callDelay/callTime），遵循现有 Entity 命名与 Lombok 约定。
- [ ] 1.2 在 `lacus-dao` 新建 `OneApiCallHistoryMapper` 接口 + XML，提供：条件分页（apiUrl/callStatus + 时间区间，强制要求 startTime/endTime）、按 apiUrl 分组聚合（callCount/successCount/failCount/avgCost）、按 apiUrl 取有序 callDelay 列表（供 P95）、时间分桶趋势（DatabaseIdProvider 切换 MySQL/PG 日期函数）。
- [ ] 1.3 在 `lacus-service` 新建 `IOneApiCallHistoryService` + `OneApiCallHistoryServiceImpl`，封装 Mapper 调用，返回领域对象（非 DTO）。

## 2. 监控/统计/历史 DTO 与 Business 编排

- [ ] 2.1 在 `lacus-domain` 新建 DTO：`MonitorOverviewItemDTO`、`MonitorOverviewDTO`、`StatsSummaryDTO`、`TopApiDTO`、`StatsTrendDTO`、`TrendBucketDTO`、`HistoryRowDTO`、`HistoryDetailDTO`，字段命名与 spec 一致。
- [ ] 2.2 在 `lacus-domain` 新建/扩展 `OneApiMonitorBusiness`：注入 `IOneApiCallHistoryService` + `IOneApiInfoService`，实现监控概览（按 apiUrl 聚合 + JOIN one_api_info 取 apiName/reqMethod + 计算 errorRate/avgCost/p95Cost）、统计概览（总量/成功率/Top10）、统计趋势（按桶聚合）、历史分页（关联补全）、历史详情。

## 3. 接口文档导出

- [ ] 3.1 在 `OneApiMonitorBusiness` 实现 `exportApiDoc(apiIds)`：逐条取 `OneApiInfoEntity`，解析 `apiConfig` JSON，渲染 Markdown（元信息/请求参数/响应参数/示例），apiConfig 非法时该节显示"暂无参数信息"。
- [ ] 3.2 在 `OneApiInfoController` 新增 `GET /one/api/export?apiIds=`，调用 Business 渲染，以 `ResponseEntity<byte[]>` 返回，Header `Content-Type: text/markdown`、`Content-Disposition: attachment; filename="api-docs.md"`，注解 `@PreAuthorize("@permission.has('oneapi:doc:export')")`。

## 4. 监控/统计/历史端点

- [ ] 4.1 在 `OneApiInfoController` 新增 `GET /one/api/monitor/overview`（参数 startTime/endTime 必填，可选 apiUrl 过滤），注解 `oneapi:monitor:view`，返回 `ResponseDTO<MonitorOverviewDTO>`。
- [ ] 4.2 在 `OneApiInfoController` 新增 `GET /one/api/stats/summary`（时间区间必填），注解 `oneapi:stats:view`，返回 `ResponseDTO<StatsSummaryDTO>`。
- [ ] 4.3 在 `OneApiInfoController` 新增 `GET /one/api/stats/trend`（时间区间必填，可选 bucket 覆盖自动粒度），注解 `oneapi:stats:view`，返回 `ResponseDTO<StatsTrendDTO>`。
- [ ] 4.4 在 `OneApiInfoController` 新增 `GET /one/api/history/paging`（时间区间必填 + pageNum/pageSize + 可选 apiId/callStatus），注解 `oneapi:history:view`，返回 `ResponseDTO<PageDTO<HistoryRowDTO>>`。
- [ ] 4.5 在 `OneApiInfoController` 新增 `GET /one/api/history/{callId}`，注解 `oneapi:history:view`，返回 `ResponseDTO<HistoryDetailDTO>`，不存在时返回 404。

## 5. 参数校验与异常处理

- [ ] 5.1 所有聚合/分页端点的时间区间参数加 `@RequestParam` 必填校验（或 Service 层默认近 24h），避免全表扫描。
- [ ] 5.2 统一异常：apiIds 部分不存在时跳过、callId 不存在返回 404、无权限返回 403（Spring Security 已处理），不抛未处理异常。

## 6. 验证与提交

- [ ] 6.1 本地/CI 启动 admin 应用，curl 验证 6 个端点：200 正常体、403 无权限、404 不存在、400 缺时间区间。
- [ ] 6.2 提交到 `feature/datasource-expand-lineage-sql` 分支，commit message 按既有风格（`feat(oneapi): 新增文档导出与可观测性端点`）。
