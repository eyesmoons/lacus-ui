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

### D7. 响应体兼容

前端仅两处分页用 `response.rows`/`total`（列表页），其余直接消费 data。全部走 `ResponseDTO.ok(...)`/`PageDTO`，与全站约定一致；分页统一 `pageNum/pageSize` 参数名（前端已按此传）。

### D8. Security

- 全部端点按现有模式加 `@PreAuthorize`（`monitor:alert:xxx` / `dq:schedule:xxx`），即使 sys_menu 尚无这些权限串（用户是 admin 也不会被拦）
- 渠道实例 config 中的 SMTP 密码以明文落库（与平台现状一致——元数据源的连接密码同样明文）；configSchema 中密码字段以 password 控件回显不做特殊打码，**记录为后续数据脱敏议题**

## Risks / Trade-offs

- `record/execute` 同步等待组内全部发送（≤ 数秒）—— trade-off：换实现简单与前端可即时看到结果；组规模扩大后应改异步 + 前端轮询
- Webhook 通用 JSON 格式钉钉/飞书不被认作 markdown/加签消息 —— 各家自定义机器人默认可收纯文本 JSON，够本期验证使用
- dq_rule 补列对已发布环境需要手工执行 ALTER —— DDL 追加 lacus.sql 时同步注释说明
- `JobInvokeUtil.ruleExecuteJob` 特判目前**追加** jobId 参数但不移除既有占位——新 bean 的方法签名必须兼容两种调用形态，或以 `executeRule(Long ruleId, Long jobId)` 固定签名规避

## Open Questions

（无——契约已按前端锁定，方案已与用户确认：Quartz+新表、邮箱+Webhook、单 change。）
