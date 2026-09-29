## 1. 前端：虚拟源列表行收敛同步按钮

- [x] 1.1 `src/views/metadata/datasource/index.vue`：「同步元数据」「定时同步」「同步日志」三个行操作按钮加 `v-if="!isVirtualRow(scope.row)"`,虚拟源(KAFKA/HDFS)行隐藏,常规源不变
- [x] 1.2 前端构建验证通过（`npm run build:prod`）

## 2. 前端：虚拟登记按左侧层级分支

- [x] 2.1 `src/views/metadata/table/index.vue`：`loadDatabaseList` 给库节点补父数据源信息（parentDsId/parentDsName/parentDsType）
- [x] 2.2 `handleNodeClick` 记录选中层级（selectedLevel 1/2）与当前库（currentDbId/currentDbName）;新增 `virtualBtnTip` 动态提示
- [x] 2.3 `openCreateDb` 按层级分支（选数据源→建库弹窗,选库→建表弹窗）;`submitVirtualStep` 单步提交（去掉「下一步/上一步」）,建库后刷新左侧树
- [x] 2.4 弹窗模板按层级渲染建库/建表表单,标题与确认按钮文案动态（「登记虚拟数据库/登记虚拟表」「创建库/创建表」）
- [x] 2.5 前端构建验证通过（`npm run build:prod`）

## 3. 前端：血缘登记关联表三级联动

- [x] 3.1 `src/views/metadata/table/components/LineagePanel.vue`:登记/编辑弹窗关联表由远程搜索改为 数据源→数据库→表 三个级联 el-select（getDatasourceList→dbApi.getDatasourceList(dsId)→tableApi.listTable({datasourceId,dbName})）
- [x] 3.2 切换数据源加载库、切换库加载表,自动排除当前表;空态禁用下一级
- [x] 3.3 `openEdit` 按血缘行 datasourceId/dbName/tableId 三级预填并可改选
- [x] 3.4 前端构建验证通过（`npm run build:prod`）

## 4. 端到端验证

- [ ] 4.1 前端起 dev server,数据源列表虚拟源行确认无同步三元组、常规源仍然有（需启动前端联调）
- [ ] 4.2 表管理页:选中虚拟数据源→「登记虚拟数据库」建库;选中虚拟库→「登记虚拟表」建表;按钮禁用态与提示正确（需启动前端联调）
- [ ] 4.3 血缘登记/编辑弹窗三级联动选表、编辑预填正确（需启动前端联调）