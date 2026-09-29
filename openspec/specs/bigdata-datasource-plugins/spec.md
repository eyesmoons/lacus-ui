## Purpose

大数据数据源插件能力域，覆盖 HDFS、Hive、Kafka 三种数据源的插件注册、连接参数契约、连接测试语义与元数据浏览映射，并约束虚拟/非 JDBC 数据源在动态路由中的受控行为，使后端插件能力与前端虚拟数据源模型对齐。


系统 SHALL 提供 HDFS（分布式文件系统）、KAFKA（消息队列）、HIVE（数据仓库）三种数据源类型，每种类型在 `datasource_type` 数据字典中可被查询，具有唯一类型编号、英文名称与中文描述；数据源实体 SHALL 以其类型编号持久化，类型与插件一一对应且互不混淆。

#### Scenario: 查询类型字典

- **WHEN** 调用类型字典查询接口
- **THEN** 返回结果中包含 HDFS、KAFKA、HIVE 三种类型及其唯一编号与中文描述

#### Scenario: 以新类型创建数据源

- **WHEN** 用户以 HDFS（或 KAFKA、HIVE）类型创建数据源并保存成功
- **THEN** 该数据源以对应类型编号持久化，再次读取时类型保持一致

### Requirement: 新插件注册与发布

HDFS、Hive、Kafka 三种插件 SHALL 在应用启动后自动注册，出现在 `meta_datasource_plugin` 且字段完整（名称、类型、驱动类名、图标、描述、连接参数定义），连接参数定义可被查询并用于前端渲染连接表单；对未注册类型的连接请求，系统 SHALL 返回"未找到合适的数据源适配器"的明确错误，而不是静默失败。

#### Scenario: 启动后插件可见

- **WHEN** 应用完成启动并触发插件注册
- **THEN** `meta_datasource_plugin` 中存在 HDFS、HIVE、KAFKA 三条插件记录，各自的连接参数定义可完整查询

#### Scenario: 未注册类型被拒

- **WHEN** 尝试以系统中不存在的插件类型保存数据源
- **THEN** 保存被拒绝并返回"未找到合适的数据源适配器"错误信息

### Requirement: HDFS 连接参数契约

系统 SHALL 为 HDFS 数据源提供连接参数定义，至少包含：NameNode 地址（`defaultFS`，必填，默认 `hdfs://hadoop1:9000`）与 HDFS 用户名（`user`，必填，默认 `hdfs`）；参数以插件定义格式下发前端，前端据此渲染表单（字符串必填项优先、数值与密码按输入类型渲染）。

#### Scenario: 前端按定义渲染 HDFS 表单

- **WHEN** 前端加载 HDFS 插件的连接参数定义
- **THEN** 表单包含 `defaultFS` 与 `user` 必填项，预填对应默认值，并以字符串输入框展示

### Requirement: HDFS 连接测试

系统 SHALL 依据 HDFS 连接参数执行连接测试：当 NameNode 可达、认证与权限通过时测试为真；当地址不可达（无响应、主机名/端口错误、权限不足）时测试为假；测试失败 SHALL 以"数据源连接失败"呈现于保存/更新/测试接口，不向调用方抛出未处理的连接异常。

#### Scenario: HDFS 可达时连接成功

- **WHEN** 提供可达的 NameNode 地址且用户有权访问根目录
- **THEN** 连接测试返回成功，允许数据源保存

#### Scenario: HDFS 不可达时连接失败

- **WHEN** 提供未响应或权限不足的 NameNode 地址
- **THEN** 连接测试返回失败，保存/更新被拒绝并提示"数据源连接失败"

### Requirement: HDFS 元数据浏览

系统 SHALL 支持对 HDFS 数据源浏览元数据：顶层目录映射为数据库，其下子目录映射为表，目录内文件名映射为字段；浏览接口按当前用户可读范围返回结果，目录解析失败对应返回空集合而非阻断。

#### Scenario: 浏览 HDFS 目录结构

- **WHEN** 用户浏览已建 HDFS 数据源的元数据
- **THEN** 顶层目录呈现为数据库列表，选定数据库后其子目录呈现为表列表，表内文件呈现为字段列表

### Requirement: Hive 连接参数契约

系统 SHALL 为 Hive 数据源提供连接参数定义，至少包含：HiveServer2 主机地址（`host`，必填）、端口（`port`，必填，默认 10000，范围 1-65535）、数据库（`database`，必填，默认 `default`）、用户名（`username`，必填，默认 `hive`）、密码（`password`，可选，密码态渲染）、认证方式（`authType`，可选，支持 NOSASL/KERBEROS/LDAP，默认 NOSASL）。

