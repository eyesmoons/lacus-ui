# 能力基线：ops-monitor（监控运营域）

## Purpose

本能力域固化监控运营模块的现状契约：在线用户、缓存监控、Druid 入口、登录/操作日志、服务器监控、告警管理（渠道实例/告警组/告警记录/任务日志）的页面业务流程、全部接口定义与异常分支。所有条目均为存量代码的实际行为描述。

## Requirements

### Requirement: 在线用户管理

在线用户页必须提供分页查询 GET /monitor/onlineUser/list（条件含 ipaddr、userName）与强制退出 DELETE /monitor/onlineUser/{tokenId}；强退需确认，成功后刷新列表。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 强制下线会话

- **WHEN** 管理员对某在线会话点击强退并确认
- **THEN** 该用户的 Token 会话被服务端销毁，其下一次请求触发 20101 重新登录流程

### Requirement: 缓存监控

缓存监控页必须调用 GET /monitor/cacheInfo 展示 Redis 运行信息：redis 版本等基础信息、dbSize 键总数、info 指令返回的各段解析（内存、统计等），以信息卡片/表格形式只读呈现。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 查看缓存状态

- **WHEN** 进入缓存监控页
- **THEN** 页面展示当前 Redis 的版本、键数量与关键 info 指标

### Requirement: Druid 监控入口

Druid 监控菜单以 iframe 内嵌方式打开 `{VITE_APP_BASE_API}/druid/login.html`（iFrame 组件承载），即直接复用后端 Druid 自带控制台页面。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 打开 Druid 监控

- **WHEN** 点击侧边栏 Druid 监控菜单
- **THEN** 内容区渲染 iframe 指向后端 /druid/login.html，由 Druid 自己的登录页接管

### Requirement: 登录日志

登录日志必须提供分页查询 GET /loginInfo/list（条件含 ipaddr、status、时间范围）；详情 GET /loginInfo/{infoId}；单条删除 DELETE /loginInfo/{infoId} 与全量清空 DELETE /loginInfo/clean——清空前必须弹确认框，防止误清全部审计记录。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 清空登录日志

- **WHEN** 点击清空按钮并确认
- **THEN** 全部登录日志被删除且列表刷新为空

### Requirement: 操作日志

操作日志必须提供分页查询 GET /operationLog/list（条件含系统模块、操作人员、类型、状态、时间范围）；详情 GET /operationLog/{operationId}（展示请求参数/返回结果等 JSON 明细）；单条删除 DELETE /operationLog/{operationId} 与全量清空 DELETE /operationLog/clean（确认弹窗同登录日志）。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 查看异常操作明细

- **WHEN** 点击某条失败状态的日志查看详情
- **THEN** 弹窗展示该次操作的完整请求参数与异常报文

### Requirement: 服务器监控

服务器监控必须调用 GET /monitor/serverInfo 只读展示：CPU 相关（核心数、使用率）、内存、JVM 内存、系统信息、磁盘等分组卡片。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 查看服务器负载

- **WHEN** 进入服务器监控页
- **THEN** 展示实时 CPU/内存/JVM/磁盘占用信息卡片

### Requirement: 告警渠道实例管理

告警渠道实例管理必须提供：渠道类型下拉 GET /monitor/alert/channelType/list；实例分页 GET /monitor/alert/channelInstance/list；新增/编辑表单按所选渠道类型的 schema 动态渲染配置项（SchemaForm 组件），提交 POST/PUT /monitor/alert/channelInstance；删除 DELETE /monitor/alert/channelInstance/{ids}；发送测试 POST /monitor/alert/channelInstance/test（向配置的目标发送测试消息并回显结果）；下拉选项 GET /monitor/alert/channelInstance/options 供告警组引用。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 配置钉钉渠道并发送测试

- **WHEN** 选择渠道类型后按动态 schema 填写 webhook 等参数，先点「测试」再保存
- **THEN** test 接口实际发出一条测试消息并提示成功/失败，保存后该实例可被告警组选用

### Requirement: 告警组管理

告警组管理必须提供：分页 GET /monitor/alert/group/list；CRUD（GET /monitor/alert/group/{id}、POST/PUT /monitor/alert/group、DELETE /monitor/alert/group/{ids}）；组成员从渠道实例 options 中多选；下拉 GET /monitor/alert/group/options 供任务配置引用。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 创建告警组

- **WHEN** 新建告警组并勾选多个通知渠道实例保存
- **THEN** 列表新增该组，任务告警配置中可选择此组

### Requirement: 告警记录处理

告警记录页必须提供分页 GET /monitor/alert/record/list（按级别/状态过滤）；详情 GET /monitor/alert/record/{id}；手动执行 POST /monitor/alert/record/execute（body 指定记录立即重新投递）；失败重试 POST /monitor/alert/record/{id}/retry；按任务维度查日志 GET /monitor/alert/task/{taskId}/log/list。首页工作台的「最近告警」列表同样消费 record 数据源。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 重试失败的告警

- **WHEN** 对某条 FAILED 记录点击重试并成功
- **THEN** 该记录状态流转为已重试/成功态并刷新列表

### Requirement: 监控域权限规律

监控模块按钮权限串遵循 `<模块>:<资源>:<动作>` 格式（如 monitor:onlineUser:forceLogout 类），日志清空类高危动作同时依赖前端确认弹窗与后端权限双重拦截。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 无强退权限

- **WHEN** 无对应权限的用户打开在线用户页
- **THEN** 强退按钮不渲染，仅可查询
