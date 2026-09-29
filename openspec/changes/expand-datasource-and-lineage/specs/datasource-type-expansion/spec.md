## Purpose

扩展元数据中心可接入的数据源类型:在既有关系型数据源之外新增 Hive 数据源,并引入 Kafka、HDFS 两类虚拟数据源与"虚拟表"概念,使大数据场景下的存储与消息系统能够纳入统一的元数据采集与管理流程。

## ADDED Requirements

### Requirement: Hive 数据源注册与连接
系统 SHALL 支持创建类型为 Hive 的数据源,其连接参数(如 host、port、库名、用户名、密码等)由 Hive 插件的 connectionParams 定义驱动动态表单渲染;Hive 数据源 MUST 复用现有数据源的启用/停用、编辑、删除行为。

#### Scenario: 新增 Hive 数据源
- **WHEN** 用户在新增数据源对话框中选择类型为 Hive
- **THEN** 系统按 Hive 插件定义的连接参数渲染动态表单,必填项缺失时阻止提交并给出提示

#### Scenario: 测试 Hive 连接
- **WHEN** 用户对已启用的 Hive 数据源执行测试连接
- **THEN** 系统返回测试成功或失败的结果并提示用户

### Requirement: 虚拟数据源支持
系统 SHALL 支持 Kafka 与 HDFS 两类虚拟数据源的注册。虚拟数据源的连接参数由各自插件定义(Kafka 如 broker 地址,HDFS 如 NameNode 地址),MUST NOT 强制要求传统 host/port 之外的数据库模型字段。

#### Scenario: 新增 Kafka 数据源
- **WHEN** 用户选择类型为 Kafka 并填写 broker 连接参数提交
- **THEN** 系统成功创建 Kafka 数据源并可对其执行测试连接

#### Scenario: 新增 HDFS 数据源
- **WHEN** 用户选择类型为 HDFS 并填写 NameNode 连接参数提交
- **THEN** 系统成功创建 HDFS 数据源并可对其执行测试连接

### Requirement: 虚拟表元数据同步
系统 SHALL 在对虚拟数据源执行元数据同步时生成"虚拟表"记录:Kafka 以 Topic 为虚拟表,HDFS 以目录为虚拟表。虚拟表记录 MUST 带有区别于普通表的虚拟表标识。

#### Scenario: 同步 Kafka 元数据
- **WHEN** 用户对一个已启用的 Kafka 数据源触发元数据同步
- **THEN** 系统将该数据源下的 Topic 生成为虚拟表记录并标记为虚拟表

#### Scenario: 同步 HDFS 元数据
- **WHEN** 用户对一个已启用的 HDFS 数据源触发元数据同步
- **THEN** 系统将指定路径下的目录生成为虚拟表记录并标记为虚拟表

### Requirement: 虚拟表标识展示
元数据表列表 SHALL 展示每条表的类型标识,虚拟表 MUST 能与普通表在列表中明确区分。

#### Scenario: 列表中区分虚拟表
- **WHEN** 用户查看元数据表列表且存在虚拟表记录
- **THEN** 虚拟表行显示虚拟表标识(如标签),普通表不显示该标识
