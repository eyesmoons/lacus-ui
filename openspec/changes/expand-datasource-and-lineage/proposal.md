# 扩展数据源支持与元数据血缘能力

## Why

当前元数据中心的数据源模块仅覆盖常规关系型数据库(如 MySQL),无法接入大数据场景中主流的 Hive 数仓,也不支持以 Kafka、HDFS 为代表的"虚拟数据源"(无库表结构或结构需从消息/文件中推断的源)。同时,平台只采集了技术侧的表与字段信息,缺少业务元数据(业务含义、责任人、业务标签等)的挂载点,也没有数据血缘能力,用户无法回答"这张表的数据从哪来、被谁使用"这类问题,制约了元数据中心作为数据资产地图的可用性。

## What Changes

- **新增 Hive 数据源支持**:在现有数据源插件化框架(datasourcePlugin)下注册 Hive 类型,复用现有的连接配置动态表单、测试连接、元数据同步(库→表→字段)链路。
- **新增虚拟数据源支持(Kafka、HDFS)**:引入"虚拟表"概念——对 Kafka(Topic 即表)与 HDFS(目录即表)不强制传统 host/port 库表模型,连接参数由各自插件定义;同步时生成对应的虚拟表元数据记录,在元数据列表中以"虚拟表"标识区分。
- **新增业务元数据管理**:为数据源、库、表、字段提供业务属性维护能力,包括业务名称、业务描述、责任人(owner)、业务标签/分类等,支持在表详情页查看与编辑。
- **明确技术元数据的采集范围**:将现有同步得到的库表字段结构、类型、引擎、创建时间等信息归入"技术元数据",与业务元数据在表详情页分区展示。
- **新增数据血缘能力**:提供血缘图的可视化展示(表级血缘,基于画布渲染节点与连线);后端通过两张表实现——血缘节点表(存储节点信息:表/数据源标识、节点类型等)与血缘连线表(存储边信息:源节点、目标节点、依赖类型)。血缘关系可由元数据同步自动解析(如同数据源内的导入任务)并支持手动登记。

## Capabilities

### New Capabilities

- `datasource-type-expansion`: 数据源类型扩展——Hive 常规数据源与 Kafka/HDFS 虚拟数据源的注册、连接配置、测试连接与元数据同步行为。
- `metadata-management`: 元数据管理——技术元数据(库/表/字段结构与属性)与业务元数据(业务名称、描述、责任人、标签)的查看、编辑与分区展示。
- `data-lineage`: 数据血缘——血缘节点与连线的数据模型(两张表:节点表、连线表)、血缘关系的采集/手动登记方式,以及前端血缘图的可视化浏览。

### Modified Capabilities

<!-- 现有 openspec/specs 下仅有 login-page,与本变更无关,无修改能力。 -->

## Impact

- **前端页面**:`src/views/metadata/datasource/index.vue`(新增/编辑表单需适配虚拟源的连接参数与提示)、`src/views/metadata/table/index.vue`(虚拟表标识列)、`src/views/metadata/table/detail.vue`(新增"业务元数据"Tab 与技术/业务分区)。
- **前端新增**:血缘图页面(建议 `src/views/metadata/lineage/index.vue`,基于项目已有的 @antv/x6 画布依赖实现节点/连线渲染)、血缘 API 封装(`src/api/metadata/lineageApi.js`)、业务元数据 API(`src/api/metadata/businessMetaApi.js`)。
- **API 契约**(需后端配合):
  - 数据源插件注册:Hive / Kafka / HDFS 插件及其 connectionParams 定义。
  - 业务元数据:查询/保存接口(按层级 datasource/db/table/column 挂载)。
  - 血缘:节点表(lineage_node)与连线表(lineage_edge)的增删改查、按表查询上游/下游/全链路图数据接口。
- **权限**:沿用 `metadata:datasource:*` 权限模式,新增业务元数据编辑、血缘查看权限项。
- **依赖**:血缘图渲染复用项目已有 `@antv/x6`,无需新增依赖。
