## 1. 依赖与类型字典准备

- [x] 1.1 在 `lacus-datasource-plugin` 的 `pom.xml` 增加 `kafka-clients` 依赖，版本复用根 pom 的 3.6.1（根 pom `<dependencies>` 已继承给所有子模块，模块无需重复声明）
- [x] 1.2 在 `pom.xml` 增加 `hive-jdbc` 依赖并排紧传递依赖（guava/hadoop 冲突面）；确认 Hadoop 客户端是否随 `lacus-common` 传递可用（经根 pom `flink-yarn` 传递引入 hadoop-common/hdfs 2.8.5）
- [x] 1.3 扩展 `com.lacus.enums.DatasourceTypeEnum`：新增 `DISTRIBUTED_FILE(4)`/`MESSAGE_QUEUE(5)`/`DATA_WAREHOUSE(6)`（含名称与中文描述）
- [x] 1.4 编译验证：`mvn -pl lacus-datasource-plugin -am compile` 通过

## 2. Hive 插件（JDBC 型）

- [x] 2.1 新建 `HiveDataSourcePlugin`（`com.lacus.datasource.plugins`）：`getName()="HIVE"`、`getType()` 返回 `DATA_WAREHOUSE`、`getDriverName()="org.apache.hive.jdbc.HiveDriver"`、`getIcon()="Hive.png"`、`getRemark()`（单测覆盖契约字段）
- [x] 2.2 实现 `getConnectionParamDefinitions()`：`host`(必填)、`port`(必填,默认 10000,校验 1-65535)、`database`(必填,默认 default)、`username`(必填,默认 hive)、`password`(可选,密码态)、`authType`(可选,NOSASL/KERBEROS/LDAP,默认 NOSASL)
- [x] 2.3 实现 `buildJdbcUrl()`：组装 `jdbc:hive2://host:port/database`，按 `authType` 追加认证参数（单测覆盖 NOSASL/LDAP）
- [x] 2.4 实现元数据浏览：`listAllSchemaDb`(SHOW DATABASES)、`listSchemaTable`(SHOW TABLES IN db)、`listSchemaColumn`(DESC table，字段含列名/类型)（实现完成,需真实 HS2 环境 E2E）
- [x] 2.5 连接测试验证：可达返回 true；不可达/凭据错误返回 false 并呈现"数据源连接失败"（实现完成,经 `createDataSource`+Druid 链路,需真实环境 E2E）

## 3. HDFS 插件（非 JDBC 型）

- [x] 3.1 新建 `HdfsDataSourcePlugin`：`getName()="HDFS"`、`getType()` 返回 `DISTRIBUTED_FILE`、`getDriverName()="org.apache.hadoop.fs.FileSystem"`、`getIcon()="HDFS.png"`、`getRemark()`
- [x] 3.2 实现 `getConnectionParamDefinitions()`：`defaultFS`(必填,默认 `hdfs://hadoop1:9000`)、`user`(必填,默认 `hdfs`)
- [x] 3.3 重写 `testConnection()`：基于 Hadoop `FileSystem` 对根目录执行 `getFileStatus`，`IOException`(不可达/权限) → false（`file://` LocalFileSystem 单测覆盖,真实 HDFS 需 E2E）
- [x] 3.4 JDBC 专属方法（`getJdbcUrl`/`getConnection`/`createDataSource`）抛明确业务异常"该数据源类型不支持 JDBC 连接"（单测断言）
- [x] 3.5 实现元数据浏览：`/` 顶层目录→db、子目录→table、目录内文件→column；解析失败返回空集合（实现完成,映射逻辑经 file:// 单测,真实 HDFS 需 E2E）

## 4. Kafka 插件（非 JDBC 型）

- [x] 4.1 新建 `KafkaDataSourcePlugin`：`getName()="KAFKA"`、`getType()` 返回 `MESSAGE_QUEUE`、`getDriverName()="org.apache.kafka.clients.admin.AdminClient"`、`getIcon()="Kafka.png"`、`getRemark()`
- [x] 4.2 实现 `getConnectionParamDefinitions()`：`bootstrapServers`(必填)、`securityProtocol`(可选,默认 PLAINTEXT,支持 PLAINTEXT/SASL_PLAINTEXT/SASL_SSL)、`saslMechanism`(可选,PLAIN/SCRAM-SHA-256/SCRAM-SHA-512)、`username`/`password`(可选,密码态)
- [x] 4.3 实现 Kafka client 属性装配（`bootstrapServers` + SASL 四要素），供测试与元数据浏览复用（单测覆盖 PLAINTEXT/SASL）
- [x] 4.4 重写 `testConnection()`：`AdminClient.describeCluster()` 限时获取 clusterId → true；异常/超时 → false（实现完成,需真实 broker E2E）
- [x] 4.5 JDBC 专属方法（`getJdbcUrl`/`getConnection`/`createDataSource`）抛明确业务异常"该数据源类型不支持 JDBC 连接"（单测断言）
- [x] 4.6 实现元数据浏览：`listTopics` → 表（按既有约定标 `VIRTUAL_KAFKA` 类型）、`describeTopics` → 分区/副本信息；库固定为单一集群库（实现完成,需真实 broker E2E）

## 5. 动态路由守卫

- [x] 5.1 在 `DynamicDataSourceContextHolder.setDataSourceId` 按类型大类拦截：`DISTRIBUTED_FILE`/`MESSAGE_QUEUE` 类型拒绝路由，抛"该数据源类型不支持 JDBC 查询路由"
- [x] 5.2 验证 `DATA_WAREHOUSE`(Hive) 与既有 `RELATIONAL` 类型仍可正常路由（守卫仅拦截 4/5,6 与 1/2/3 放行;运行期验证见 6.5）

## 6. 端到端验证

- [x] 6.1 `mvn` 全后端编译通过（reactor 12 模块 BUILD SUCCESS;插件模块 21 项单测通过）
- [ ] 6.2 启动应用，确认 `meta_datasource_plugin` 增量出现 `HDFS`/`HIVE`/`KAFKA` 三行且参数定义完整
- [ ] 6.3 `datasource_type` 数据字典可查询到三个新类型
- [ ] 6.4 前端表单按插件定义渲染三类型连接参数（含 Kafka 密码态、Hive 端口校验），保存成功/失败与连接测试提示符合 spec 契约
- [ ] 6.5 元数据浏览：HDFS 目录、Hive 库表字段、Kafka Topic 均可浏览，虚拟表持久化沿用 `VIRTUAL_*` 类型
- [ ] 6.6 将 HDFS/Kafka 数据源尝试加入 JDBC 路由被拒绝且不影响其他数据源路由