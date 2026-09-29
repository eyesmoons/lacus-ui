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
