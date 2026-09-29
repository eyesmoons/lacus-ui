# 能力基线：metadata-domain（元数据管理域）

## Purpose

本能力域固化元数据管理模块的现状契约：数据源管理（含插件定义驱动的动态表单与 KAFKA/HDFS 虚拟源）、数据源类型/插件管理、库表元数据浏览与同步、表详情页、业务元数据、数据血缘图与元数据定时同步任务。所有条目均为存量代码的实际行为描述。

## ADDED Requirements

### Requirement: 数据源列表与基础操作

数据源管理页必须提供分页查询 GET /metadata/datasource/pageList（条件 datasourceName/type/ip/status）；状态启停 PUT /metadata/datasource/{datasourceId}/status（el-switch，确认文案「确认要"启用/停用""xx"数据源吗?」，取消时回滚开关值）；连通性测试 GET /metadata/datasource/test/{datasourceId}（按返回布尔值提示「测试成功」/「测试失败」）；删除 DELETE /metadata/datasource/{datasourceIds}（确认文案「是否确认删除ID为"x"的数据源吗？」）；连接参数详情弹窗（将存储的 connectionParams JSON 解析为键值对展示，解析失败显示「无法解析连接信息」）。类型筛选下拉的取值为硬编码 [{value:1,label:'输入源'},{value:2,label:'输出源'}]。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /metadata/datasource/pageList | 分页查询 |
| GET | /metadata/datasource/list | 简表查询(datasourceName/sourceType) |
| GET | /metadata/datasource/{datasourceId} | 详情 |
| POST | /metadata/datasource | 新增 |
| PUT | /metadata/datasource | 修改 |
| PUT | /metadata/datasource/{datasourceId}/status | 启停 |
| GET | /metadata/datasource/test/{datasourceId} | 连通性测试 |
| DELETE | /metadata/datasource/{datasourceIds} | 删除 |

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 启停取消回滚

- **WHEN** 切换数据源状态的确认弹窗被取消
- **THEN** 开关值回滚，不发请求

### Requirement: 插件定义驱动的动态表单

新增数据源时选择类型必须即时调用 GET /metadata/datasource/plugin/{name} 获取该插件的 connectionParams 定义并动态渲染连接参数字段；定义 JSON 兼容两种历史格式（数组格式直接作为字段集；对象格式将键名转为 name 并合并 description/required/defaultValue）；带 defaultValue 的字段自动填充默认值。提交前将 connectionParamsObj 序列化为 JSON 字符串存入 form.connectionParams。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 选择 Kafka 类型

- **WHEN** 新增对话框中选择类型 KAFKA
- **THEN** 表单出现 bootstrapServers 等由插件定义的字段并填入默认值，常规源的 ip/port 输入框不显示

### Requirement: 虚拟数据源表单差异

类型为 KAFKA/HDFS（前端硬编码 VIRTUAL_DATASOURCE_TYPES 常量判定）时，校验规则必须收敛为仅公共项（datasourceName 必填、type 必填），不追加常规源专属的 ip/port/defaultDbName/username 必填规则；常规源及未选类型的初始态才追加专属规则。行内是否虚拟源同样按 type 名判定，不依赖后端返回标记字段。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: HDFS 源免填 IP

- **WHEN** 新增 HDFS 数据源仅填写名称与插件定义参数即提交
- **THEN** 校验通过（ip/port 规则未生效），保存成功

### Requirement: 编辑回显与定义缺失兜底

编辑数据源必须先加载插件列表再拉详情（GET /metadata/datasource/{id}），按插件定义渲染字段并将已存的 connectionParams JSON 解析回填 connectionParamsObj；插件定义缺失或解析异常时降级为旧行为——以已存 JSON 的键反推字段（name=键名、defaultValue=存量值），保证老数据可编辑。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 老数据编辑

- **WHEN** 编辑一条其类型插件未配置 connectionParams 定义的历史数据源
- **THEN** 表单按存量 JSON 键值生成可编辑字段而非报错空白

### Requirement: 库表浏览与元数据同步

左侧树形浏览必须支持：数据源层经 datasourceApi.getDatasourceList() 加载、库层懒加载 GET /metadata/db/list/{datasourceId}；表清单页 GET /metadata/table/pageList（条件 tableName）展示虚拟表标记列（tableType 以 VIRTUAL 开头或兼容旧布尔 isVirtual 即显示「虚拟表」warning 标签）。同步入口对话框经 schema 接口驱动：GET /metadata/schema/listSchemaDb/{datasourceId} 返回 schemaDbList/checkedKeys/expandedKeys 三段数据初始化勾选树，GET /metadata/schema/listSchemaTable/{datasourceId}/{dbName} 懒加载库下表，POST /metadata/schema/syncDbTables 提交所选库表（含半选父节点）成功后提示「同步成功」。表远程搜索下拉使用 GET /metadata/table/listTable。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /metadata/db/list/{datasourceId} | 库列表 |
| GET | /metadata/schema/listSchemaDb/{datasourceId} | 同步树初始化 |
| GET | /metadata/schema/listSchemaTable/{datasourceId}/{dbName} | 库下表懒加载 |
| POST | /metadata/schema/syncDbTables | 执行同步 |
| GET | /metadata/table/pageList | 表分页 |
| GET | /metadata/table/listTable | 表搜索 |
| GET | /metadata/table/detail/{tableId} | 表详情 |
| GET | /metadata/column/getColumnsByTableId/{tableId} | 按表查列 |
| GET | /metadata/column/getColumnsByTableName | 按名查列(datasourceId/dbName/tableName) |

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 勾选部分库执行同步

- **WHEN** 在同步对话框勾选 2 个库下的若干表并确认
- **THEN** syncDbTables 携带全选+半选节点键集合提交，成功后列表刷新

