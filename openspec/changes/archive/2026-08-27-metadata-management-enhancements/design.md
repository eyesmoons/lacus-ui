## Context

See proposal.md — Why（业务元数据表级聚焦、血缘增删改、虚拟库表字段登记）。技术现状约束设计：

- 业务元数据已是通用 KV 机制：`business_metadata` 表 + `BizMetaController`（GET /bizmeta/{type}/{id} 与 POST /bizmeta/batch），前端 `BusinessMetaPanel` 组件化、props {bizType, bizId} 驱动。数据源管理页存在 `DATASOURCE` 级入口（index.vue:320 行操作「业务信息」）。
- 血缘已具备登记/删除/查询：`LineageController`（GET /graph、POST /edge、DELETE /edge/{id}、GET /node）、`lineage_node`/`lineage_edge` 两表（uk_table、uk_src_tgt 唯一键、DEP_TYPE/source_flag 字段），前端 `LineagePanel` 有登记与删除，无编辑。
- 虚拟库表字段目前只读：`meta_db`/`meta_table`/`meta_column` 表已存在；`meta_table.table_type` 支持 `VIRTUAL_KAFKA`/`VIRTUAL_HDFS` 标记（前一轮已完成）；不存在手工登记接口。

## Goals / Non-Goals

**Goals**

- 业务元数据只在表级展示与维护（前端移除数据源级入口），后端 KV 机制保留不动。
- 血缘支持编辑手动登记的边（依赖类型/备注/目标节点），AUTO 不可改删。
- 虚拟数据源下可登记虚拟库/虚拟表/虚拟字段，写 `meta_*` 三表，不碰物理资源。

**Non-Goals**

- 不引入业务元数据实体化（仍为 KV，四键不扩展）。
- 不做血缘的字段级编辑或图形化拖拽改边（仍是表级表单编辑）。
- 虚拟登记不做物理创建（HDFS 建目录、Kafka 建 topic 均非本变更）；不实现虚拟资产的删除/重命名（后续可加）。
- 不改动 `business_metadata`/`lineage_*`/`meta_*` 表结构。

## Decisions

**决策 1：业务元数据收敛通过在**前端移除入口**,后端 KV 机制与 DATASOURCE/DB/TABLE/COLUMN 能力保留。**
`BusinessMetaPanel` 本身无改;删除 `datasource/index.vue` 的「业务信息」行操作按钮、对应弹窗与 `handleBizMeta` 状态。后端 `BizMetaController` 与表支撑不变——DATASOURCE 级若无宿主即自然不可达,但保留可复用于未来宿主。
- 备选:后端拦截 DATASOURCE。被否:增加无谓限制,且云端/后续宿主可能复用;前端收敛已满足 spec「数据源管理页不再提供业务信息入口」。

**决策 2：血缘编辑走**新增 PUT `/metadata/lineage/edge/{edgeId}`**,仅 MANUAL 可编辑,不支持改动源/目标节点 id。**
编辑载荷 `{depType, remark, sourceTableId?, targetTableId?}`:仅传 notes 可改依赖类型/备注;改目标时按方向换算——上游编辑只允许改 sourceTableId,下游只允许改 targetTableId,服务端以「当前节点=source 或 target」判断方向并重建边节点引用(沿用 uk_src_tgt 唯一性,冲突报错)。源/目标校验后端再做一遍(AUTO 边此接口直接 403/400)。前端 `LineagePanel` 把登记弹窗复用于编辑(加载现有值、标题切换、提交走 PUT)。
- 备选:改边用 DELETE+POST 重登记。被否:时序上会先删后插、丢失 MANUAL 标识且两次网络往返风险高;原子 PUT 更贴合。
- 备选:允许编辑 AUTO 边。被否:spec 明确 AUTO 为采集结果,人工改会覆盖下轮采集,只读。

