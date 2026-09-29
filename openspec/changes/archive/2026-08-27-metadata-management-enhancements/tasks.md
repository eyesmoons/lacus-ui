## 1. 后端：血缘编辑（PUT /edge）

- [x] 1.1 在 `ILineageService` 增加 `updateEdge(Long edgeId, String depType, String remark, Long sourceTableId, Long targetTableId)`；在 `LineageServiceImpl` 实现：校验边存在且 `source_flag=MANUAL`（否则抛 `CustomException("仅手动登记的血缘可编辑")`），校验方向一致性与节点存在（改 source 仅适用于当前节点为 target 的边，改 target 反之，`getNodeByTableId` 存在），`updateById` 更新
- [x] 1.2 在 `LineageController` 增加 `PUT /metadata/lineage/edge/{edgeId}`（`UpdateEdgeCommand {depType, remark, sourceTableId, targetTableId}`），权限 `@permission.has('metadata:lineage:edit')`
- [x] 1.3 后端编译验证：`mvn -o -pl lacus-admin -am compile` 通过

## 2. 后端：虚拟库/表/字段登记（/metadata/virtual/*）

- [x] 2.1 新增 `VirtualCatalogBusiness`（lacus-domain/metadata/virtual）：提供 `createDb(datasourceId, dbName, comment)`、`createTable(datasourceId, dbName, tableName, comment)`、`createColumn(datasourceId, dbName, tableName, columnName, dataType, comment)`；校验数据源存在且为虚拟源（`datasource.getType()` ∈ {KAFKA, HDFS}，否则 `CustomException("仅虚拟数据源支持虚拟登记")`）；按类型映射 table_type（KAFKA→VIRTUAL_KAFKA，HDFS→VIRTUAL_HDFS）
- [x] 2.2 复用 `IMetaDataSourceService`/`IMetaDbService`/`IMetaTableService`/`IMetaColumnService`（均继承 IService）：建库按 `(datasource_id, db_name)` 查重、建表按 `(db_id, table_name)` 查重、建字段按 `(table_id, column_name)` 查重，重复抛 `CustomException("xxx已存在")`
- [x] 2.3 新增 `VirtualCatalogController`（lacus-admin/controller/metadata，`@RequestMapping("/metadata/virtual")`）：POST `/db`、`/table`、`/column` 三个端点，权限统一 `@permission.has('metadata:datasource:edit')`，请求体用三个命令 DTO
- [x] 2.4 后端编译验证：`mvn -o -pl lacus-admin -am compile` 通过

## 3. 前端：移除数据源级业务元数据入口

- [x] 3.1 `src/views/metadata/datasource/index.vue`：删除行操作「业务信息」按钮、`bizMetaDialogVisible`/`bizMetaDatasourceId`/`bizMetaDatasourceName` 状态、`handleBizMeta` 函数、`<BusinessMetaPanel>` 弹窗区块及 `BusinessMetaPanel` import
- [x] 3.2 前端编译/构建验证：`npm run build`（或 `npx vite build`）无报错；表详情页业务元数据 Tab 仍正常（detail.vue 不动）

## 4. 前端：血缘编辑（LineagePanel）

- [x] 4.1 `src/api/metadata/lineageApi.js` 新增 `updateLineageEdge(edgeId, data)`：`PUT /metadata/lineage/edge/{edgeId}`
- [x] 4.2 `src/views/metadata/table/components/LineagePanel.vue`：上游/下游表增加「编辑」按钮（仅 `sourceFlag === 'MANUAL'` 行、受 `metadata:lineage:edit` 控制）；登记弹窗复用为编辑模式——传入 `{edgeId, direction, sourceFlag, depType, remark}` 回显、标题切「编辑」，保存时按方向组装 source/target 调 PUT
- [x] 4.3 前端构建验证通过（`npm run build`）

## 5. 前端：虚拟库/表/字段登记

- [x] 5.1 新增 `src/api/metadata/virtualApi.js`：`createDb(data)`、`createTable(data)`、`createColumn(data)`（POST `/metadata/virtual/db|table|column`）
- [x] 5.2 `src/views/metadata/table/index.vue`：新增「登记虚拟库表」入口（仅当所选数据源为虚拟源 KAFKA/HDFS 时显示，`VIRTUAL_DATASOURCE_TYPES` 判定 + 受 `metadata:datasource:edit` 控制）；两级对话框：第一步选/建虚拟库、第二步在库下建虚拟表
- [x] 5.3 表详情页/字段区：虚拟表下可登记虚拟字段（复用 `createColumn` 弹窗）；入库成功后 `getList()`/`getColumnsByTableId` 刷新回显
- [x] 5.4 前端构建验证通过（`npm run build`）

## 6. 端到端验证

- [x] 6.1 后端全量编译 `mvn -o compile` 通过（reactor 12 模块 BUILD SUCCESS）
- [ ] 6.2 后端启动，`meta_datasource` 建 KAFKA/HDFS 虚拟源后：POST /metadata/virtual/db、/table、/column 依次成功，重名返回明确错误；`meta_db`/`meta_table`/`meta_column` 落库且 table_type 为 VIRTUAL_*（实施完成,需启动联调）
- [ ] 6.3 血缘：手工登记→编辑（depType/remark）→图查询验证更新 → 删除成功；AUTO 边缺少编辑/删除入口（前端）或后端拒绝（实施完成,需启动联调）
- [ ] 6.4 前端：数据源管理页不再出现「业务信息」入口；表详情页业务元数据 Tab 可编辑保存；虚拟源下可登记虚拟库/表/字段并在表清单/详情回显（实施完成,需启动前后端联调）