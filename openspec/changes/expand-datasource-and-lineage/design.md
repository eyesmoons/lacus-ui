## Context

现有数据源模块(`src/views/metadata/datasource/index.vue`)基于插件化框架:`datasourcePluginApi` 返回数据源类型列表及各类型的 connectionParams 定义(JSON 数组/对象),新增/编辑对话框按插件定义动态渲染表单;元数据同步走 `schemaApi`(库→表懒加载树 + 勾选同步)。表详情页(`src/views/metadata/table/detail.vue`)目前只有"基本信息"与"字段信息"两个 Tab,均为技术侧数据。前端已引入 `@antv/x6`(见 `node_modules/.vite/deps/@antv_x6.js` 缓存),可直接用于血缘图渲染。

本仓库为前端工程(lacus-frontend),后端为独立服务。本变更涉及后端新表与接口,设计文档同时定义前后端契约,实现阶段以前端对接为主、后端接口定义为协作依据。

## Goals / Non-Goals

**Goals:**

- 在不改动静量表单框架的前提下,让 Hive / Kafka / HDFS 通过插件注册接入。
- 为虚拟源引入最小侵入的"虚拟表"标识,复用现有表列表与详情链路。
- 业务元数据采用通用属性模型,一次建模覆盖 datasource/db/table/column 四层级。
- 血缘采用节点表 + 连线表两张表的最小模型,前端用 X6 渲染有向图。

**Non-Goals:**

- 不做字段级血缘(本期仅表级血缘)。
- 不做血缘的自动调度解析引擎(自动登记仅挂接在现有元数据同步流程上,解析规则从简)。
- 不做 Kafka Schema Registry / HDFS 文件格式推断等深度结构化解析(虚拟表的字段信息允许为空,留待后续版本)。
- 不改造既有 MySQL 等常规数据源的连接与同步行为。

## Decisions

### D1. 数据源扩展走现有插件框架,不新建类型体系

Hive 作为普通关系型插件注册(connectionParams 定义 host/port/database/username/password 等),Kafka/HDFS 同样以插件形式注册,仅其 connectionParams 不同(broker 列表 / NameNode URI)。

- 备选:为虚拟源单独建一套"虚拟数据源"实体和页面。放弃——现有 `datasource` 表已有 type 字段,`sourceType`(输入/输出源)也能表达流式语义,单独建实体会导致列表、状态、测试连接、同步入口全部重复实现。

### D2. 虚拟表 = 元数据表记录 + 类型标记

Kafka 的 Topic、HDFS 的目录同步后写入现有表元数据记录,增加 `isVirtual`(或 `tableType`)标记字段区分普通表与虚拟表;虚拟表的库层映射为:Kafka 以 broker 集群为一个逻辑"库"(或直接挂在数据源根下),HDFS 以根路径为一个逻辑"库"。列表页据此渲染"虚拟表"标签。

- 备选:为虚拟表建独立的虚拟表存储。放弃——查询、分页、详情、权限都需要第二套实现,而虚拟表在本期没有独立于普通表的交互差异,一个标记字段即可满足规格要求。

### D3. 业务元数据采用"对象类型 + 对象 ID + 属性 KV"的通用模型

单表 `business_metadata`(biz_type: DATASOURCE/DB/TABLE/COLUMN,biz_id,obj_key: businessName/owner/tags/…,obj_value),前端封装统一的业务元数据 API 与编辑组件,表详情页按层级读写。标签以逗号分隔字符串存储,本期不做独立标签字典管理。

- 备选:每层级建一张宽表(business_table_meta、business_column_meta…)。放弃——四个层级属性高度同构,KV 模型一张表覆盖且后续加层级零成本;代价是无法对属性值做强约束,可接受。

### D4. 血缘两表模型:lineage_node + lineage_edge

- `lineage_node`:id、table_id(关联元数据表,唯一索引)、node_name、node_type(TABLE/VIRTUAL_TABLE/DATASOURCE)、datasource_id、db_name、create_time 等。
- `lineage_edge`:id、source_node_id、target_node_id、dep_type(DIRECT/TRANSFORM)、remark、create_time;(source_node_id, target_node_id) 唯一索引保证去重。

图查询接口按表返回 `{ nodes: [...], edges: [...] }`,支持 `direction=upstream|downstream|full` 参数。前端 X6 渲染,节点为圆角矩形卡片(表名 + 数据源/库副标题),边为带箭头有向边。

- 备选:邻接表单表(只存 from_table_id/to_table_id)。放弃——节点上要挂展示所需的名称、类型等冗余信息,单表会导致每次查询都要回联元数据表,且无法表达非表节点(如数据源级节点)。

### D5. 血缘登记入口放在表详情页与血缘图页

手动登记:表详情页新增"数据血缘"Tab,展示该表的上下游并支持添加/删除关系;血缘图页(`views/metadata/lineage/index.vue`)提供全链路浏览与搜索定位。自动登记:元数据同步完成后,由后端在同一事务内将本次采集到的表间依赖写入两表(首期规则从简,如同步任务内声明的来源表)。

### D6. 权限沿用 RuoYi 风格指令

新增 `metadata:bizmeta:edit`(业务元数据维护)、`metadata:lineage:view` / `metadata:lineage:edit`(血缘查看/维护),沿用 `v-hasPermission` 与后端菜单配置,不引入新的权限机制。

## Risks / Trade-offs

- [虚拟表与普通表混存导致下游逻辑误判] → 所有消费表元数据的列表/详情均显式读取类型标记;后端接口返回体统一携带该字段。
- [KV 业务元数据无强约束,脏数据风险] → 前端表单校验必填项与长度;后端保存时校验 biz_type 合法性。
- [血缘自动解析规则从简,初期覆盖率低] → 以手动登记兜底,并在 UI 上明确区分"自动采集/手动登记"来源,避免用户误信完整性。
- [大血缘图渲染性能] → 图接口默认限制展开深度(如全链路最多 N 跳),X6 画布启用缩放/拖拽;超出阈值时提示缩小范围而非整图铺开。
- [前后端并行开发,契约先行] → 本文档 D2/D3/D4 即接口契约基线;后端未就绪时前端可用 mock 数据开发页面。

## Migration Plan

1. 后端建三张表(lineage_node、lineage_edge、business_metadata),注册 Hive/Kafka/HDFS 插件与表类型标记字段。
2. 前端按契约新增/改造页面,先于后端可用 mock 联调。
3. 上线顺序:插件与表结构 → 数据源/表列表改造 → 业务元数据 → 血缘。均为增量功能,无存量数据迁移;回滚即停用新菜单入口,不影响现有数据源功能。

## Open Questions

- Kafka 虚拟表的"库"层归属(逻辑库名如何命名)需与后端确认,默认方案:以数据源名称作为唯一逻辑库。
- HDFS 目录同步的范围控制(指定根路径还是白名单目录)待定,默认方案:connectionParams 中增加可配置的扫描根路径。