**决策 3：虚拟登记下沉到 meta 三表,新增 `VirtualCatalogController`(端点前缀 `/metadata/virtual`)。**
- 建虚拟库:POST `/metadata/virtual/db` `{datasourceId, dbName, comment}` → 校验数据源存在且为虚拟源(KAFKA/HDFS)→ 查 `meta_db` 按 (datasource_id, db_name) 去重 → `save`。
- 建虚拟表:POST `/metadata/virtual/table` `{datasourceId, dbName, tableName, comment}` → 定位库(按 datasource_id+db_name)→ 按 (db_id, table_name) 去重 → 写 `meta_table`,`table_type`=VIRTUAL_KAFKA 或 VIRTUAL_HDFS(由数据源类型映射)。
- 建虚拟字段:POST `/metadata/virtual/column` `{datasourceId, dbName, tableName, columnName, dataType, comment}` → 定位库/表 → 按 (table_id, column_name) 去重 → 写 `meta_column`。
- 复用 `IMetaDbService`/`IMetaTableService`/`IMetaColumnService`(均继承 `IService`,直接 `save`/`count`/`getOne`);虚拟源判定用 `IMetaDataSourceService.getById(type)` ∈ {KAFKA,HDFS}。
- 权限:复用既有 `metadata:datasource:edit` 作为虚拟登记权限控制点,不新增菜单项(避免本变更引入 sys_menu 迁移)。
- 备选:把方法塞进 SchemaController/现有 Domain。被否:职责混杂,且 SchemaController 是同步语义;独立 `virtual` 域更清晰。备选:复用 `VirtualSourceContext`+插件。被否:登记只写元数据表,不连远程,无需插件上下文。

**决策 4：前端虚拟登记入口放在表管理页与库表浏览侧。**
- 表清单页(`metadata/table/index.vue`)新增「登记虚拟库表」按钮(仅当所选数据源为虚拟源时可用),走一个两级对话框:先选/建虚拟库,再在库下建表,表详情里建字段。
- 库/表/字段详情区提供对应「新增」入口(虚拟源才显示)。判定「虚拟源」:数据源类型为 KAFKA/HDFS(`VIRTUAL_DATASOURCE_TYPES` 已有前端常量)。
- 入口与操作受 `metadata:virtual:edit`(即 `metadata:datasource:edit`)与其他既有权限联合控制;无权限只读。

**决策 5：登记成功后的回显复用现有列表/详情接口。**
建库/表/字段成功后前端 `getList()`/`getColumnsByTableId` 刷新即可看到;不新增专门的"登记结果"接口。虚拟表详情沿用既有表详情页(无专项差异)。字段 `dataType` 由用户输入(默认 `string`)。

## Risks / Trade-offs

- [血缘编辑改目标时方向换算出错,导致上下游颠倒] → 前端编辑仅在原方向内改(上游编辑只改 source、下游只改 target);后端以 edge 现有 source/target 与当前节点关系校验方向一致性,不符则拒绝。
- [虚拟登记重名并发插入] → 依赖 uk 唯一键(MetaDb/Table/Column 均已有或按唯一键先查),冲突落 INSERT 异常 → 上层转"已存在"提示;单机场景可接受。
- [虚拟源判定仅靠 type 名字符串,插件/字典漂移] → 判定收敛为 `DatasourceTypeEnum.MESSAGE_QUEUE/DISTRIBUTED_FILE` 的类型编号比较(与插件 getType 一致),不靠字符串。
- [移除数据源级入口若有旧数据残留] → business_metadata DATASOURCE 行保留但不展示,无清理动作(不破坏性)。

## Migration Plan

- 部署:前端合并后数据源页入口即消失;后端新增 PUT edge 与 /metadata/virtual/* 端点随版本发布,无表变更、无数据迁移。
- 回滚:前端恢复数据源页入口、后端移除新端点即可;`meta_*` 中新增的 VIRTUAL 记录与手动登记的边可保留或清理,均不需迁移脚本。

## Open Questions

- 虚拟资产是否需要删除/重命名——本变更只做新增(新增即 spec 范围);删除/重命名留待后续变更,不影响当前任务分解。
- 血缘编辑是否允许同时改依赖类型 + 换目标(原子操作)——设计按「可同批提交 depType/remark + 单方向目标」处理,已覆盖组合场景。