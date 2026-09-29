## MODIFIED Requirements

### Requirement: 规则列表与管理
规则列表必须提供查询 GET /dq/rule/list；新建 POST /dq/rule、编辑 PUT /dq/rule；删除 DELETE /dq/rule/{id}（确认后执行）；详情 GET /dq/rule/{id} 供编辑回显。列表展示规则名称、模板类型、启停状态等列。**列表操作列增加「调度」入口，点击跳转调度列表并按该规则 ruleId 过滤。**

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 删除质量规则

- **WHEN** 点击删除并确认
- **THEN** DELETE 接口执行成功后刷新列表

#### Scenario: 跳转调度列表并按规则过滤

- **WHEN** 点击某规则行的「调度」按钮
- **THEN** 跳转到调度列表并按该规则 ruleId 过滤，仅展示该规则关联的调度

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /dq/rule/list | 规则列表 |
| GET | /dq/rule/{id} | 规则详情 |
| POST | /dq/rule | 新建规则 |
| PUT | /dq/rule | 更新规则 |
| DELETE | /dq/rule/{id} | 删除规则 |
| GET | /dq/template/list | 模板清单 |
| POST | /dq/task/submit/{ruleId} | 提交执行 |
| GET | /dq/task/status/{logId} | 执行状态 |
| POST | /dq/task/stop/{logId} | 停止执行 |
| GET | /dq/result/list | 执行记录 |
| GET | /dq/check-result/list/{logId} | 检查明细 |
| GET | /dq/schedule/list?ruleId={ruleId} | 按规则过滤调度列表（扩展） |

### Requirement: 模板驱动的规则表单
规则创建必须先从 GET /dq/template/list 获取内置检测模板清单（只读选择，无模板维护页面），选定模板后按其类型渲染对应校验配置（数据源/库/表/列的定位方式以表单实现为准，阈值等参数随模板语义变化）；编辑时经 getRuleDetail 回填全部配置。**Step2 规则配置增加通用阈值告警区（启用开关、比较操作符、阈值、告警组），阈值作用于模板主检测值；提交时写入 `ruleCheckParams` 的阈值告警字段。**

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 基于模板建规则

- **WHEN** 选择某空值检测模板并填写目标表字段与阈值保存
- **THEN** POST /dq/rule 成功后列表出现该规则

#### Scenario: 保存阈值告警

- **WHEN** 在 Step2 启用阈值告警并填写操作符、阈值、告警组后提交
- **THEN** `ruleCheckParams` 携带阈值告警字段并持久化，编辑时可回填
