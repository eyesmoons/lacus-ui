# alert-center Specification

## Purpose
提供平台统一的消息告警能力：以"渠道类型 → 渠道实例 → 告警组 → 告警记录 → 发送任务/日志"的分层模型，让用户配置邮箱、Webhook 等发送通道，将告警手动触发或重试给一个组内的多个实例，并可追溯每条发送任务的完整日志。该能力同时作为数据质量调度等其他域的告警出口（跨域只读选项接口）。

## Requirements

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

- **WHEN** 用户打开手动触发告警对话框
- **THEN** 下拉数据来自告警组 options，展示 groupCode（后端无需为该下拉提供额外端点）
