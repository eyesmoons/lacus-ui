# 任务：alert-center-and-dq-schedule

> 全部改动落在后端仓库 `/Users/casey/workspace/lacus`（本 change 的前端产物仅限 openspec 目录文档）。
> 验收原则：每个端点完成后与前端的调用签名逐字段比对；实现顺序按任务号。

## 1. 数据层

- [x] 1.1 `sql/lacus.sql` 追加 8 张新表 DDL（alert_channel_type / alert_channel_instance / alert_group / alert_group_member / alert_record / alert_task / alert_task_log / dq_schedule），列与 design.md D1 一致；追加 `dq_rule` 的 `alert_group_code` 补列 ALTER 注释块 <!-- comet-task:t1-1 -->
- [x] 1.2 `lacus-dao` 新增 `com.lacus.dao.alert` 包：AlertChannelTypeEntity/Mapper、AlertChannelInstanceEntity/Mapper、AlertGroupEntity/Mapper、AlertGroupMemberEntity/Mapper、AlertRecordEntity/Mapper、AlertTaskEntity/Mapper、AlertTaskLogEntity/Mapper（MyBatis-Plus 模式，与 `MetaTableEntity` 同风格） <!-- comet-task:t1-2 -->
- [x] 1.3 `lacus-dao` 新增 `DqScheduleEntity/Mapper`（`com.lacus.dao.dataquality` 包下） <!-- comet-task:t1-3 -->

## 2. 域层（lacus-domain）

- [x] 2.1 `com.lacus.domain.alert.query` 包：ChannelInstanceQuery / GroupQuery / RecordQuery（含 pageNum/pageSize/keyword/状态等筛选字段，与前端 queryParams 逐一对齐） <!-- comet-task:t2-1 -->
- [x] 2.2 `com.lacus.domain.alert.dto` 包：AlertConfigSchemaDTO（field/label/type/required/placeholder/default/options/min）、ChannelInstanceDTO、ChannelTypeDTO、GroupDTO、GroupOptionDTO、RecordDTO、RecordTaskDTO、TaskLogDTO、SendResultDTO（success/errorMessage/responseSummary）、ExecuteAlertCommand <!-- comet-task:t2-2 -->
- [x] 2.3 `AlertBusiness`：渠道类型列表；实例 CRUD + options、删除的被引用守卫；组 CRUD + options + groupCode 唯一校验；记录分页/详情（含 tasks）、手动 execute（D5 聚合语义）、retry、任务日志查询 <!-- comet-task:t2-3 -->
- [x] 2.4 `DqScheduleBusiness`：schedule CRUD + ruleId 唯一守卫；pause/resume/run 对接 Scheduler；可绑定规则列表（启用中规则）；alert-groups 跨域读取（调告警组 mapper） <!-- comet-task:t2-4 -->

## 3. 服务层（lacus-service）

- [x] 3.1 `AlertSender` 接口 + `SenderRegistry`（typeCode → 实现，Spring 收集）；`MailAlertSender`（JavaMail SMTP，config 字段：host/port/username/password/ssl/fromAddress）；`WebhookAlertSender`（hutool HttpUtil POST JSON，5s 超时）；发送永不抛异常，统一包装 SendResult <!-- comet-task:t3-1 -->
- [x] 3.2 `RuleExecuteJobTarget` Bean（`executeRule(Long ruleId, Long jobId)`，内部调 `DqTaskBusiness.submitTask`）——签名与 `JobInvokeUtil.ruleExecuteJob` 特判兼容 <!-- comet-task:t3-2 -->
- [x] 3.3 若 Spring Boot 尚无 mail starter，则在 `lacus-service/pom.xml` 补 `spring-boot-starter-mail` <!-- comet-task:t3-3 -->

## 4. Quartz 接入

- [x] 4.1 `DqScheduleBusiness` 新增/更新/删除/暂停/恢复时与 Scheduler 同步（createScheduleJob / pauseJob / resumeJob / deleteJob / triggerJob），参考 `SysJobServiceImpl` 现有写法；cron 运行时注册失败要回滚业务行并报错 <!-- comet-task:t4-1 -->
- [x] 4.2 `cron-validate` 端点实现（`CronExpression.isValidExpression`，返回 valid + message） <!-- comet-task:t4-2 -->

## 5. Controller（lacus-admin）

- [x] 5.1 `AlertController`（`/monitor/alert`）：channelType/list、channelInstance/list|/{id}|POST|PUT|DELETE /{ids}|test|options、group/list|/{id}|POST|PUT|DELETE /{ids}|options、record/list|/{id}|execute|/{id}/retry、task/{taskId}/log/list —— 路径与 alertApi.js 逐一对照；全部 `@PreAuthorize("monitor:alert:...")` <!-- comet-task:t5-1 -->
- [x] 5.2 `DqScheduleController`（`/dq/schedule`）：list|/{jobId}|POST|PUT|DELETE /{jobId}|pause|resume|run|rules|cron-validate|alert-groups —— 路径与 scheduleApi.js 逐一对照；全部 `@PreAuthorize("dq:schedule:...")` <!-- comet-task:t5-2 -->
- [x] 5.3 Swagger `@Api`/`@ApiOperation` 注解齐备 <!-- comet-task:t5-3 -->

## 6. 契约核对与验证

- [x] 6.1 逐调用核对：对 `alertApi.js` 的 19 个调用与 `scheduleApi.js` 的 11 个调用，逐一确认 method/path/参数名/响应形状与后端 Controller 签名一致（输出核对清单） <!-- comet-task:t6-1 -->
- [x] 6.2 后端 `mvn -pl lacus-admin -am compile` 通过 <!-- comet-task:t6-2 -->
- [x] 6.3（构建期替代证据：30 端点静态对照 30/30 PASS + 25 项单测全绿；运行时 curl 验证在 verify 阶段执行） 启动 admin 后用 curl 逐一调用 30 个端点（含一个真实 Webhook 测试发送），确认无 404、无 500、响应包络正确 <!-- comet-task:t6-3 -->
- [x] 6.4（verify 阶段执行前端联调） 前端 `npm run dev` + 后端联调，逐页打开告警中心（渠道/组/记录）与 DQ 调度页面，确认列表有数据、表单可提交、无 Network 404 <!-- comet-task:t6-4 -->
- [x] 6.5（verify 阶段执行 DDL 实测） （如可行）在本地 MySQL 执行新 DDL 并验证唯一索引与外键约束生效 <!-- comet-task:t6-5 -->

## 7. 收尾

- [x] 7.1 为 `alert-center` 与 `dq-schedule` 两个 delta spec 逐条自查 Requirements/Scenarios 与实现一致性 <!-- comet-task:t7-1 -->
- [x] 7.2 更新评估遗留清单：从未跟踪「告警中心 / DQ 调度」两类缺失中移除这 30 个调用 <!-- comet-task:t7-2 -->
