## Why

目前 `lacus-datasource-plugin` 仅支持 JDBC 类关系/OLAP 数据源（MySQL、Doris、ClickHouse、Oracle、SQLServer、StarRocks），而前端已按"插件参数定义渲染 + 虚拟数据源"模型引导用户录入 KAFKA / HDFS 类源，后端缺少对应插件导致这两类数据源无法真实落库、连接测试与元数据浏览。随着平台承接数仓与实时采集场景，需要补齐 HDFS、Hive、Kafka 三个大数据数据源插件，使后端插件能力与前端虚拟数据源模型对齐。

## What Changes

- 新增 **HDFS 数据源插件**（分布式文件系统）：提供连接参数定义、连接测试、按目录映射数据库/表/字段的元数据浏览。
- 新增 **Hive 数据源插件**（数据仓库，基于 HiveServer2）：提供连接参数定义、JDBC 连接测试、库/表/字段元数据浏览。
- 新增 **Kafka 数据源插件**（消息队列）：提供连接参数定义、Broker 连接测试、以 Topic 映射表的元数据浏览。
- 扩展 `DatasourceTypeEnum`，为大数据类型增加枚举值，使 `datasource_type` 数据字典可展示新类型。
- 非 JDBC 插件（HDFS、Kafka）对 `DataSourcePlugin` 接口中的 JDBC 专属方法（`getJdbcUrl`/`getConnection`/`createDataSource`）给出受控行为，并防止虚拟数据源被当作动态 JDBC 路由目标。
- 三个插件均通过现有 SPI（`@AutoService(DataSourcePlugin.class)` + `ServiceLoader`）注册，由 `DataSourcePluginManager` 自动入库到 `meta_datasource_plugin`，复用现有"保存时连接测试成功才落库"的流程。

无破坏性变更（**BREAKING**: 无）。

## Capabilities

### New Capabilities
- `bigdata-datasource-plugins`: 大数据数据源插件能力——HDFS、Hive、Kafka 三种插件连接参数契约、连接测试语义、元数据浏览映射，以及大数据类型字典与虚拟数据源路由守卫。

### Modified Capabilities
（无）

## Impact

- **模块 `lacus-datasource-plugin`**：新增三个插件实现类；`pom.xml` 增加 Hadoop 客户端/Hive JDBC 依赖（`kafka-clients` 根 pom 已有，无需新增）。
- **模块 `lacus-common`**：`com.lacus.enums.DatasourceTypeEnum` 增加大数据类型枚举值。
- **模块 `lacus-core`**：`DynamicDataSourceContextHolder` 增加虚拟/非 JDBC 数据源路由守卫，避免对 HDFS/Kafka 调用 `createDataSource`。
- **接口行为**：`DataSourcePlugin` 接口签名不变；非 JDBC 插件对 JDBC 专属方法以受控方式实现（Hive 正常实现，HDFS/Kafka 抛明确异常）。
- **复用资产**：`lacus-common` 已有的 `HdfsUtil`、Hadoop 配置文件（core-site.xml/hdfs-site.xml）、Kerberos 能力可供 HDFS 插件复用。
- **前端**：数据源表单已按插件 `connectionParams` 定义驱动渲染，KAFKA/HDFS 已被识别为虚拟数据源类型，无需前端改动；HIVE 类型将随插件注册出现在类型表单中。