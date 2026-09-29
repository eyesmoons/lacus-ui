## Purpose

为规则管理列表提供直达定时调度的快捷入口。由于每规则仅支持一个调度，用户从单条规则直接**弹框管理**其唯一调度（创建/查看/暂停/恢复/立即执行/编辑/删除），无需跳转调度列表页。

## ADDED Requirements

### Requirement: 规则列表调度弹框入口
规则列表操作列 SHALL 提供「调度」入口，点击后打开弹框管理该规则的唯一调度（不再跳转调度列表页）。

#### Scenario: 点击调度按钮打开弹框
- **WHEN** 用户点击某规则行的「调度」按钮
- **THEN** 系统打开弹框，标题包含规则名，内容按该规则调度状态切换

#### Scenario: 弹框按调度状态切换
- **WHEN** 规则未绑定调度
- **THEN** 弹框显示创建表单（调度名称/Cron/错误策略/是否并发/备注），ruleId 预绑定并隐藏
- **WHEN** 规则已绑定调度
- **THEN** 弹框显示调度详情（名称/Cron/状态/下次执行时间）与操作按钮（暂停/恢复/立即执行/编辑/删除）

### Requirement: 每规则唯一调度约束
每规则 SHALL 仅支持绑定一个调度。已绑规则弹框 SHALL 隐藏「新建」并展示详情，调度表单规则下拉 SHALL 排除已绑定规则。

#### Scenario: 已绑规则无法新建第二个调度
- **WHEN** 规则已绑定调度
- **THEN** 弹框不显示「新建调度」入口，仅展示已有调度的详情与操作

#### Scenario: 调度表单排除已绑规则
- **WHEN** 用户在调度表单选择绑定规则
- **THEN** 已绑定调度的规则不在下拉选项中

### Requirement: 弹框内调度操作
弹框 SHALL 支持对当前规则调度的完整操作：创建（`addSchedule`）、暂停（`pauseSchedule`）、恢复（`resumeSchedule`）、立即执行（`runSchedule`）、编辑（回填预填充）、删除（`deleteSchedule`）。操作成功后 SHALL 关闭弹框并刷新规则列表。

#### Scenario: 创建调度
- **WHEN** 用户在弹框创建表单填写并保存
- **THEN** 调用 `addSchedule` 成功后弹框刷新为「已绑」态，规则列表该行 `schedule` 状态同步

#### Scenario: 暂停/恢复/立即执行
- **WHEN** 用户点击暂停/恢复/立即执行按钮
- **THEN** 调用对应接口并刷新列表最新状态

### Requirement: 规则列表接口返回调度信息
`GET /dq/rule/list` 每行 SHALL 返回 `schedule: { id, jobName, cronExpression, status } | null`，前端兜底缺失时视为 null。

#### Scenario: 规则列表返回调度状态
- **WHEN** 前端加载规则列表
- **THEN** 每行包含 `schedule` 字段，null 表示未绑定，非 null 包含调度 ID/名称/Cron/状态

#### Scenario: 调度字段缺失兜底
- **WHEN** 后端暂未返回 `schedule` 字段
- **THEN** 前端视为 null，弹框退化为「未绑」态，不阻塞用户操作
