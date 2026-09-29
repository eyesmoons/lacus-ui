## Purpose

后端按 apiIds 批量读取 `one_api_info` 及其 `apiConfig`，渲染为结构化 Markdown 文档（元信息/请求参数/响应参数/示例），并以 `text/markdown` 流式返回前端下载。该服务是前端「接口文档导出」入口的后端支撑，仅做读取与渲染，不持久化文档。

## ADDED Requirements

### Requirement: 按 apiIds 批量渲染 Markdown 文档
后端 SHALL 接收 `apiIds` 列表，逐条读取 `one_api_info` 并将每条接口渲染为 Markdown 片段后拼接为完整文档返回。

#### Scenario: 正常批量导出
- **WHEN** 前端请求 `GET /one/api/export?apiIds=1,2,3` 且所有 apiId 均存在
- **THEN** 后端返回 HTTP 200，Content-Type 为 `text/markdown`，正文为包含 3 个接口章节的 Markdown 文档

#### Scenario: 部分 apiId 不存在
- **WHEN** 前端请求 `GET /one/api/export?apiIds=1,99999` 且 99999 不存在
- **THEN** 后端跳过不存在的 apiId，仅渲染存在的接口，不因此返回错误

#### Scenario: apiIds 为空
- **WHEN** 前端请求 `GET /one/api/export` 且未传 apiIds（或为空串）
- **THEN** 后端返回 400 或空文档（不含任何接口章节），不抛出未处理异常

### Requirement: 文档结构包含元信息/请求参数/响应参数/示例
后端渲染的每个接口章节 SHALL 包含：接口名、URL、请求方式、请求参数表、响应参数表、请求示例。

#### Scenario: apiConfig 可解析
- **WHEN** 某接口的 `api_config` 字段为合法 JSON 且含请求/响应参数定义
- **THEN** 渲染出的 Markdown 包含该接口的请求参数表与响应参数表（字段名、类型、说明）

#### Scenario: apiConfig 为空或非法
- **WHEN** 某接口的 `api_config` 为空串或非 JSON
- **THEN** 该接口章节仍渲染元信息，请求/响应参数表位置显示"暂无参数信息"，不中断整个文档渲染

### Requirement: 权限与传输约定
导出端点 SHALL 校验 `oneapi:doc:export` 权限，并以附件形式下发。

#### Scenario: 无权限访问
- **WHEN** 请求用户不具备 `oneapi:doc:export` 权限
- **THEN** 后端返回 403，不返回文档内容

#### Scenario: 响应头携带文件名
- **WHEN** 合法请求成功渲染文档
- **THEN** 响应头包含 `Content-Disposition: attachment; filename="接口文档.md"`（或同类文件名），触发浏览器下载
