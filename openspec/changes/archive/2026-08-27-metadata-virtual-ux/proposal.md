## Why

元数据管理在联调中发现三处交互不符合虚拟源/血缘的使用直觉：虚拟数据源（KAFKA/HDFS）自身无同步语义却在列表提供「同步元数据/定时同步/同步日志」入口；虚拟登记入口未随左侧树选中层级变化（固定两步建库—建表，无法直接在虚拟库下建表）；血缘登记关联表需手动输入表名搜索，与平台其他表选取（级联下拉）体验割裂。

## What Changes

- **虚拟源列表收敛行操作**：数据源管理页对 KAFKA/HDFS（虚拟源）行隐藏「同步元数据」「定时同步」「同步日志」三个按钮——虚拟源无 JDBC 同步业务语义，仅保留测试连接/编辑/删除；常规源行为不变。
- **虚拟登记按左侧层级分支**：表管理页左侧树选中**数据源**（层级1）时「登记虚拟库表」弹窗为「登记虚拟数据库」（建库）；选中**虚拟库**（层级2）时弹窗为「登记虚拟表」（表名输入、库只读预填）——单步提交，取消原「下一步/上一步」两步流程；悬停提示随选中层级动态说明。
- **血缘登记三级联动选表**：LineagePanel 登记/编辑弹窗的关联表由"输入表名远程搜索"改为**数据源→数据库→表**三级下拉联动——切换数据源加载库、切换库加载表、自动排除当前表与已登记邻居；编辑时按当前血缘行三级预填并可改选。

无破坏性变更（**BREAKING**: 无）。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `metadata-domain`: 数据源列表行操作对虚拟源收敛（移除同步三元组）；数据血缘登记关联表改为三级联动选择（数据源→库→表）。
- `virtual-metadata-registration`: 虚拟登记按左侧树选中层级分支——选中数据源建库、选中虚拟库建表，登记录入层级语义明确。

## Impact

- **前端 `lacus-frontend`**（仅前端，无后端改动）：
  - `src/views/metadata/datasource/index.vue`：三个同步类按钮加 `!isVirtualRow()` 条件隐藏。
  - `src/views/metadata/table/index.vue`：`loadDatabaseList` 给库节点补父数据源信息（parentDsId/Name/Type）；`handleNodeClick` 记录选中层级（selectedLevel 1/2）与当前库；`openCreateDb`/`submitVirtualStep` 按层级分支单步提交；弹窗模板按层级渲染建库/建表表单并动态标题与按钮文案。
  - `src/views/metadata/table/components/LineagePanel.vue`：登记/编辑弹窗关联表由远程搜索改为 `el-select` 三级联动（数据源 `getDatasourceList` → 库 `dbApi.getDatasourceList(dsId)` → 表 `tableApi.listTable({datasourceId, dbName})`），编辑预填当前血缘行三级并保留改选。
- **后端 `lacus-backend`**：无改动（`listTable` 已支持 `datasourceId+dbName` 过滤，供给三级联动的表加载）。
- **数据/接口**：无 schema 或接口契约变更；三级联动完全复用既有 `listTable`/`db/list`/`datasource/list` 端点。