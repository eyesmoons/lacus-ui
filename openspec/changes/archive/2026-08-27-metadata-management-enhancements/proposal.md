## Why

当前业务元数据入口同时出现在数据源与表详情两个层级，与"业务元数据是表资产描述"的定位相悖；数据血缘仅支持登记与删除，缺少对已登记关系的编辑能力；虚拟数据源（KAFKA/HDFS）浏览只读，无法在元数据层面手工登记虚拟数据库/虚拟表/虚拟字段，限制了用户对虚拟资产的建模与管理。

## What Changes

- **业务元数据聚焦表级**：移除数据源列表上的"业务信息"入口（`datasource/index.vue` 的 `biz-type="DATASOURCE"` 弹窗），业务元数据仅保留表级维护（`detail.vue` 的 `biz-type="TABLE"`）；后端 `meta_datasource` 不再作为业务元数据宿主。
- **数据血缘登记增删改完善**：新增血缘关系"修改"能力（编辑依赖类型/备注；改目标节点），登记时支持检索并校验源/目标存在；删除仍限定 MANUAL 来源，AUTO 采集的边不可手工删改。
- **虚拟库/表/字段元数据登记**：为虚拟数据源（KAFKA/HDFS）提供手工登记能力——在虚拟数据源下新增虚拟数据库、虚拟数据库下新增虚拟表（带 `VIRTUAL_KAFKA`/`VIRTUAL_HDFS` 类型标记）、虚拟表下新增虚拟字段；登记仅写入 `meta_db`/`meta_table`/`meta_column`，不创建物理资源。

无破坏性变更（**BREAKING**: 无）。

## Capabilities

### New Capabilities
- `virtual-metadata-registration`: 虚拟数据源（KAFKA/HDFS）下虚拟数据库/虚拟表/虚拟字段的元数据登记能力——仅写库表字段元数据（带 VIRTUAL 类型标记），不产生物理资源。

### Modified Capabilities
- `metadata-domain`: 业务元数据定位收敛为表级（移除数据源级入口）；数据血缘登记与展示增加"修改边缘"能力与登记校验。

## Impact

- **前端 `lacus-frontend`**：
  - `src/views/metadata/datasource/index.vue`：移除数据源级业务信息入口与对应对话框。
  - `src/views/metadata/table/components/BusinessMetaPanel.vue`：保持表级，无逻辑改（去除数据源级调用即完成收敛）。
  - `src/views/metadata/table/components/LineagePanel.vue`：登记对话框增加"编辑"复用，新增修改操作按钮与表单校验。
  - `src/views/metadata/table/index.vue` 或详情页：新增虚拟库/表/字段登记入口与对话框（选择虚拟数据源→新增虚拟库→虚拟库下新增虚拟表/字段）。
  - `src/api/metadata/lineageApi.js`：新增 `updateLineageEdge`；`virtualApi.js`（或复用 schema/table/column api）新增虚拟登记端点。
- **后端 `lacus-backend`**：
  - `lacus-admin/controller/metadata/LineageController.java`：新增 `PUT /metadata/lineage/edge/{edgeId}`（改 depType/remark/目标节点，仅 MANUAL）。
  - `lacus-domain/metadata/schema/SyncSchemaBusiness.java` 或新建 `lacus-domain/metadata/virtual`：虚拟库/表/字段登记逻辑（入库 `meta_db`/`meta_table`/`meta_column`）。
  - `lacus-admin/controller/metadata/`：新增虚拟登记 Controller（如 `VirtualCatalogController`）或扩展 SchemaController。
  - `lacus-service/metadata/`：`IMetaDbService`/`IMetaTableService`/`IMetaColumnService` 直接复用（插入记录）。
  - 血缘 `LineageServiceImpl`：`updateEdge` 实现（校验 MANUAL、节点存在）。
- **数据表**：复用既有 `meta_db`/`meta_table`/`meta_column` 与 `lineage_node`/`lineage_edge`，无 schema 变更；虚拟表以 `meta_table.table_type` 的 `VIRTUAL_*` 标记区分。
- **权限**：复用 `metadata:lineage:edit`（血缘改删）、`metadata:datasource:edit`（虚拟登记）作为控制点。