# 能力基线：dataquality-domain（数据质量域）

## Purpose

本能力域固化数据质量模块的现状契约：质量规则模板选择、规则创建/编辑表单、规则启停删除、提交执行与状态轮询、执行记录与检查结果明细。所有条目均为存量代码的实际行为描述。

## Requirements

### Requirement: 规则列表与管理

规则列表必须提供查询 GET /dq/rule/list；新建 POST /dq/rule、编辑 PUT /dq/rule；删除 DELETE /dq/rule/{id}（确认后执行）；详情 GET /dq/rule/{id} 供编辑回显。列表展示规则名称、模板类型、启停状态等列。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 删除质量规则

- **WHEN** 点击删除并确认
- **THEN** DELETE 接口执行成功后刷新列表

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

### Requirement: 模板驱动的规则表单

规则创建必须先从 GET /dq/template/list 获取内置检测模板清单（只读选择，无模板维护页面），选定模板后按其类型渲染对应校验配置（数据源/库/表/列的定位方式以表单实现为准，阈值等参数随模板语义变化）；编辑时经 getRuleDetail 回填全部配置。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 基于模板建规则

- **WHEN** 选择某空值检测模板并填写目标表字段与阈值保存
- **THEN** POST /dq/rule 成功后列表出现该规则

### Requirement: 提交执行与状态轮询

对单条规则提交执行必须调 POST /dq/task/submit/{ruleId} 生成一条执行日志（logId）；执行记录页在存在活动任务时启动 10 秒间隔定时器（setInterval 10000ms）轮询刷新 getResultList，全部任务到达终态或组件卸载时 clearInterval 停止；运行中的任务可经 POST /dq/task/stop/{logId} 手动停止。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 执行期间自动刷新

- **WHEN** 提交执行后停留在执行记录页
- **THEN** 页面每 10 秒自动拉取一次记录列表直至任务结束

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 离开页面停止轮询

- **WHEN** 轮询进行中切换到其他菜单
- **THEN** onUnmounted 钩子清除定时器，不再发请求

### Requirement: 执行记录与明细

执行记录页必须提供 GET /dq/result/list 分页展示历史执行（状态标签区分成功/失败/运行中）；点击进入单次执行的明细 GET /dq/check-result/list/{logId} 展示逐条检查结果；提供 SQL 文本的复制能力（navigator.clipboard 写入并提示「已复制」）。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 排查失败执行

- **WHEN** 打开一条 FAILED 记录的检查明细
- **THEN** 列出该次各校验项的实际值与期望阈值便于定位
