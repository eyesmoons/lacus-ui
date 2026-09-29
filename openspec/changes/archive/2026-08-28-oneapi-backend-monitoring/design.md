## Context

前端变更 `oneapi-docs-monitoring` 已新增文档导出与可观测性三页（API监控/统计/调用历史），消费 6 个后端端点。当前 admin 侧（`lacus-admin/lacus-service/lacus-dao/lacus-domain`）并无 `one_api_call_history` 的读模型，该表仅在运行时应用 `lacus-one-api-app` 写入。本变更在 admin 侧补齐读模型与 6 个只读端点。

现有 OneAPI 端点挂在 `OneApiInfoController`（`/one/api`），聚合编排放在 `OneApiMonitorBusiness`（`lacus-domain`），持久化遵循 `IService/ServiceImpl/BaseMapper`，响应统一 `ResponseDTO<T>` / `PageDTO{rows,total}`，权限用 `@PreAuthorize("@permission.has('xxx')")` SpEL。

详见 proposal.md（Why / What）与 specs（行为契约）。

## Goals / Non-Goals

**Goals:**
- 在 admin 侧建立 `one_api_call_history` 读模型（Entity/Mapper/Service），不改运行侧表结构与写入逻辑。
- 新增 6 个只读端点：`/one/api/export`、`/one/api/monitor/overview`、`/one/api/stats/summary`、`/one/api/stats/trend`、`/one/api/history/paging`、`/one/api/history/{callId}`。
- 沿用既有响应包装、分页、权限约定，前端无需为这批端点特殊适配。

**Non-Goals:**
- 不改 `OneApiInfoController` 既有方法、不改 `one_api_info` / `one_api_call_history` 表结构。
- 不实现文档持久化（导出为即时渲染，不落库）。
- 不引入独立 OLAP / 时序库，聚合走关系库 SQL。
- 不实现告警、SLO、订阅等运行时可观测性能力（属后续独立变更）。

## Decisions

### D1：admin 侧读模型分层
- **Entity** `OneApiCallHistoryEntity`（`lacus-dao`）映射 `one_api_call_history` 全部查询字段：`historyId`、`callDate`、`callIp`、`apiUrl`、`callStatus`、`callCode`、`errorInfo`、`callDelay`、`callTime`。
- **Mapper** `OneApiCallHistoryMapper`（`lacus-dao`）提供：条件分页、聚合统计（SUM/COUNT/AVG）、P95 耗时取值、时间分桶趋势。
- **Service** `IOneApiCallHistoryService` + `OneApiCallHistoryServiceImpl`（`lacus-service`）封装查询。
- **Business** `OneApiMonitorBusiness`（`lacus-domain`）编排：调用 History Service + Info Service，组装 `MonitorOverviewDTO` / `StatsSummaryDTO` / `StatsTrendDTO` / `HistoryRowDTO`。
- **Controller** 在现有 `OneApiInfoController` 追加 6 个方法，复用 `/one/api` 前缀。

> 替代方案：新建 `OneApiMonitorController`。否决：端点与 `/one/api` 前缀天然同域，且监控/统计/历史仍属 OneAPI 业务域，复用 Controller 更紧凑，避免为只读聚合单独开控制器。

### D2：关联键选用 `api_url`
`one_api_call_history.api_url = one_api_info.api_url` 作为关联键（两表均已含该字段）。聚合时按 `api_url` 分组后 JOIN `one_api_info` 取 `apiName`、`reqMethod`。

> 替代方案：要求前端传 `apiId` 过滤。否决：运行侧历史表未存 `api_id`，改表结构属运行侧变更，不在本变更范围。

### D3：时间分桶跨库兼容（MySQL/PostgreSQL）
趋势桶标签用 `DATE_FORMAT(call_time, pattern)`（MySQL）/`TO_CHAR(call_time, pattern)`（PG）。通过 MyBatis `DatabaseIdProvider` 按 `bucket` 参数（`HOUR`/`DAY`/`WEEK`）切换表达式；Service 层据区间长度自动选桶粒度（≤24h 小时、≤7d 天、否则周）。

