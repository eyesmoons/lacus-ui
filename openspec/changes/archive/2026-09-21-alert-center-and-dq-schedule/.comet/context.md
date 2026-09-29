# Comet Design Handoff

- Change: alert-center-and-dq-schedule
- Phase: design
- Mode: compact
- Context hash: c06d91fd99de1feeed17e2b940b5d669bcd6d3996269f270a49847a0757c442d

Generated-by: comet-handoff.sh
Task hash policy: task-content-v1. Read tasks.md for live completion; excerpts are design-time context.

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/alert-center-and-dq-schedule/proposal.md

- Source: openspec/changes/alert-center-and-dq-schedule/proposal.md
- Lines: 1-45
- SHA256: 7b718caee3d2b8787533e655faf6da660a6597c9b29cbdf7d40b4b4fcd50713b

```md
# 提案：alert-center-and-dq-schedule（告警中心与数据质量调度后端补齐）

## Why

前端已完成完整的告警中心（`src/views/monitor/alert/*`，19 个接口调用）与数据质量调度（`src/views/dataquality/schedule/*`，11 个接口调用）页面，但后端 lacus 仓库中这两个域**完全不存在**——无任何 Controller，无 `dq_schedule` 表，全分支全历史零命中。页面目前只能通过 URL 到达且全部 404/空数据，属于"表面完成、实际不可用"的功能。本轮商用就绪度评估将这两项列为最高优先级待补功能，本 change 一次性补齐。

## What Changes

新增后端能力（均在 `lacus` 仓库），契约严格对齐前端既有调用签名：

- **告警中心**：
  - 新增 5 张表：告警渠道类型、告警渠道实例、告警组、告警记录、告警任务日志
  - 新增 `AlertController`（channelType / channelInstance / group / record / task-log 五组端点，共 19 个）
  - 渠道类型以 `configSchema` JSON 驱动前端 `SchemaForm` 动态表单；本期预置 **邮箱 SMTP** 与 **Webhook** 两类
  - 发送实现：邮箱走 JavaMail（SMTP），Webhook 走 hutool `HttpUtil` POST JSON（兼容钉钉/飞书/企微自定义机器人格式）
  - 支持手动触发告警（`record/execute`）、失败重试（`record/{id}/retry`）、发送任务日志查询
- **数据质量调度**：
  - 新增 `dq_schedule` 表（ruleId、cronExpression、misfirePolicy、concurrent、status）
  - 复用现有 Quartz 基础设施（`ScheduleUtils` + `invoke_target=ruleExecuteJob` 模式，`JobInvokeUtil` 已预留 `ruleExecuteJob` 特判），与 `sys_job` 同轨
  - 新增 `DqScheduleController`（list/get/POST/PUT/DELETE/pause/resume/run/rules/cron-validate/alert-groups 共 11 个端点）
  - `run` 立即触发一次 `DqTaskBusiness.submitTask(ruleId)`；`pause/resume` 操作 Quartz trigger
  - `cron-validate` 后端强校验 Cron 表达式（以 `cron-parse`/Quartz `CronExpression.isValidExpression` 为准）
- **补列**：`dq_rule` 表新增 `alert_group_code` 列（前端 rule form 已在提交该字段，后端无落库列）
- **DDL**：所有新表 DDL 追加至 `sql/lacus.sql`

无破坏性变更（**BREAKING**: 无）。

## Capabilities

### New Capabilities

- `alert-center`：告警中心后端能力——渠道类型契约（configSchema 与发送实现）、渠道实例管理、告警组管理、告警记录（手动触发/重试）、发送任务日志。
- `dq-schedule`：数据质量调度能力——规则的 Quartz 定时执行配置（增删改查/暂停/恢复/立即运行），Cron 校验，告警组选项跨域读取。

### Modified Capabilities

（无——`dq_rule.alert_group_code` 补列属于 `dataquality-domain` 现有数据模型的小幅扩展，随本 change 落地，不单独立 capability。）

## Out of Scope（非目标）

- DQ 执行结果 → 自动告警联动（执行失败自动向告警组发消息）——本期不做，告警记录仅支持手动触发与重试
- `sys_menu` 菜单项与前端权限串（`v-hasPermission`/`@PreAuthorize`）注册——两个页面当前不在侧边栏，本期只把接口做通
- 钉钉/飞书/企微的专属签名渠道（加签、抖动）——本期 Webhook 是通用 JSON POST
- 短信、PagerDuty 等其他渠道类型
- 邮件 HTML 模板管理

```

## openspec/changes/alert-center-and-dq-schedule/design.md

- Source: openspec/changes/alert-center-and-dq-schedule/design.md
- Lines: 1-100
- SHA256: ad0b96436d392bb946409aa479cdfa417f313496dd140210e80cc2c1fb661833

[TRUNCATED]

```md
# 设计：alert-center-and-dq-schedule

## Context

前端两个域的接口契约已实测抓取（`alertApi.js` 19 个调用、`scheduleApi.js` 11 个调用，字段名与枚举值均已核对），后端 `lacus`（Maven 多模块：admin / common / core / dao / domain / service）已有成熟的分层模式与 Quartz 基础设施。契约以前端为准实现，后端不再另行定义字段名。

可复用的现成基建：
- Quartz 全套：`QRTZ_*` 表已建，`ScheduleUtils`/`AbstractQuartzJob`/`JobInvokeUtil` 现成；**`JobInvokeUtil` 已有 `ruleExecuteJob` 特判**（自动追加 jobId 参数），原设计即预留了 DQ 走 Quartz 的入口
- Controller 模板：`TableController` / `DatasourceController` 的 `ResponseDTO`/`PageDTO`/`@PreAuthorize`/`@Api` 写法
- MyBatis-Plus 实体/Mapper 模式（`lacus-dao`）
- HTTP 客户端：hutool 5.8.25 `HttpUtil`
- 全局异常：`GlobalExceptionHandler` 统一 ResponseDTO 包装

## Goals / Non-Goals

**Goals:**
- 30 个前端调用全部有契约一致的后端端点
- 告警发送真实可达（邮箱 SMTP + Webhook JSON POST）
- DQ 调度与 sys_job 同轨（Quartz），运维口径统一
- 数据模型支撑重试与任务级日志追溯

**Non-Goals:**
- DQ 执行结果 → 自动告警联动
- sys_menu 菜单与权限串注册
- 渠道类型的加签/专属协议（钉钉 sign 等）
- 邮件 HTML 模板管理

## Decisions

### D1. 表结构（6 张新表 + 1 列补丁）

| 表 | 用途 | 关键列 |
|---|---|---|
| `alert_channel_type` | 渠道类型字典 | `id, type_code(唯一), type_name, config_schema(longtext), enabled` |
| `alert_channel_instance` | 渠道实例 | `id, instance_name, channel_type_id(FK), channel_type_code(冗余快照), config(longtext JSON), enabled, description` |
| `alert_group` | 告警组 | `id, group_code(唯一), group_name, description, enabled` |
| `alert_group_member` | 组-实例映射 | `id, group_id, instance_id`（唯一键 group+instance） |
| `alert_record` | 告警记录 | `id, record_no(唯一, 业务流水), biz_key, group_code, alert_level, title, content, status, trigger_source(MANUAL/SCHEDULE/METRIC), requested_by, requested_time, finished_time, error_message, task_summary(冗余统计), create_time` |
| `alert_task` | 发送任务 | `id, record_id(FK), task_no(唯一), instance_id, instance_name, channel_type_code, status, retry_count, last_error, create_time` |
| `alert_task_log` | 任务日志 | `id, task_id(FK), attempt_no, success, cost_ms, error_message, request_payload, response_payload, create_time` |
| `dq_schedule` | DQ 调度 | `id, job_name, rule_id(唯一), cron_expression, misfire_policy, concurrent, status('0'正常/'1'暂停), deleted, creator_id/updater_id/time, remark` —— 列名对齐 `sys_job` 既有约定 |
| `dq_rule` 补列 | 告警绑定 | `alert_group_code varchar(64) NULL` |

`record.status` 枚举：`RUNNING/SUCCESS/PARTIAL_SUCCESS/FAILED/RETRYING`（前端 recordStatusOptions 的枚举键需以后端实现为准对齐——前端本地字典已含全部枚举值，逐一核对后取交集实现）。

### D2. 模块归属

- Controller：`lacus-admin/.../controller/monitor/AlertController.java`、`.../controller/dataquality/DqScheduleController.java`
- Business/编排：`lacus-domain/.../alert/AlertBusiness.java`（含 `AlertSender` 策略分派）、`.../dataquality/DqScheduleBusiness.java`
- Service/基础设施：`lacus-service/.../alert/SenderRegistry.java`（typeCode → sender 实现映射，SPI 风格注册）、`MailAlertSender`、`WebhookAlertSender`
- Entity/Mapper：`lacus-dao/.../alert/*`、`.../dataquality/DqScheduleEntity`
- DDL：追加到 `sql/lacus.sql`

### D3. 发送器策略（strategy per typeCode）

`AlertSender` 接口：`String typeCode(); SendResult send(AlertChannelInstanceEntity instance, String title, String content);`
- `MailAlertSender`：JavaMail，SMTP host/port/账户/密码/SSL 来自实例 config；本期直接用 `jakarta.mail`（Spring Boot mail starter，按需补依赖到 `lacus-service`）单实例 session 发送
- `WebhookAlertSender`：hutool `HttpUtil.post(url, jsonBody, timeout)`，通用 `{title, content}` JSON body（兼容钉钉/飞书/企微的自定义机器人最小格式；加签类协议不做）
- 发送失败**永不抛异常**——包装为 `SendResult{success=false, errorMessage,responseSummary}`，保障测试端点的结构化契约

测试发送（草稿态，无 instanceId）直接以传入 config 构造临时实例对象走同一发送器。

### D4. 调度引擎接入（复用 Quartz）

- `dq_schedule.registered` 后调用 `ScheduleUtils.createScheduleJob` 同款流程：`invoke_target = "ruleExecuteJob.executeRule(<ruleId>)"`（bean 名对齐 `JobInvokeUtil` 已有的 `ruleExecuteJob` 特判；jobId 自动追加）
- 新增 `RuleExecuteJobTarget` Bean（方法 `executeRule(Long ruleId, Long jobId)`）：按 ruleId 调 `DqTaskBusiness.submitTask(ruleId)`（复用手动提交链路），执行结果不回写告警（非目标）
- `pause/resume` 直接操作 Scheduler（`pauseJob`/`resumeJob`，参考 `SysJobServiceImpl` 现有写法）；`run` 即 `scheduler.triggerJob` 或直接调 `submitTask`
- `cron-validate` 用 `org.quartz.CronExpression.isValidExpression`，返回 `{valid, message}`
- 删除走 `scheduler.deleteJob` + 逻辑删除行

### D5. record/execute 的聚合语义

`executeAlert(groupCode, alertLevel, title, content, ...)` 同步创建 record + N 个 task，逐个发送并即时写 task/log，完成后按结果聚合更新 record.status 与 task_summary；单次 HTTP 等待（组内实例通常 ≤ 5，每任务 Webhook 5s 超时，可接受同步）。`retry` 针对原记录中失败的任务追加尝试。

### D6. 唯一性守卫

- `alert_group.group_code` 唯一（服务层校验 + DB 唯一索引双保险）
- `alert_channel_type.type_code` 唯一
- `dq_schedule.rule_id` 唯一（服务层校验 + 唯一索引）
- 删除被组引用的 channel instance：**阻止删除并提示**（比级联删除明确、可验证）

```

Full source: openspec/changes/alert-center-and-dq-schedule/design.md

## openspec/changes/alert-center-and-dq-schedule/tasks.md

- Source: openspec/changes/alert-center-and-dq-schedule/tasks.md
- Lines: 1-47
- SHA256: 9c1ebe32378972c76a20cfef5d03bac514f9399db1b131568c65afaf7130fc8f

```md
# 任务：alert-center-and-dq-schedule

> 全部改动落在后端仓库 `/Users/casey/workspace/lacus`（本 change 的前端产物仅限 openspec 目录文档）。
> 验收原则：每个端点完成后与前端的调用签名逐字段比对；实现顺序按任务号。

## 1. 数据层

- [ ] 1.1 `sql/lacus.sql` 追加 8 张新表 DDL（alert_channel_type / alert_channel_instance / alert_group / alert_group_member / alert_record / alert_task / alert_task_log / dq_schedule），列与 design.md D1 一致；追加 `dq_rule` 的 `alert_group_code` 补列 ALTER 注释块
- [ ] 1.2 `lacus-dao` 新增 `com.lacus.dao.alert` 包：AlertChannelTypeEntity/Mapper、AlertChannelInstanceEntity/Mapper、AlertGroupEntity/Mapper、AlertGroupMemberEntity/Mapper、AlertRecordEntity/Mapper、AlertTaskEntity/Mapper、AlertTaskLogEntity/Mapper（MyBatis-Plus 模式，与 `MetaTableEntity` 同风格）
- [ ] 1.3 `lacus-dao` 新增 `DqScheduleEntity/Mapper`（`com.lacus.dao.dataquality` 包下）

## 2. 域层（lacus-domain）

- [ ] 2.1 `com.lacus.domain.alert.query` 包：ChannelInstanceQuery / GroupQuery / RecordQuery（含 pageNum/pageSize/keyword/状态等筛选字段，与前端 queryParams 逐一对齐）
- [ ] 2.2 `com.lacus.domain.alert.dto` 包：AlertConfigSchemaDTO（field/label/type/required/placeholder/default/options/min）、ChannelInstanceDTO、ChannelTypeDTO、GroupDTO、GroupOptionDTO、RecordDTO、RecordTaskDTO、TaskLogDTO、SendResultDTO（success/errorMessage/responseSummary）、ExecuteAlertCommand
- [ ] 2.3 `AlertBusiness`：渠道类型列表；实例 CRUD + options、删除的被引用守卫；组 CRUD + options + groupCode 唯一校验；记录分页/详情（含 tasks）、手动 execute（D5 聚合语义）、retry、任务日志查询
- [ ] 2.4 `DqScheduleBusiness`：schedule CRUD + ruleId 唯一守卫；pause/resume/run 对接 Scheduler；可绑定规则列表（启用中规则）；alert-groups 跨域读取（调告警组 mapper）

## 3. 服务层（lacus-service）

- [ ] 3.1 `AlertSender` 接口 + `SenderRegistry`（typeCode → 实现，Spring 收集）；`MailAlertSender`（JavaMail SMTP，config 字段：host/port/username/password/ssl/fromAddress）；`WebhookAlertSender`（hutool HttpUtil POST JSON，5s 超时）；发送永不抛异常，统一包装 SendResult
- [ ] 3.2 `RuleExecuteJobTarget` Bean（`executeRule(Long ruleId, Long jobId)`，内部调 `DqTaskBusiness.submitTask`）——签名与 `JobInvokeUtil.ruleExecuteJob` 特判兼容
- [ ] 3.3 若 Spring Boot 尚无 mail starter，则在 `lacus-service/pom.xml` 补 `spring-boot-starter-mail`

## 4. Quartz 接入

- [ ] 4.1 `DqScheduleBusiness` 新增/更新/删除/暂停/恢复时与 Scheduler 同步（createScheduleJob / pauseJob / resumeJob / deleteJob / triggerJob），参考 `SysJobServiceImpl` 现有写法；cron 运行时注册失败要回滚业务行并报错
- [ ] 4.2 `cron-validate` 端点实现（`CronExpression.isValidExpression`，返回 valid + message）

## 5. Controller（lacus-admin）

- [ ] 5.1 `AlertController`（`/monitor/alert`）：channelType/list、channelInstance/list|/{id}|POST|PUT|DELETE /{ids}|test|options、group/list|/{id}|POST|PUT|DELETE /{ids}|options、record/list|/{id}|execute|/{id}/retry、task/{taskId}/log/list —— 路径与 alertApi.js 逐一对照；全部 `@PreAuthorize("monitor:alert:...")`
- [ ] 5.2 `DqScheduleController`（`/dq/schedule`）：list|/{jobId}|POST|PUT|DELETE /{jobId}|pause|resume|run|rules|cron-validate|alert-groups —— 路径与 scheduleApi.js 逐一对照；全部 `@PreAuthorize("dq:schedule:...")`
- [ ] 5.3 Swagger `@Api`/`@ApiOperation` 注解齐备

## 6. 契约核对与验证

- [ ] 6.1 逐调用核对：对 `alertApi.js` 的 19 个调用与 `scheduleApi.js` 的 11 个调用，逐一确认 method/path/参数名/响应形状与后端 Controller 签名一致（输出核对清单）
- [ ] 6.2 后端 `mvn -pl lacus-admin -am compile` 通过
- [ ] 6.3 启动 admin 后用 curl 逐一调用 30 个端点（含一个真实 Webhook 测试发送），确认无 404、无 500、响应包络正确
- [ ] 6.4 前端 `npm run dev` + 后端联调，逐页打开告警中心（渠道/组/记录）与 DQ 调度页面，确认列表有数据、表单可提交、无 Network 404
- [ ] 6.5 （如可行）在本地 MySQL 执行新 DDL 并验证唯一索引与外键约束生效

## 7. 收尾

- [ ] 7.1 为 `alert-center` 与 `dq-schedule` 两个 delta spec 逐条自查 Requirements/Scenarios 与实现一致性
- [ ] 7.2 更新评估遗留清单：从未跟踪「告警中心 / DQ 调度」两类缺失中移除这 30 个调用

```

## openspec/changes/alert-center-and-dq-schedule/specs/alert-center/spec.md

- Source: openspec/changes/alert-center-and-dq-schedule/specs/alert-center/spec.md
- Lines: 1-82
- SHA256: dd4dcd8a1d00605f723d731e21c9a3445f0e9d082ad50e51da3da035b82918ff

[TRUNCATED]

```md
# 告警中心能力规格（alert-center）

## Purpose

提供平台统一的消息告警能力：以"渠道类型 → 渠道实例 → 告警组 → 告警记录 → 发送任务/日志"的分层模型，让用户配置邮箱、Webhook 等发送通道，将告警手动触发或重试给一个组内的多个实例，并可追溯每条发送任务的完整日志。该能力同时作为数据质量调度等其他域的告警出口（跨域只读选项接口）。

## ADDED Requirements

### Requirement: 渠道类型契约

系统预置 `邮箱 SMTP` 和 `Webhook` 两类告警渠道类型。每类渠道类型须提供稳定的渠道编码与 JSON 结构的 `configSchema`，描述前端动态表单应渲染的配置字段（字段名、标签、控件类型 text/password/number/text_area/radio/select、是否必填、默认值）。

#### Scenario: 前端拉取渠道类型列表

- **WHEN** 客户端请求渠道类型列表
- **THEN** 返回所有启用中的渠道类型，每项含唯一 id、唯一渠道编码（如 `EMAIL`、`WEBHOOK`）、类型名称、configSchema JSON 字符串，且 configSchema 可被 JSON.parse 解析为字段数组

#### Scenario: configSchema 驱动动态表单

- **WHEN** 用户在渠道实例表单中选择某渠道类型
- **THEN** 表单按该类型的 configSchema 渲染配置项（text 输入框、password 密码框、text_area 文本域、number 数字框、radio 单选、select 下拉），必填项由 schema 的 required 标记控制

### Requirement: 渠道实例管理

用户可对告警渠道实例（某渠道类型 + 一份按 configSchema 校验的 config JSON）进行分页查询、详情、新增、修改、删除（支持批量逗号分隔 ID）、连通性测试，以及供下拉引用的 options 列表。

#### Scenario: 新增渠道实例

- **WHEN** 用户提交某渠道类型的新实例（含 typeName 相关的字段 + config JSON）
- **THEN** 系统保存实例并可在分页列表中查到；config 以 JSON 字符串落库

#### Scenario: 测试发送

- **WHEN** 用户对保存前或保存后的实例发起测试（传 instanceId 或仅配置草稿）
- **THEN** 系统按类型实际发送一条测试消息，返回 `{ success: boolean, errorMessage?, responseSummary? }`；发送失败不得抛系统异常，必须以结构化结果返回

#### Scenario: 删除被组引用的实例行为

- **WHEN** 删除一个仍被告警组引用（组内成员映射含该实例）的渠道实例
- **THEN** 系统阻止删除并返回明确错误提示，或级联移除组成员映射——以实现明确可验证的其一为准，不得产生悬空引用

### Requirement: 告警组管理

告警组是 groupCode（业务唯一编码）+ 组名 + 描述 + 启用状态 + 组内渠道实例集合的聚合。用户可分页查询、详情、新增、修改、删除（批量）、获取 options（仅 id/groupCode/groupName/enabled 精简体）。

#### Scenario: 新增告警组并绑定渠道实例

- **WHEN** 用户提交组编码、组名、描述、启用标志及选中的渠道实例 id 集合
- **THEN** 系统保存组并建立组-实例多对多映射；options 接口随后返回该组

#### Scenario: 告警组编码唯一

- **WHEN** 新增或修改时提交已存在的 groupCode（非本组自身）
- **THEN** 系统拒绝并提示编码已存在

### Requirement: 告警记录与手动触发

告警记录是一次"向某告警组发出一条告警"的实体：记录号、businessKey、组编码、级别（INFO/WARN/ERROR/CRITICAL）、标题、内容、状态（PENDING/SENDING/部分成功/成功/失败）、触发来源、触发人、请求/完成时间、错误摘要、任务汇总。用户可分页/关键字/组编码/状态/级别查询、查看详情（含任务列表与任务日志）、手动触发、对失败记录重试。

#### Scenario: 手动触发告警

- **WHEN** 用户提交 groupCode、alertLevel、title、content、可选 bizKey、可选 requestedBy（缺省取当前登录人）、triggerSource=MANUAL
- **THEN** 系统创建告警记录，为组内每个启用的渠道实例创建一条发送任务，逐个发送，并记录每个任务的成功/失败、响应内容与耗时；记录状态按任务结果聚合（全部成功=成功，部分=部分成功，全失败=失败）

#### Scenario: 重试失败记录

- **WHEN** 用户对一条状态为失败/部分成功的记录发起重试
- **THEN** 系统仅对其失败的任务创建新的尝试（重试次数+1），保留原任务号并追加日志行；记录状态按最新任务结果更新（PENDING/SENDING/PARTIAL_SUCCESS/SUCCESS/FAILED），任务粒度的重试必须可见

#### Scenario: 任务日志可追溯

- **WHEN** 用户在详情中查看某发送任务的日志
- **THEN** 返回按尝试次数排序的日志列表，每行含 attemptNo、是否成功、耗时毫秒、错误信息、请求内容、响应内容、创建时间

### Requirement: 记录列表引用数据

记录页的筛选与执行表单需要组编码下拉（groupCode/groupName 精简体），由告警组 options 提供；级别/状态枚举为前端本地字典，不依赖后端。

#### Scenario: 执行表单加载告警组


```

Full source: openspec/changes/alert-center-and-dq-schedule/specs/alert-center/spec.md

## openspec/changes/alert-center-and-dq-schedule/specs/dq-schedule/spec.md

- Source: openspec/changes/alert-center-and-dq-schedule/specs/dq-schedule/spec.md
- Lines: 1-63
- SHA256: 51a605605dc18048a2445d11d98733fb479397a2c8c870738c12596a0ddab511

```md
# 数据质量调度能力规格（dq-schedule）

## Purpose

为数据质量规则提供 Quartz 定时执行配置：用户为某条规则绑定 Cron 表达式（含错误策略与并发策略），系统按计划自动触发该规则的检测作业，并支持暂停、恢复、立即运行；同时提供可执行规则选项列表、Cron 表达式合法性校验、以及告警组选项的跨域只读列表（供规则表单绑定告警组）。

## ADDED Requirements

### Requirement: 调度任务生命周期

每个调度任务绑定一条 DQ 规则（ruleId 唯一——一条规则至多一个调度），并携带 Cron 表达式、错误策略（1 立即执行 / 2 执行一次 / 3 放弃执行，缺省 3）、并发策略（1 禁止并发 / 0 允许并发，缺省 1）、任务名称与启用/暂停状态。用户可分页查询（支持名称关键字与状态筛选）、详情、新增、修改、删除、暂停、恢复。

#### Scenario: 新增调度任务

- **WHEN** 用户提交 ruleId、cronExpression、misfirePolicy、concurrent、可选名称
- **THEN** 系统保存记录并注册 Quartz 定时任务（使用 ruleExecuteJob 调用约定，触发时执行该规则的检测作业）；列表中可见该任务，状态为正常

#### Scenario: 暂停与恢复

- **WHEN** 用户对一个正常状态的调度发起暂停，随后再发起恢复
- **THEN** 暂停后任务不再到点触发（记录状态为暂停），恢复后重新按 Cron 生效；对已暂停任务重复暂停、对已正常任务重复恢复返回幂等成功或明确提示

#### Scenario: 立即运行

- **WHEN** 用户对一个调度任务发起立即运行
- **THEN** 系绕立即触发一次对应规则的检测作业（等价于手动提交该规则的检测），返回执行记录 id；不影响既定 Cron 计划

#### Scenario: 删除调度任务

- **WHEN** 用户删除一个调度任务
- **THEN** Quartz 中对应任务与触发器一并移除，数据库记录逻辑删除，列表不再可见

#### Scenario: ruleId 唯一约束

- **WHEN** 用户为已有调度的规则再次新建调度（或修改调度指向另一已有调度的规则）
- **THEN** 系统拒绝并提示该规则已存在调度

### Requirement: Cron 表达式校验

后端提供 Cron 表达式合法性校验端点，校验规则与 Quartz 兼容（Quartz CronExpression 语义，6 段式）。

#### Scenario: 校验合法/非法表达式

- **WHEN** 客户端传入 cron 表达式请求校验
- **THEN** 返回结构化结果（合法 true / 非法 false + 错误原因）；非法原因贴合 Quartz 语义（如段数不足、值越界、不支持的特殊字符）

### Requirement: 可执行规则选项

新建调度时需要选择绑定的规则；选项列表返回启用中的规则（id + ruleName），仅含尚未被其他调度绑定的规则或全部启用规则（以实现为准，但必须有确定的行为并一致返回）。

#### Scenario: 加载可绑定规则

- **WHEN** 用户打开调度表单
- **THEN** 规则下拉返回启用中的规则集合，字段为 id 与 ruleName；若选择了排除已绑定策略，已绑定规则的 ruleId 不出现（编辑场景允许回显当前绑定规则本身）

### Requirement: 告警组选项跨域读取

规则表单绑定告警组时，前端通过本域的 alert-groups 端点读取告警组选项（仅 groupCode/groupName/enabled 精简体）。

#### Scenario: 规则表单加载告警组

- **WHEN** 客户端请求本域的告警组选项端点
- **THEN** 返回启用的告警组精简列表（groupCode、groupName），与告警中心组数据一致（同源读取）

```
