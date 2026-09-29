# 能力基线：oneapi-domain（统一 API 域）

## Purpose

本能力域固化统一 API（OneAPI，SQL 即服务）模块的现状契约：API 定义列表、四步创建向导（基本信息→SQL 配置→请求参数→API 测试）、编辑回显、上下线状态机与离线/在线调试。所有条目均为存量代码的实际行为描述。

## Requirements

### Requirement: API 定义列表

API 列表必须提供分页查询 GET /one/api/list/paging；删除 DELETE /one/api/{apiIds}；状态标签区分已发布/未发布；行操作提供编辑、详情、上线/下线入口。上述行为 **MUST** 视为基线契约。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /one/api/list/paging | 分页列表 |
| GET | /one/api/{apiId} | 详情 |
| POST | /one/api | 新建 |
| PUT | /one/api | 更新 |
| DELETE | /one/api/{apiIds} | 删除 |
| POST | /one/api/parse | SQL 解析 |
| GET | /one/api/colTypeList | 结果列类型映射 |
| POST | /one/api/test | 离线测试 |
| POST | /one/api/test/online | 在线测试 |
| GET | /one/api/updateStatus | 上下线(GET) |

#### Scenario: 批量删除 API

- **WHEN** 勾选多条 API 点击删除并确认
- **THEN** DELETE 携带逗号分隔的 apiIds 提交后刷新列表

### Requirement: 四步创建向导

新建向导必须按 el-steps 四步推进：
1. **基本信息**：填写接口名称/路径等基础定义；
2. **SQL 配置**：选择数据源并编写 SQL；
3. **请求参数**：POST /one/api/parse 解析 SQL 生成参数与结果列清单，结果列类型经 GET /one/api/colTypeList 映射可选类型，配置分页参数；
4. **API 测试**：POST /one/api/test 离线执行，响应中 data 以 JSON.parse(res.data).list 形态解析展示。

编辑复用同一向导（edit.vue），回显时将 apiConfig JSON 字符串解析还原各步内容。上述流程 **MUST** 视为基线契约。

#### Scenario: 编辑回显配置

- **WHEN** 从列表进入某 API 的编辑向导
- **THEN** 四步内容按 detail 返回的 apiConfig 还原，可直接下一步提交 PUT 更新

#### Scenario: 新建向导推进

- **WHEN** 依次完成四步并保存
- **THEN** POST /one/api 成功后返回列表且新 API 以未发布状态出现

#### Scenario: 解析生成参数

- **WHEN** 第二步填好 SQL 进入第三步
- **THEN** parse 接口返回的 WHERE 参数与 SELECT 结果列自动填充参数表

### Requirement: 状态机与在线调试

API 的发布控制必须走 GET /one/api/updateStatus（id/status 参数形式）完成上线/下线切换；已发布的 API 可在详情页发起在线调试 POST /one/api/test/online（携带实际请求参数返回真实数据）；离线 test 与在线 test/online 的结果区均以表格/JSON 展示。该状态机 **MUST** 视为基线契约。

#### Scenario: 上线前先离线调试

- **WHEN** 新建 API 在第四步完成离线测试通过后保存
- **THEN** 通过 updateStatus 将其置为上线态，之后可在详情用在线测试验证真实链路

### Requirement: 编辑保护

编辑向导必须基于 detail 回显完整 apiConfig 后才允许提交 PUT /one/api；apiConfig 解析失败时不得静默丢失既有配置。该保护行为 **MUST** 视为基线契约。

#### Scenario: 配置解析异常时的编辑

- **WHEN** 某 API 的 apiConfig 无法正常 JSON 解析
- **THEN** 编辑流程不携带损坏配置静默提交，用户可感知异常并重新处理
