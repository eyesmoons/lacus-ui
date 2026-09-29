## 1. 数据源类型扩展(Hive / Kafka / HDFS)

- [ ] 1.1 与后端确认并注册 Hive、Kafka、HDFS 插件记录(datasourcePlugin 列表可见,connectionParams 定义完整:Hive 为 host/port/database/username/password,Kafka 为 broker 地址,HDFS 为 NameNode URI + 扫描根路径)
- [x] 1.2 数据源列表页支持展示新类型,新增/编辑对话框对虚拟源(Kafka/HDFS)渲染对应动态连接表单并调整必填校验(ip/port 等常规字段不再强制)
- [ ] 1.3 验证 Hive/Kafka/HDFS 数据源的创建、测试连接、启用/停用链路(可先用 mock/本地后端)

## 2. 虚拟表元数据同步与标识

- [ ] 2.1 与后端确认虚拟表同步契约:Kafka Topic → 虚拟表、HDFS 目录 → 虚拟表,表元数据返回体携带 isVirtual/tableType 标记
- [x] 2.2 元数据表列表页(`views/metadata/table/index.vue`)增加类型列,虚拟表显示"虚拟表"标签,普通表不受影响
- [x] 2.3 表详情页对虚拟表做兼容展示(引擎等不适用字段允许为空)
- [ ] 2.4 对 Kafka/HDFS 数据源触发元数据同步,验证虚拟表生成并在列表正确标识

## 3. 业务元数据

- [ ] 3.1 与后端确认 business_metadata KV 模型契约(biz_type/biz_id/obj_key/obj_value)及查询、批量保存接口
- [x] 3.2 新建 `api/metadata/businessMetaApi.js`,封装按对象层级(DATASOURCE/DB/TABLE/COLUMN)查询与保存
- [x] 3.3 表详情页新增"业务元数据"Tab:业务名称、业务描述、责任人、标签的查看与编辑保存;技术元数据保留原 Tab 并明确分区
- [x] 3.4 字段信息列表支持按字段填写业务含义(列级编辑入口),保存后回显
- [ ] 3.5 数据源管理页支持维护数据源级业务元数据(责任人、业务描述)
- [ ] 3.6 权限接入:`metadata:bizmeta:edit` 控制编辑入口,只读用户仅可查看

## 4. 数据血缘

- [ ] 4.1 与后端确认 lineage_node / lineage_edge 两表结构与图查询接口(direction=upstream|downstream|full,返回 nodes+edges)
- [x] 4.2 新建 `api/metadata/lineageApi.js`:节点/连线 CRUD、按表查上游/下游/全链路
- [x] 4.3 新建血缘图页面 `views/metadata/lineage/index.vue`:基于 @antv/x6 渲染节点卡片(表名+数据源/库副标题)与有向连线,支持缩放、拖拽、搜索定位到指定表
- [x] 4.4 表详情页新增"数据血缘"Tab:展示该表上下游列表,支持手动添加/删除血缘关系(选择关联表 + 依赖类型 + 备注)
- [x] 4.5 血缘去重校验:同一(源,目标)重复登记时前端提示且不提交重复请求
- [x] 4.6 注册路由与菜单(血缘图页),权限项 `metadata:lineage:view` / `metadata:lineage:edit` 接入 v-hasPermission
- [ ] 4.7 大图保护:全链路展开深度限制与超限提示

## 5. 联调与验收

- [ ] 5.1 全流程回归:既有 MySQL 数据源的新增/测试/同步/列表行为不受影响
- [ ] 5.2 按三个能力规格逐条核对验收场景(Hive 连接、虚拟表标识、业务元数据回显、血缘图交互等)
- [x] 5.3 构建检查通过(npm run build 或 lint 无新增错误)