### Requirement: 表详情页多 Tab

表详情页（路由 /metadata/table-manager/detail/:tableId）必须含四个 Tab：基本信息（数据源/库/表名/备注/类型/引擎/创建时间只读；虚拟表显示 warning「虚拟表」标签，tableType 为 VIRTUAL_* 或兼容旧 isVirtual 布尔判定，空引擎等字段显示 -）；字段信息（GET column/getColumnsByTableId 渲染表格，末列为「业务含义」双击内联编辑——无 metadata:bizmeta:edit 权限时提示「暂无业务元数据编辑权限」，保存走 COLUMN 级 bizmeta batch 仅写 description 键）；业务元数据（lazy 加载 BusinessMetaPanel，TABLE 级）；数据血缘（lazy 加载 LineagePanel）。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 双击编辑字段业务含义

- **WHEN** 有编辑权限的用户双击某行「业务含义」单元格输入文字并回车
- **THEN** 保存 COLUMN 级 description 后提示「已保存字段"x"的业务含义」

### Requirement: 业务元数据维护

BusinessMetaPanel 必须以 props {bizType, bizId} 驱动：加载 GET /metadata/bizmeta/{bizType}/{bizId} 回显 businessName/description/owner/tags 四键（DB 级 bizId 约定为 `${datasourceId}:${dbName}`）；保存 POST /metadata/bizmeta/batch 全量提交四键 items（空串语义为删除该条），有改动才允许点保存，重置恢复服务端快照。数据源管理页行操作「业务信息」复用同组件（DATASOURCE 级）。bizType 枚举 DATASOURCE/DB/TABLE/COLUMN。权限控制点为 v-hasPermission/$permissionChecker 的 metadata:bizmeta:edit。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 清空责任人保存

- **WHEN** 用户清空 owner 后点击保存
- **THEN** batch 提交 objValue 为空串，后端删除该条 KV

### Requirement: 数据血缘登记与展示（表维度）

LineagePanel 必须：并行拉取 GET /metadata/lineage/graph?direction=upstream&depth=1 与 direction=downstream&depth=1，从 edges 还原上下游两张表（来源标签 AUTO 显示「采集」info、MANUAL 显示「手动」success）；「登记上游/下游」按钮受 metadata:lineage:edit 权限控制，弹窗内关联表远程搜索（排除自身）、依赖类型 DIRECT/TRANSFORM 单选、备注选填；提交前本地去重（同方向已存在该表则警告「该血缘关系已存在」不提交）；上游登记提交 sourceTableId=对方/targetTableId=本表，下游反之。「在血缘图中查看」按钮跳转 /metadata/lineage?tableId=x。删除仅 MANUAL 行可用，DELETE /metadata/lineage/edge/{edgeId} 前需确认「确认删除与"x"的血缘关系吗?」。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 登记重复血缘被拦截

- **WHEN** 对已是上游的表再次登记为上游
- **THEN** 前端警告已存在且不发起请求

### Requirement: 血缘图页面

血缘图页必须提供：顶部表远程搜索（listTable）选中即加载；方向切换 full/upstream/downstream 单选组；GET /metadata/lineage/graph?tableId=&direction=&depth=5 取数（truncated=true 时显示截断提示条「血缘层级超过展示上限(5 跳)…」）；X6 画布渲染自定义节点 lineage-node（160×48 圆角卡片，主标题表名副标题数据源/库，当前表高亮蓝边浅蓝底），BFS 无向分层布局（当前节点 0 层居左、x 步进 240、y 步进 96，孤立节点补 0 层），边统一 targetMarker block 表示流向；画布只读（interacting false）支持平移与滚轮缩放（0.2–2.0 倍）、「适应画布」zoomToFit；节点点击浮层提供「查看表详情」跳 /metadata/table-manager/detail/:tableId 与「以此为起点展开」换中心点重查；支持 URL query.tableId 直达（先 tableDetail 补全选项再加载）；卸载时 graph.dispose()。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 全链路展开超限

- **WHEN** 以 full 方式展开一张处于长链路中的表且返回 truncated=true
- **THEN** 图正常渲染可见部分并在顶部显示黄色截断提示

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 从表详情跳入定位

- **WHEN** 在表详情血缘 Tab 点击「在血缘图中查看」
- **THEN** 血缘图页自动选中该表并以它为中心渲染高亮节点

### Requirement: 元数据定时同步任务

数据源行操作「定时同步」打开 SyncJobDialog：先 GET /metadata/datasource/{datasourceId}/syncJob 查询已有任务（失败提示「查询定时任务失败」），新建 POST、修改 PUT、删除 DELETE 同一路径 /metadata/datasource/{datasourceId}/syncJob；调度周期经 CronTab/CronInput 组件生成 cron 表达式；「同步日志」打开 SyncLogsDialog 展示 GET /metadata/datasource/{datasourceId}/syncLogs 分页日志。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 配置每日定时同步

- **WHEN** 为 MySQL 源设置每天零点的 cron 并保存
- **THEN** syncJob 创建成功，后续可在同步日志中查看逐次执行记录

### Requirement: 元数据域权限规律

权限串遵循 `metadata:<资源>:<动作>` 格式，现存控制点包括 metadata:table:query（表详情入口）、metadata:bizmeta:edit（业务元数据编辑）、metadata:lineage:edit（血缘登记/删除）、metadata:lineage:view（血缘图查看）。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 无血缘编辑权限的用户

- **WHEN** 权限集中不含 metadata:lineage:edit 的用户打开表详情血缘 Tab
- **THEN** 「登记上游/下游」按钮与 MANUAL 行的删除按钮不渲染，仅可查看上下游清单
