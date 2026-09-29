# Brainstorm Summary

- Change: alert-center-and-dq-schedule
- Date: 2026-09-20

## 确认的技术方案

单 change 在后端 lacus 补齐告警中心（19 端点）与 DQ 调度（11 端点）。

**分层**：Controller（lacus-admin，薄层 + `@PreAuthorize` + Swagger）→ Business（lacus-domain：AlertBusiness / DqScheduleBusiness）→ dao（9 个 Entity+Mapper，MyBatis-Plus）；发送器实现在 lacus-service。

**表**：8 张新表（alert_channel_type / alert_channel_instance / alert_group / alert_group_member / alert_record / alert_task / alert_task_log / dq_schedule）+ `dq_rule.alert_group_code` 补列；DDL 追加 sql/lacus.sql。dq_schedule 列名对齐 sys_job 约定。

**枚举对齐（实测前端字典）**：
- record.status: PENDING / SENDING / PARTIAL_SUCCESS / SUCCESS / FAILED
- task.status: WAITING / SENDING / SUCCESS / FAILED
- alertLevel: INFO / WARN / ERROR / CRITICAL
- misfirePolicy '1'/'2'/'3'；concurrent '1'禁止/'0'允许（对齐 sys_job）
- triggerSource: MANUAL / SCHEDULE / METRIC

**发送器策略**：`AlertSender` 接口（domain）入参为 typeCode+configJSON+title+content（不传实体，保持依赖方向）；`SenderRegistry`（lacus-service，Spring 收集）按 typeCode 分派；`MailAlertSender`（spring-boot-starter-mail SMTP）、`WebhookAlertSender`（hutool HttpUtil POST JSON 5s 超时，lacus-domain 需显式加 hutool-all 依赖，父 pom 已有 5.8.25 版本管理）。发送失败永不抛异常，统一 SendResult。

**Quartz 接入**：新增 `RuleExecuteJobTarget.executeRule(Long ruleId, Long jobId)` Bean；invoke_target 仅传 ruleId，特判追加 jobId 后签名正好补全（Build 阶段重点验证）；调度同步复用 `ScheduleUtils`/SysJobServiceImpl 模式；cron 校验直接用现有 `CronUtils.isValid/getInvalidMessage`。

**分页**：统一 `new PageDTO(list, total)` → res.rows/res.total（5 处前端消费点已核实）。

**边界**：删除被组引用的渠道实例 → 阻止并提示；group groupCode 唯一、schedule ruleId 唯一（服务层 + DB 双保险）；record/execute 同步执行（≤5 实例 × 5s 超时）。

## 关键取舍与风险

- 同步发送 vs 异步轮询：选同步（实现简单、前端即时可见）；组规模大后需改异步
- Webhook 通用 JSON 非加签/富文本格式：够验证用，专属协议不做
- SMTP 密码明文落库：与平台现状一致，遗留为脱敏议题
- `JobInvokeUtil` 特判与 bean 签名的配合是最大技术风险点，需在 Build 早期验证
- lacus-domain 需新增 hutool-all 依赖（HTTP 发送在 domain 侧调用时）

## 测试策略

- 构建验证：`mvn -pl lacus-admin -am compile`
- 契约核对清单：30 个调用逐一比对 method/path/params/response
- curl 全端点 + 前端联调逐页验证（含真实 Webhook 测试发送）
- 发送器自动化仅覆盖 Registry 分派；SMTP 以 greenmail/mock 或手动集成验证
- cron 校验、ruleId 唯一守卫可用 JUnit 单测

## Spec Patch

已回写 `specs/alert-center/spec.md`：record.status 与 task.status 枚举改为精确英文值（PENDING/SENDING/PARTIAL_SUCCESS/SUCCESS/FAILED；WAITING/SENDING/SUCCESS/FAILED），与前端本地字典一致。其余无变更。
