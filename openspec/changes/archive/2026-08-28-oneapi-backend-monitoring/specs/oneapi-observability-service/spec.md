## Purpose

后端基于运行时写入的 `one_api_call_history` 表，在 admin 侧提供调用历史读模型与聚合能力：监控概览（各接口调用次数/成功/失败/错误率/耗时分位）、统计概览（总量/成功率/Top10/平均耗时）、统计趋势（按时间分桶）、调用历史分页与详情。该服务是前端「API监控/统计/调用历史」三页的后端支撑，所有端点只读不改运行侧数据。

## ADDED Requirements

### Requirement: 监控概览聚合
后端 SHALL 按时间区间聚合各接口的调用次数、成功数、失败数、错误率、平均耗时与 P95 耗时。

#### Scenario: 按时间区间查询
- **WHEN** 前端请求 `GET /one/api/monitor/overview` 并携带 `startTime`/`endTime`
- **THEN** 后端仅统计 `one_api_call_history` 中 `call_time` 落在该区间内的记录，返回各接口聚合行

#### Scenario: 聚合口径
- **WHEN** 区间内某接口有 100 条记录，其中 5 条 `call_status` 为失败
- **THEN** 该行返回 `callCount=100`、`successCount=95`、`failCount=5`、`errorRate=0.05`，`callDelay` 字段用于计算 `avgCost` 与 `p95Cost`

#### Scenario: 无数据区间
- **WHEN** 区间内无任何调用记录
- **THEN** 后端返回空列表（`rows: []`、`total: 0`），不返回 404

#### Scenario: 错误率不后端标红
- **WHEN** 某接口错误率超过 5%
- **THEN** 后端仅返回数值 `errorRate>0.05`，不在响应中携带"标红"标记（标红由前端按阈值渲染）

### Requirement: 统计概览
后端 SHALL 返回调用总量、成功率、平均耗时、失败次数及 Top10 接口列表。

#### Scenario: 统计概览聚合
- **WHEN** 前端请求 `GET /one/api/stats/summary` 并携带时间区间
- **THEN** 返回 `totalCount`、`successCount`、`failCount`、`avgCost`，以及按 `callCount` 降序取前 10 的 `topApis`（每项含 `apiName`、`callCount`、`errorRate`）

#### Scenario: 成功率计算
- **WHEN** `totalCount>0`
- **THEN** 成功率 = `successCount / totalCount`（前端展示为百分比，后端返回计数即可）

### Requirement: 统计趋势按时间分桶
后端 SHALL 按时间区间与自动粒度返回调用次数、平均耗时、错误数的时间序列。

#### Scenario: 自动分桶粒度
- **WHEN** 前端请求 `GET /one/api/stats/trend` 携带 `startTime`/`endTime`，未传 `bucket`
- **THEN** 后端按区间长度自动选择桶粒度：≤24 小时按小时、≤7 天按天、否则按周

#### Scenario: 趋势返回结构
- **WHEN** 区间内按小时分桶
- **THEN** 返回 `buckets` 数组，每项含 `time`（桶标签）、`callCount`、`avgCost`、`failCount`

### Requirement: 调用历史分页
后端 SHALL 按时间区间/接口/状态分页查询 `one_api_call_history`，并关联 `one_api_info` 补全接口名与请求方式。

#### Scenario: 分页查询
- **WHEN** 前端请求 `GET /one/api/history/paging` 携带 `pageNum=1`、`pageSize=10`、`startTime`、`endTime`
- **THEN** 返回 `rows`（每项含 `callId`、`apiName`、`reqMethod`、`callStatus`、`callDelay`、`callIp`、`callTime`）与 `total`

#### Scenario: 关联键
- **WHEN** 关联 `one_api_info`
- **THEN** 通过 `one_api_call_history.api_url = one_api_info.api_url` 进行关联，补全 `apiName` 与 `reqMethod`

#### Scenario: 按状态过滤
- **WHEN** 前端传入 `status=success`
- **THEN** 后端仅返回 `call_status` 为成功的记录

#### Scenario: 时间区间必填
- **WHEN** 未传 `startTime` 或 `endTime`
- **THEN** 后端返回 400 或默认取最近 24 小时（以参数校验注解为准），不扫描全表

### Requirement: 调用详情
后端 SHALL 按 `callId` 返回单次调用的入参、响应摘要与错误信息。

#### Scenario: 详情查询
- **WHEN** 前端请求 `GET /one/api/history/{callId}` 且记录存在
- **THEN** 返回 `requestBody`、`responseSummary`、`errorMessage`（失败时非空）及关联的 `apiName`

#### Scenario: callId 不存在
- **WHEN** 请求的 `callId` 在表中不存在
- **THEN** 后端返回 404 或空 data，不抛出未处理异常

### Requirement: 权限约定
所有可观测性端点 SHALL 按职责校验对应权限。

#### Scenario: 监控/统计/历史权限分离
- **WHEN** 请求 `monitor/overview` / `stats/summary` / `stats/trend` / `history/paging` / `history/{callId}`
- **THEN** 分别校验 `oneapi:monitor:view`、`oneapi:stats:view`、`oneapi:history:view`，不具备则返回 403

### Requirement: 响应形状沿用既有约定
所有端点 SHALL 沿用 `ResponseDTO<T>` 包装，分页沿用 `PageDTO{rows,total}`。

#### Scenario: 分页响应
- **WHEN** 调用 `history/paging`
- **THEN** 响应体为 `ResponseDTO<PageDTO<HistoryRowDTO>>`，`code=0`，`data.rows`、`data.total` 可用

#### Scenario: 聚合响应
- **WHEN** 调用 `monitor/overview` 或 `stats/summary`
- **THEN** 响应体为 `ResponseDTO<MonitorOverviewDTO>` / `ResponseDTO<StatsSummaryDTO>`，结构扁平可直用
