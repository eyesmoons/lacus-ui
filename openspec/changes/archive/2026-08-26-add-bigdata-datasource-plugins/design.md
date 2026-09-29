## Context

See proposal.md — Why for motivation. 技术现状决定了本设计的关键约束：

- 插件 SPI 已就绪：`DataSourcePlugin` 经 `@AutoService` + `ServiceLoader` 注册，`DataSourcePluginManager` 启动时全量扫描并 upsert 进 `meta_datasource_plugin`（按 `getName()` 主键），同时维护内存 map（`getProcessor(name)` 按类型名返回插件）。
- 数据源实体 `MetaDatasourceEntity.type` 存的是 **插件名称字符串**（如 `MYSQL`、`KAFKA`），用于 `getProcessor`；而 `MetaDatasourcePlugin.type` 与插件 `getType()` 返回的是 **类型大类编号**（`DatasourceTypeEnum`：1 关系型 / 2 NoSql / 3 OLAP），用于数据字典与分类展示。两者职责不同，新插件需同时声明名称与类别。
- `DataSourcePlugin` 接口偏 JDBC：`getJdbcUrl` / `getConnection` / `createDataSource→DruidDataSource`。运行时调用点：`DatasourceBusiness`（新增/更新/测试时经 `testConnection` 门控落库）、`DynamicDataSourceContextHolder.setDataSourceId`（不经判断直接 `createDataSource` 做查询路由）、`SchemaController`（`listSchemaTable` 等元数据浏览）。
- 可复用资产：`lacus-common` 已有 `HdfsUtil`、Hadoop 配置（core-site.xml / hdfs-site.xml）、Kerberos 引导；根 `pom.xml` 已有 `kafka-clients 3.6.1`；`SyncSchemaBusiness` 已支持 `VIRTUAL_*` 类型的虚拟表持久化。
- 前端已把 `KAFKA` / `HDFS` 识别为虚拟数据源类型，表单按插件 `connectionParams` 定义驱动渲染。

## Goals / Non-Goals

**Goals:**

- 让 HDFS、Hive、Kafka 三种插件通过既有 SPI 注册入库，复用"测试连接通过才落库"的既有流程。
- 三插件各自提供连接参数契约、可靠的连接测试语义、可用的元数据浏览（目录 / 库表 / Topic）。
- 不破坏现有 6 个 JDBC 插件的接口与行为，保持 `DataSourcePlugin` 签名稳定。
- 虚拟/非 JDBC 数据源被误用作 JDBC 查询路由时得到受控、可读的错误。

**Non-Goals:**

- 不改动前端：KAFKA/HDFS 虚拟源表单已按插件定义驱动；HIVE 类型随插件注册自然出现（前端对新类型的专项交互为后续任务）。
- 不重构 `DataSourcePlugin` 为 JDBC/非 JDBC 子接口两套体系（见决策 1）。
- 不改变 `SyncSchemaBusiness` 的虚拟表持久化机制（仅复用其 `VIRTUAL_*` 表类型能力）。
- 不实现跨数据源的统一 SQL 下推、不实现 Hive/Kafka 的实时血缘采集。

## Decisions

**决策 1：接口签名保持不变，非 JDBC 插件对 JDBC 专属方法给出受控实现。**
Hive 是 JDBC 源（HS2），照常实现 `getJdbcUrl` / 继承基类 `testConnection`；HDFS、Kafka 的 `getJdbcUrl` / `getConnection` / `createDataSource` 抛业务异常（如 `CustomException("该数据源类型不支持 JDBC 连接")`），以便既有代码路径在误用时得到明确错误而非空指针/崩溃。
- 备选：新增 `JdbcDataSourcePlugin` 子接口并把 JDBC 方法下沉。被否：会让现有 6 个插件与所有调用点产生接口级改动，违背"非破坏"目标；且元数据浏览、参数定义、`testConnection` 本就是三插件共享契约。
- 注意：`AbstractDataSourcePlugin.testConnection` 委托 `getConnection`，因此 HDFS/Kafka 必须重写 `testConnection`（见决策 4）。

**决策 2：类型大类扩展 `DatasourceTypeEnum`。**
新增三个枚举：`DISTRIBUTED_FILE(4, "分布式文件系统")`、`MESSAGE_QUEUE(5, "消息队列")`、`DATA_WAREHOUSE(6, "数据仓库")`。插件 `getType()` 分别返回对应枚举值；`datasource_type` 字典随之展示三类。类型名保持英文大写（`DISTRIBUTED_FILE` 等）与现有 `RELATIONAL` 风格一致。
- 数据源实体的 `type`（插件名 `HDFS`/`KAFKA`/`HIVE`）与分类编号互不影响：前者查插件，后者做字典/分类。
- 备选：Hive 复用 `RELATIONAL`、Kafka 复用 `NON_RELATIONAL`。被否：分类不准确，字典无法体现引擎差异，且未来按类型筛选数据源会失真。

**决策 3：插件类落在 `com.lacus.datasource.plugins`，命名与参数契约与现有插件一致。**
三个新类 `HdfsDataSourcePlugin` / `HiveDataSourcePlugin` / `KafkaDataSourcePlugin` 均 `@AutoService(DataSourcePlugin.class)` + `@Component`，`getName()` 返回 `HDFS`/`HIVE`/`KAFKA`（与前端虚拟源类型名一致）。参数定义按 spec 所述 key 集合构建 `ParamDefinitionDTO`（含 `defaultValue/required/inputType/order/validation`）。
- `driverName`：Hive 为 `org.apache.hive.jdbc.HiveDriver`；HDFS/Kafka 无 JDBC 驱动，返回其主客户端类（`org.apache.hadoop.fs.FileSystem` / `org.apache.kafka.clients.admin.AdminClient`）用于登记展示。
- `icon`：沿用现有命名 `HDFS.png` / `Hive.png` / `Kafka.png`；前端若本地无对应图标资源则回退占位（见 Open Questions）。

