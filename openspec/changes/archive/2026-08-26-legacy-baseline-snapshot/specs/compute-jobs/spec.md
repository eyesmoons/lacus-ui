# 能力基线：compute-jobs（批流计算任务域）

## Purpose

本能力域固化 Flink 与 Spark 计算任务模块的现状契约：任务定义列表、SQL/JAR 两类任务的创建编辑、生命周期操作（两引擎行为不同）、任务详情与实例管理。Flink 与 Spark 在同一 spec 内分别陈述，两者接口与操作差异是本基线重点。所有条目均为存量代码的实际行为描述。

## ADDED Requirements

### Requirement: Flink 任务定义管理

Flink 任务列表必须提供分页查询 GET /flink/job；删除 DELETE /flink/job/{jobId}（确认文案「是否确认删除任务名称为"x"的数据项?」）；SQL 任务创建按 jobType 分流——STREAMING_SQL 走 POST /flink/job/sql/streaming、BATCH_SQL 走 POST /flink/job/sql/batch，编辑对应 PUT 同路径；JAR 任务创建/编辑为 POST/PUT /flink/job/jar。另存在一组冗余通用 CRUD 函数（POST /flink/job、PUT /flink/job/{id}）与 getJob/getJobDetail 两个等价详情函数并存。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /flink/job | 任务分页 |
| POST | /flink/job/sql/streaming | 新建流式 SQL |
| PUT | /flink/job/sql/streaming | 编辑流式 SQL |
| POST | /flink/job/sql/batch | 新建批处理 SQL |
| POST | /flink/job/jar | 新建 JAR |
| PUT | /flink/job/jar | 编辑 JAR |
| GET | /flink/job/{jobId} | 详情 |
| DELETE | /flink/job/{jobId} | 删除 |
| GET | /flink/job/start/{jobId} | 启动 |
| GET | /flink/job/resume/{jobId} | 恢复 |
| GET | /flink/job/stop/{jobId} | 停止 |
| GET | /flink/job/pause/{jobId} | 暂停 |

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 新建流式 SQL 任务

- **WHEN** jobType 选「流式SQL」并提交
- **THEN** 请求发往 POST /flink/job/sql/streaming 而非 batch 端点

### Requirement: Flink 生命周期四操作

Flink 列表必须提供启动/恢复/停止/暂停四个操作，均为 GET 请求（start/resume/stop/pause），每个操作前弹确认框（文案模式「是否确认{动作}任务名称为"x"的任务?」），成功后提示「{动作}成功」并刷新列表。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 暂停再恢复流任务

- **WHEN** 对运行中的流式任务先暂停后恢复
- **THEN** 依次调 pause 与 resume 接口，列表状态随之流转

### Requirement: Spark 任务定义管理

Spark 任务列表必须提供分页查询 GET /spark/job、删除 DELETE /spark/job/{jobId}（ElMessageBox 确认「是否确认删除该任务?」）；SQL 任务仅 batch 一种：新建 POST /spark/job/sql/batch、编辑 PUT 同路径；JAR 任务 POST/PUT /spark/job/jar；API 层另声明 onlineJob/offlineJob（GET /spark/job/online/{jobId}、GET /spark/job/offline/{jobId}）上下线能力，但当前视图仅 import 了 pageList/removeJob/startJob/stopJob 四个函数——上下线接口处于"已封装未接线"状态。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /spark/job | 任务分页 |
| POST | /spark/job/sql/batch | 新建批 SQL |
| PUT | /spark/job/sql/batch | 编辑批 SQL |
| POST | /spark/job/jar | 新建 JAR |
| PUT | /spark/job/jar | 编辑 JAR |
| GET | /spark/job/{jobId} | 详情 |
| DELETE | /spark/job/{jobId} | 删除 |
| GET | /spark/job/start/{jobId} | 启动(已使用) |
| GET | /spark/job/stop/{jobId} | 停止(已使用) |
| GET | /spark/job/online/{jobId} | 上线(未接线) |
| GET | /spark/job/offline/{jobId} | 下线(未接线) |

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 上下线按钮缺失

- **WHEN** 打开 Spark 任务列表查找上线/下线操作
- **THEN** 不存在该操作入口（API 已有但页面未引用）

### Requirement: SQL 编辑器体验

Flink/Spark 的 SQL 任务表单必须内嵌 Monaco Editor：语言 sql、vs-dark 主题、worker 路径指向 `{origin}/monaco-editor/min/vs`（vite-plugin-monaco-editor 构建产物）；jobType 下拉区分流式/批处理（Flink 两项可选、Spark 仅批处理语义）；BATCH_SQL 类型展示附加配置卡片。CronTab 组件用于 Spark 表单的调度周期配置。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 编写批处理 SQL

- **WHEN** 选择 BATCH_SQL 类型
- **THEN** 出现批处理附加配置区且保存分流到 sql/batch 端点

### Requirement: 任务详情页

Flink 详情（GET /flink/job/{jobId}）与 Spark 详情（GET /spark/job/{jobId}）必须展示任务基础信息与运行配置；实例跳转入口位于各自列表页的实例菜单而非详情页强绑定。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 打开 Spark 任务详情

- **WHEN** 点击某 Spark 任务详情
- **THEN** 页面渲染该任务的引擎参数、SQL 内容等回显信息

### Requirement: 任务实例查询

Flink 实例必须提供 GET /flink/job/instance/list/paging 分页与 GET /flink/job/instance/{instanceId} 详情（路由 /flink/instance/detail/:instanceId）；Spark 实例提供同构的 GET /spark/job/instance/list/paging 与 /spark/job/instance/{instanceId}（路由 /spark/instance/detail/:instanceId）。实例页展示状态标签并可查看运行日志。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 查看 Flink 实例明细

- **WHEN** 从实例列表进入某条实例详情
- **THEN** 展示该次执行的引擎侧信息（日志地址/checkpoint 等以接口返回为准）

### Requirement: 双引擎路由重复定义

Spark 路由组中 path 'job' 存在两次重复注册（name 均为 SparkJob，一次在组头部、一次在 children 尾部），后注册者覆盖前者生效；该现状不影响功能但属于结构性隐患，后续调整路由时需一并留意。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 解析 SparkJob 路由名

- **WHEN** 以 name: 'SparkJob' 进行路由跳转
- **THEN** 命中后注册的同名记录解析成功，无报错但存在维护歧义
