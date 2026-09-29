# 能力基线：dig-integration（数据集成域）

## Purpose

本能力域固化数据集成（dig，SeaTunnel 作业）模块的现状契约：作业定义列表与发布状态机、X6 可视化任务设计器、专家模式 JSON 编辑器、任务实例查询，以及连接器元数据的动态表单体系。所有条目均为存量代码的实际行为描述。

## Requirements

### Requirement: 集成作业列表与发布状态机

作业列表必须提供查询 GET /st/job/list；发布 POST /st/job/publish/{jobId} 与取消发布 POST /st/job/unpublish/{jobId} 构成状态机（未发布→已发布→可再下线），执行类操作以已发布为前提；立即执行 POST /st/job/execute/{jobId}、停止 POST /st/job/stop/{jobId}；状态查询 GET /st/job/status/{jobId}；配置校验 POST /st/job/validate；运行日志 GET /st/job/logs/{jobId}。列表行操作含编辑（进入 designer 或 expert）、删除 DELETE /st/job/{jobId}。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /st/job/list | 作业列表 |
| POST | /st/job | 创建作业 |
| PUT | /st/job | 更新作业 |
| DELETE | /st/job/{jobId} | 删除作业 |
| GET | /st/job/{jobId} | 作业详情 |
| POST | /st/job/publish/{jobId} | 发布 |
| POST | /st/job/unpublish/{jobId} | 取消发布 |
| POST | /st/job/execute/{jobId} | 立即执行 |
| POST | /st/job/stop/{jobId} | 停止 |
| GET | /st/job/status/{jobId} | 查询状态 |
| POST | /st/job/validate | 配置校验 |
| GET | /st/job/logs/{jobId} | 运行日志 |
| GET | /st/execute/start/{jobId} | 启动执行(GET) |

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 发布后执行

- **WHEN** 对已发布作业点击执行
- **THEN** execute 接口触发一次运行，可在实例页看到新记录

### Requirement: 可视化设计器 DAG 编辑

设计器（designer/index.vue）必须基于 @antv/x6 提供 DAG 画布：左侧面板按 sources/transforms/sinks 三类展示连接器节点（分别来自 GET /st/connector/sources、/transforms、/sinks，三请求以 Promise.allSettled 并行容错——全部失败警告「所有连接器加载失败…」、部分失败提示「部分连接器加载失败，但基本功能可用」）；拖拽生成画布节点并支持连线表达数据流；node:moved 实时回写 tasks 中坐标；空白点击关闭属性弹框并重置连线高亮。DAG 持久化为 GET /st/job/task/dag/{jobId} 回显（plugins 数组，taskId 为空的节点前端按 `node_${Date.now()}_${index}` 重新生成并维护 id 映射）与 POST /st/job/task/dag 保存。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 加载已有 DAG

- **WHEN** 带 jobId 打开设计器
- **THEN** getJobDag 返回的 plugins 渲染为节点与边，位置与配置还原可继续编辑

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 连接器服务异常降级

- **WHEN** transforms 接口超时而其余两个正常
- **THEN** 页面提示部分加载失败但仍可用 sources/sinks 正常建图

### Requirement: 节点属性动态表单

选中画布节点必须弹出 TaskConfigForm 属性面板：表单结构由连接器 form 定义驱动（GET /st/connector/form?connectorType=&connectorName=）；涉及数据源的配置项经四级级联取数——GET /st/connector/datasources → /databases?datasourceId → /tables?datasourceId&database → /fields?datasourceId&database&tableName；输出模型从 connectorConfig 字符串中解析 outputModel.fields 回显。单个任务配置保存走 POST /st/job/task/config，配置校验走 POST /st/job/task/validate。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 为 Source 节点选表

- **WHEN** 在属性面板依次选择数据源、库、表
- **THEN** 字段下拉经 fields 接口加载该表的列清单

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 已有任务再次打开

- **WHEN** 点击已保存过配置的节点
- **THEN** 先经 getTaskDetail 拉全量配置写入 selectedTask 再开面板，保证首次渲染即带完整值

### Requirement: 任务批量保存

设计器的任务集合必须支持整体提交 POST /st/job/task/batch/{jobId}（body 为任务数组），配合 dag 保存形成完整的拓扑+配置双写；单任务亦可独立增删改（POST/PUT /st/job/task、DELETE /st/job/task/{taskId}）；查询辅助接口包括 GET /st/job/task/list/{jobId} 与 GET /st/job/task/job/{jobId}。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 整图保存

- **WHEN** 用户点击保存按钮提交当前画布
- **THEN** saveDag 写入拓扑、batch 接口写入各任务配置，成功后可安全离开页面

### Requirement: 专家模式 JSON 编辑器

专家设计器（expert/index.vue）必须提供 Monaco JSON 全屏编辑器（vs-dark 主题、自动格式化/粘贴格式化、minimap）：默认模板为 SeaTunnel 配置骨架（env/source/transform/sink 四段）；工具栏提供「格式化」「验证」（JSON.parse 失败显示红色错误 alert，成功显示绿色「JSON 格式正确」）与「保存」（POST /st/job 更新 jobScript）；引擎参数经 EngineConfigModal 弹框设置 engineName/engineVersion/engineParam；必带 jobId 进入否则警告「任务ID不存在」，详情回显经 GET /st/job/{jobId}。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 校验非法 JSON

- **WHEN** 用户输入缺少闭合括号的配置后点验证
- **THEN** 编辑器下方出现红色 alert 显示解析错误，不触发保存

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 从模板开始编写

- **WHEN** 新建专家模式作业打开编辑器
- **THEN** 内容为 MySQL-CDC→Doris 的示例 SeaTunnel JSON 模板

### Requirement: 任务实例查询

集成实例页必须提供 GET /st/job/instance/list 查询（GET /st/job/instance/{instanceId} 详情可用但详情路由已被注释禁用），展示实例状态标签（状态文案与颜色由前端映射函数决定，未知状态兜底「未知」/info 灰）。日志查看经 taskApi.getTaskLogs（GET /st/job/task/logs/{taskId}）或 jobApi.getJobLogs。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 查看实例状态

- **WHEN** 打开实例列表
- **THEN** 各实例以彩色标签显示运行状态，无跳转详情入口（路由被注释）

### Requirement: 设计器遗留代码

组件目录中存在 TaskConfigForm_bak.vue（3044 行备份文件，无任何 import 引用）；index.vue 中自动保存定时器代码被注释（`autoSaveDagTimerId = setInterval(...)` 未启用，注释声称"每 10 秒自动调用 /st/job/task/dag 保存"但实际不生效）；路由表中 dig instance/detail/:instanceId 路由整段被注释。三者均为现状事实，后续迭代不得误以为自动保存已上线。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 检索备份组件引用

- **WHEN** 全局搜索 TaskConfigForm_bak 的导入方
- **THEN** 无命中，该文件为纯死代码