**决策 4：连接测试各自实现，覆盖基类默认的 JDBC 委托。**
- Hive：继承 `AbstractDataSourcePlugin` 的 JDBC 测试路径，`buildJdbcUrl` 组装 `jdbc:hive2://host:port/database`，按 `authType` 追加参数（NOSASL 默认；KERBEROS 复用 common 的 kerberos 引导；LDAP 走用户名/密码）。失败落 SQLException → 上层以"数据源连接失败"呈现。
- HDFS：用 Hadoop `FileSystem`（结合 `defaultFS` + `user`，复用 `HdfsUtil` 的配置/kerberos 装配）对 `/` 执行 `getFileStatus`；`IOException`（不可达/权限）→ false。
- Kafka：构造 `AdminClient`（`bootstrapServers` + 可选 SASL：`securityProtocol`/`saslMechanism`/`username`/`password`），限时执行 `describeCluster()`；拿到 clusterId → true，异常/超时 → false。
- 三者在抛错路径统一收敛为上层 `DatasourceBusiness` 已有的 `CustomException("数据源连接失败")`，不向调用方泄漏原始异常。

**决策 5：元数据浏览各自映射，复用虚拟表类型。**
- Hive：JDBC `SHOW DATABASES` / `SHOW TABLES IN db` / `DESC table`（或 `DatabaseMetaData`），字段含列名/类型。
- HDFS：`FileSystem.listStatus`：`/` 顶层目录→`SchemaDbEntity`，其下子目录→`SchemaTableEntity`，目录内条目（文件名）→`SchemaColumnEntity`；解析失败返回空集合。
- Kafka：`AdminClient.listTopics` → `SchemaTableEntity`（Topic 名，按既有约定标 `VIRTUAL_KAFKA` 表类型），`describeTopics` 补充分区/副本信息；库固定为单一集群库。
- 三者的返回沿用 `SyncSchemaBusiness` 既有 `VIRTUAL_*` 表类型持久化，人工元数据浏览（`SchemaController.listSchemaTable`）直接走插件方法。

**决策 6：动态路由守卫集中在 `DynamicDataSourceContextHolder`。**
在 `setDataSourceId` 触发 `createDataSource` 前按插件所属类型大类拦截：`DISTRIBUTED_FILE` / `MESSAGE_QUEUE` 类数据源拒绝路由，抛"该数据源类型不支持 JDBC 查询路由"；`DATA_WAREHOUSE`（Hive）为 JDBC 源放行。
- 备选：给 `DataSourcePlugin` 增加 `supportsJdbc()` 能力方法。被否：接口签名非破坏目标优先，且类型大类已足够表达路由能力，改动面最小。

**决策 7：依赖只加必要项，版本对齐根 pom。**
- `kafka-clients`（version 3.6.1，根 pom 已声明）加入 `lacus-datasource-plugin`。
- `hive-jdbc` 加入模块，排紧传递依赖（guava/hadoop 冲突面），版本与项目已用版本一致。
- HDFS 复用 `lacus-common` 已内聚的 Hadoop 客户端（`HdfsUtil` 所在 classpath），如模块编译期不可见再以 `hadoop-client` 增补并声明 provided。

## Risks / Trade-offs

- [Hive JDBC 传递依赖重、易与项目内 Hadoop/guava 版本冲突] → 排紧 `hive-jdbc` 传递依赖，限定模块内使用，模块级单测验证连接。
- [Hadoop FileSystem 类路径陈旧或被 Flink 侧旧类污染] → 复用 `lacus-common` 已定版 Hadoop 客户端，避免在插件模块内另引一套版本。
- [Kerberos 装配复杂度（keytab、ticket cache）] → 复用 `HdfsUtil` / common 的 Kerberos 引导，SIMPLE 为默认认证，Kerberos 后置接入。
- [`createDataSource` 行为从"返回池"变为"抛异常"，若被其他路径误调会抛错] → 路由守卫在唯一已知调用点（`DynamicDataSourceContextHolder`）先行拦截；异常文案明确可排查。
- [Kafka SASL 协议组合多（PLAINTEXT/SASL_PLAINTEXT/SASL_SSL × 机制）] → 参数契约固定四要素（协议/机制/账号/密码），默认 PLAINTEXT，组合不全先报"连接失败"而非误导成功。
- [新图标资源缺失导致前端占位] → icon 字段先行登记，资产文件作为前端侧跟进项（见 Open Questions）。

## Migration Plan

- **部署**：后端重启即触发 `registerAll()` 增量 upsert 三行插件记录（幂等）；既有数据源与插件不受影响；新增依赖为编译期变更，随版本发布。
- **回滚**：删除三个插件类并还原 `DatasourceTypeEnum` 新增枚举即可；`meta_datasource_plugin` 多余记录可手工清理；无数据迁移。

## Open Questions

- 三个插件图标资源文件（HDFS.png / Hive.png / Kafka.png）的存放位置与获取来源——属前端资产，可在实现期另立任务补齐，不影响后端插件注册与功能验证。
- Hive `authType` 的 KERBEROS/LDAP 具体接入范围（v1 至少 NOSASL + LDAP）——复用 common kerberos 逐步补齐，不改变本 spec 的契约。