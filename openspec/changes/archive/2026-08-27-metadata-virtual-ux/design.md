## Context

See proposal.md — Why（虚拟源行收敛同步按钮、虚拟登记按层级分支、血缘关联表三级联动）。三处均为前端交互优化,后端无改动,复用既有端点：

- 虚拟源判定前端已有 `VIRTUAL_DATASOURCE_TYPES = ['KAFKA','HDFS']` 与 `isVirtualRow`（数据源列表）/`isVirtualDs`（表管理页）。
- 表管理页左侧树（el-tree lazy）：数据源节点 `nodeLevel=1`（含 type/datasourceName/datasourceId），库节点由 `loadDatabaseList` 懒加载（原 `MetaDbModel` 仅 dbId/dbName，缺父数据源信息）。
- 血缘登记弹窗原用 `tableApi.listTable({tableName})` 远程搜索关联表；后端 `listTable` 已支持 `datasourceId + dbName` 过滤（TableQuery.dbName → getMetaDbs 后过滤），可供给三级联动。

## Goals / Non-Goals

**Goals**

- 虚拟源列表行仅展示与虚拟源相关的操作（测试/编辑/删除），移除误导性的同步入口。
- 虚拟登记「登记虚拟库表」按左侧选中层级明确动作（选数据源→建库、选库→建表），单步闭环。
- 血缘登记/编辑关联表经三级级联选择，编辑按行预填。

**Non-Goals**

- 不改动后端接口与数据模型；`listTable`/`db/list`/`datasource/list` 契约不变。
- 不做常规源同步入口的移除或改造（仅虚拟源收敛）。
- 不引入新的血缘登记校验后端逻辑（仍然依赖既有 add/update edge）。

## Decisions

**决策 1：同步类按钮收敛通过前端 `v-if="!isVirtualRow(row)"` 隐藏。**
在数据源列表行操作三按钮加条件,虚拟源行不渲染。判定纯前端(type 字符串),与「虚拟源」标签共用 `isVirtualRow`。
- 备选:后端按类型下发按钮权限/菜单。被否:按钮是前端交互细节,无接口契约变化;后端改动无必要。

**决策 2：虚拟登记按层级分支,库节点补父数据源信息。**
`loadDatabaseList` resolve 时给每个库节点注入 `parentDsId/parentDsName/parentDsType`（来自父数据源节点 `data`）,使点击库节点时也能获得所属数据源类型（判定虚拟）与 id（建表 API 需要 datasourceId）。`handleNodeClick` 记录 `selectedLevel`(1=数据源,2=库)、`currentDbId/currentDbName`;`openCreateDb` 按层级设 `virtualStep`(1=建库,2=建表)并单步提交。
- 备选:两级弹窗「下一步」串联。被否:不符合"先选目标再登记"直觉,且库已存在时不应再强制建库。
- 备选:点击库节点从 el-tree 父节点回溯取数据源。被否:el-tree lazy 子节点 data 不自带父引用,需手动注入,方案 A 更直接。

**决策 3：血缘关联表三级联动,复用既有列表端点。**
登记/编辑弹窗用三个 `el-select` 级联：数据源 `getDatasourceList('', null)` → 库 `dbApi.getDatasourceList(dsId)` → 表 `tableApi.listTable({datasourceId, dbName})`（排除当前表）。`openEdit` 按血缘行 `datasourceId/dbName/tableId` 预填三级（先加载数据源选中、再加载库选中、再加载表选中）。空态禁用下一级并清空。
- 备选:单 select + `remote-method` 输入表名(现状)。被否:手动输入依赖记忆、无级联上下文,编辑回显困难。
- 备选:el-cascader。被否:三独立 select 更契合平台风格且编辑预填更直接。

## Risks / Trade-offs

- [库节点注入 parentXXX 字段与 MetaDbModel 序列化共存] → 前端 resolve 时 spread 合并,不触碰后端返回字段;`isLeaf=true` 库为叶子,不影响懒加载。
- [三级联动表数据量大(单库上万表)加载慢] → 复用既有 listTable,分页由平台列表处理;登记弹窗场景为选取单表,可接受。可选后续加载滚动优化。
- [编辑血缘改选关联表影响方向换算] → 沿用既有 submitAdd 编辑分支(UPSTREAM 只改 source/DOWNSTREAM 只改 target),三级联动仅替换表选择 UI,方向与验证逻辑不变。

## Migration Plan

- 部署:纯前端改动,随前端版本发布;无后端重启、无数据迁移。
- 回滚:恢复三文件到改动前即可;接口与数据无变化。

## Open Questions

- 三级联动是否需要支持"跨数据源任意选表"的场景——当前按数据源一级过滤,默认展示全部数据源;若未来需按当前数据源预过滤,可在 `openEdit`/`openAdd` 传入默认 dsId 调整,不影响当前 spec 与任务分解。