#### Scenario: 前端按定义渲染 Hive 表单

- **WHEN** 前端加载 Hive 插件的连接参数定义
- **THEN** 表单包含 `host`、`port`、`database`、`username` 必填项与 `authType` 选项，`port` 以数值输入框呈现并校验 1-65535

### Requirement: Hive 连接测试

系统 SHALL 依据 Hive 连接参数通过 HiveServer2 执行连接测试：主机可达、凭据与认证方式正确时测试为真；否则为假并以"数据源连接失败"呈现，不向调用方抛出未处理异常。

#### Scenario: HiveServer2 可达时连接成功

- **WHEN** 提供可达的 HiveServer2 地址及正确认证信息
- **THEN** 连接测试返回成功，允许数据源保存

#### Scenario: Hive 认证失败时连接失败

- **WHEN** 提供错误用户名/密码或不可达的 HiveServer2 地址
- **THEN** 连接测试返回失败，保存/更新被拒绝并提示"数据源连接失败"

### Requirement: Hive 元数据浏览

系统 SHALL 支持浏览 Hive 数据源的元数据：数据库列表、各库下的表列表、表的字段（列名、类型）列表，与 HiveServer2 元数据一致；会话不可用时浏览返回空集合而非阻断。

#### Scenario: 浏览 Hive 库表字段

- **WHEN** 用户浏览已建 Hive 数据源的元数据
- **THEN** 返回对应 HiveServer2 的数据库、表与字段（列名/类型）信息

### Requirement: Kafka 连接参数契约

系统 SHALL 为 Kafka 数据源提供连接参数定义，至少包含：Bootstrap 地址（`bootstrapServers`，必填，逗号分隔的 host:port 列表）、安全协议（`securityProtocol`，可选，默认 PLAINTEXT，支持 PLAINTEXT/SASL_PLAINTEXT/SASL_SSL）、SASL 机制（`saslMechanism`，可选，支持 PLAIN、SCRAM-SHA-256、SCRAM-SHA-512）、SASL 用户名（`username`，可选）与密码（`password`，可选，密码态渲染）。

#### Scenario: 前端按定义渲染 Kafka 表单

- **WHEN** 前端加载 Kafka 插件的连接参数定义
- **THEN** 表单包含 `bootstrapServers` 必填项与安全协议/SASL 选项，SASL 开启时展示用户名与密码输入

### Requirement: Kafka 连接测试

系统 SHALL 依据 Kafka 连接参数执行连接测试：至少一个 Broker 可达且（如配置）SASL 认证通过时测试为真；全部 Broker 不可达、认证失败或安全协议配置错误时测试为假；测试失败 SHALL 以"数据源连接失败"呈现，不向调用方抛出未处理异常。

#### Scenario: Broker 可达时连接成功

- **WHEN** 提供可达的 Bootstrap 地址且认证通过
- **THEN** 连接测试返回成功，允许数据源保存

#### Scenario: Broker 不可达时连接失败

- **WHEN** 提供不可达的 Bootstrap 地址或错误的 SASL 凭据
- **THEN** 连接测试返回失败，保存/更新被拒绝并提示"数据源连接失败"

### Requirement: Kafka 元数据浏览

系统 SHALL 支持浏览 Kafka 数据源的元数据：集群呈现为单一数据库，集群内 Topic 呈现为表，Topic 的分区号与副本数呈现为该表的元数据信息；元数据接口不可达时返回空集合而非阻断。

#### Scenario: 浏览 Kafka Topic

- **WHEN** 用户浏览已建 Kafka 数据源的元数据
- **THEN** 返回集群下的 Topic 列表，每个 Topic 附带分区与副本信息

### Requirement: 虚拟数据源路由守卫

对于非 JDBC 数据源（HDFS、Kafka）及不得进入 JDBC 查询路由的数据源，系统 SHALL 保证：针对 JDBC 连接语义（取 JDBC 连接、取 JDBC URL、创建连接池）的调用被明确拒绝并返回可读错误，而不是返回无效连接或崩溃；将此类数据源作为动态 JDBC 路由目标时同样被拒绝。

#### Scenario: 拒绝为虚拟数据源建 JDBC 连接

- **WHEN** 代码路径尝试对 HDFS（或 Kafka）数据源获取 JDBC 连接或创建连接池
- **THEN** 该调用返回明确的错误提示（如"该数据源类型不支持 JDBC 连接"），系统整体不崩溃

#### Scenario: 拒绝将虚拟数据源加入 JDBC 路由

- **WHEN** 尝试将 HDFS（或 Kafka）数据源切换为动态 JDBC 路由目标
- **THEN** 切换被拒绝并返回明确错误，不影响其他数据源的路由状态