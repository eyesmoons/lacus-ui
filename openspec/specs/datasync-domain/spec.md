# 能力基线：datasync-domain（数据同步域）

## Purpose

本能力域固化数据同步（datasync）模块的现状契约：数据目录树管理、同步任务三步向导（输入源配置→映射关系配置→任务参数配置）、任务启停操作与任务实例查询。所有条目均为存量代码的实际行为描述。

## Requirements

### Requirement: 数据目录管理

数据目录页必须提供树查询 GET /datasync/job/catalog/list、分页 GET /datasync/job/catalog/pageList、详情 GET /datasync/job/catalog/{catalogId}、新增 POST /datasync/job/catalog、修改 PUT /datasync/job/catalog、删除 DELETE /datasync/job/catalog/{catalogIds}；目录作为同步任务的分组维度在任务向导第三步以下拉形式引用。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 新建分组

- **WHEN** 新增一个目录节点保存
- **THEN** 任务向导的「分组名称」下拉中可选到该目录

### Requirement: 同步任务向导步骤流

任务新建/编辑共用 job.vue 三步向导，必须实现：
1. **输入源配置**（active=1）：选择输入源数据源/库并勾选需要接入的表；点击下一步时若未选择任何表则报错「请选择需要接入的表」停留在第一步；
2. **映射关系配置**（active=2）：为每个输入表指定输出表，进入第三步前执行 POST /datasync/job/definition/preCheck 预检（body 含 form 与 tableMappings），未选输出表提示「请为所有输入表选择对应的输出表」退回第二步；预检返回结果作为 checkedTableMappings 用于最终提交；支持打开字段映射对话框查看列级映射（POST /datasync/job/definition/listMappedColumn）；
3. **任务参数配置**（active=3）：填写 jobName/catalogName（均必填：任务名称不能为空/分组名称不能为空）等参数，分组下拉经 catalogApi.list 初始化。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 未选表中止前进

- **WHEN** 第一步未勾选任何表直接点「下一步」
- **THEN** 报错「请选择需要接入的表」且停留在第一步

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 预检通过进入参数页

- **WHEN** 所有输入表均已配好输出表后点「下一步」
- **THEN** preCheck 返回校验后的映射集合并初始化分组下拉，进入第三步

### Requirement: 同步任务保存与编辑回显

提交必须按 jobId 区分：新建走 POST /datasync/job/definition/add（提示「任务保存成功」），编辑走 POST /datasync/job/definition/modify（提示「任务更新成功」，注意更新同为 POST 而非 PUT），两者成功后均跳转 /datasync/job 列表。编辑回显经路由 editJob/:jobId 进入，详情数据取自 GET /datasync/job/definition/detail/{jobId}。运行态补充信息可经 GET /datasync/job/definition/jobDetail（catalogId/type 参数）获取。

| 方法 | 路径 | 用途 |
|---|---|---|
| POST | /datasync/job/definition/preCheck | 保存前预检 |
| POST | /datasync/job/definition/listMappedColumn | 查询列映射 |
| POST | /datasync/job/definition/add | 新建任务 |
| POST | /datasync/job/definition/modify | 更新任务 |
| GET | /datasync/job/definition/pageList | 任务分页 |
| GET | /datasync/job/definition/detail/{jobId} | 任务详情 |
| GET | /datasync/job/definition/remove/{jobId} | 删除任务(GET) |
| GET | /datasync/job/definition/jobDetail | 运行态详情 |
| POST | /datasync/job/operation/start | 启动任务 |
| GET | /datasync/job/operation/stop/{jobId} | 停止任务(GET) |

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 编辑已有任务

- **WHEN** 从列表点击编辑进入向导
- **THEN** 三步内容按 detail 接口回填，修改后提交走 modify 并提示「任务更新成功」

### Requirement: 任务启停操作

任务列表必须提供启动与停止操作：启动经 POST /datasync/job/operation/start（body 携带任务信息）确认后执行；停止经 GET /datasync/job/operation/stop/{jobId} 且确认文案为「是否确认停止任务["xx"]吗？」；删除为确认后调 GET remove/{jobId}。列表展示任务状态标签。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 停止运行中的采集任务

- **WHEN** 点击停止并确认
- **THEN** stop 接口执行后状态刷新为停止态

### Requirement: 任务实例查询

实例页必须提供分页查询 GET /datasync/job/instance/pageList（按任务/时间/状态过滤），展示每次调度执行的开始时间、结束时间、读写计数等运行指标。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 查看最近执行记录

- **WHEN** 打开任务实例页
- **THEN** 默认分页展示最近的实例记录及其状态标签