> 替代方案：用 `<if test="dbType == 'PG'">` SQL 分支。否决：单 mapper 文件多分支可读性差；DatabaseIdProvider 是 MyBatis 标准能力，集中管理方言更清晰。

### D4：P95 耗时计算
聚合 SQL 返回某 `api_url` 组内有序 `callDelay` 列表（`ORDER BY call_delay ASC`），Java 取第 `ceil(0.95*N)-1` 个元素。数据量小（单接口单区间通常 <10 万行），内存排序可接受；若后续放量，再改 `PERCENTILE_CONT`。

### D5：导出渲染在 Service 层
`exportApiDoc(apiIds)` 在 `OneApiMonitorBusiness` 内：逐条取 `OneApiInfoEntity` → 解析 `apiConfig` JSON → 渲染 Markdown 字符串 → 拼接。`apiConfig` 解析失败时该节显示"暂无参数信息"，不中断整体。Controller 以 `ResponseEntity<byte[]>` 返回，Header `Content-Type: text/markdown`、`Content-Disposition: attachment; filename="api-docs.md"`。

### D6：DTO 命名
- `MonitorOverviewItemDTO`（单接口聚合行） / `MonitorOverviewDTO`（含 `rows`、`total`）
- `StatsSummaryDTO`（`totalCount`、`successCount`、`failCount`、`avgCost`、`topApis`） / `TopApiDTO`
- `StatsTrendDTO`（含 `buckets`） / `TrendBucketDTO`（`time`、`callCount`、`avgCost`、`failCount`）
- `HistoryRowDTO`（列表行） / `HistoryDetailDTO`（详情，含 `requestBody`、`responseSummary`、`errorMessage`）

### D7：权限注解
- `/one/api/export` → `@PreAuthorize("@permission.has('oneapi:doc:export')")`
- `/one/api/monitor/overview` → `oneapi:monitor:view`
- `/one/api/stats/summary`、`/one/api/stats/trend` → `oneapi:stats:view`
- `/one/api/history/paging`、`/one/api/history/{callId}` → `oneapi:history:view`

## Risks / Trade-offs

- **[性能] 全表扫描风险** → 强制 `history/paging` 与聚合端点要求 `startTime`/`endTime`（参数校验 `@NotEmpty` 或默认近 24h），命中 `call_time` 索引。
- **[兼容] 多方言 SQL** → 通过 `DatabaseIdProvider` + 集成测试覆盖 MySQL 与 PG。
- **[容量] P95 内存排序** → 当前规模可接受；放量后改 `PERCENTILE_CONT` 或预聚合。
- **[编码] 中文文件名** → 导出用 ASCII 文件名 `api-docs.md`，避免 `filename*` 编码兼容问题。
- **[一致性] 历史表只读** → admin 侧不写 `one_api_call_history`，避免与运行侧写入冲突。

## Migration Plan

1. 合并本变更代码到 `feature/datasource-expand-lineage-sql` 分支。
2. 部署 admin 应用，确认 6 个端点 200/403 正常。
3. 同步菜单权限：`sys_menu` 已含 `oneapi:monitor:view`/`oneapi:stats:view`/`oneapi:history:view`/`oneapi:doc:export` 四条权限（见前端变更 SQL），为对应角色分配权限。
4. 回滚：admin 应用回滚即可，本变更未改表结构与运行侧逻辑，无数据迁移需回退。

## Open Questions

- `api_config` JSON 的具体 schema（请求/响应参数结构）待前端与既有数据样本确认，影响导出渲染字段映射（见 spec「apiConfig 可解析」场景，非法时已有兜底）。
- 是否需要对 `one_api_call_history` 加索引（`call_time`、`api_url`）—— 若运行时侧未建，由 DBA 评估，不在本变更 SQL 内（避免动运行侧表）。
