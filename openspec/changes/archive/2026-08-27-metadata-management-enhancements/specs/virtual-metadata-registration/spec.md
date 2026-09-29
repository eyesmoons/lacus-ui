## Purpose

为虚拟数据源（KAFKA/HDFS）提供虚拟数据库/虚拟表/虚拟字段的元数据登记能力，使虚拟资产可在元数据层面被建模、标识与管理，记录写入 meta_db/meta_table/meta_column 并携带 VIRTUAL 类型标记，不产生物理资源。

## ADDED Requirements

### Requirement: 虚拟数据源下登记虚拟数据库

系统 SHALL 允许在虚拟数据源（KAFKA/HDFS）下新增虚拟数据库：提交虚拟库名称并写入 `meta_db`（datasource_id 指向该虚拟数据源），成功后可再次查询到；对同一虚拟数据源下重名库，系统 SHALL 拒绝重复登记并返回明确错误。

#### Scenario: 在虚拟数据源下新增虚拟库

- **WHEN** 用户在某虚拟数据源下提交新库名创建虚拟数据库
- **THEN** `meta_db` 新增一条该库记录（datasource_id=该虚拟数据源），库列表可查询到新库

#### Scenario: 重名虚拟库被拒

- **WHEN** 用户在同一虚拟数据源下再次提交已存在的库名
- **THEN** 登记被拒绝并返回"数据库已存在"的明确错误

### Requirement: 虚拟数据库下登记虚拟表

系统 SHALL 允许在虚拟数据库下新增虚拟表：提交表名写入 `meta_table`，`table_type` 按数据源类型标记为 `VIRTUAL_KAFKA`（Kafka）或 `VIRTUAL_HDFS`（HDFS）之一，并关联所属库与数据源；同一库下重名表登记被拒绝；新建的虚拟表在前端表清单中呈现"虚拟表"标签并可进入详情。

#### Scenario: 在虚拟库下新增虚拟表

- **WHEN** 用户在虚拟数据库下提交新表名创建虚拟表
- **THEN** `meta_table` 新增记录且 table_type 为该虚拟源对应 VIRTUAL_* 标记，表清单可见并带"虚拟表"标签

#### Scenario: 重名虚拟表被拒

- **WHEN** 用户在同一虚拟库下再次提交已存在的表名
- **THEN** 登记被拒绝并返回"表已存在"的明确错误

### Requirement: 虚拟表下登记虚拟字段

系统 SHALL 允许在虚拟表下新增虚拟字段：提交字段名与类型写入 `meta_column`（关联该虚拟表）；同一表下重名字段登记被拒绝；字段在表详情的字段区可见。

#### Scenario: 在虚拟表下新增字段

- **WHEN** 用户在虚拟表下提交新字段名与类型创建虚拟字段
- **THEN** `meta_column` 新增记录关联该表，表详情字段区可见新字段

#### Scenario: 重名字段被拒

- **WHEN** 用户在同一虚拟表下再次提交已存在的字段名
- **THEN** 登记被拒绝并返回"字段已存在"的明确错误

### Requirement: 虚拟登记入口可见性

系统 SHALL 仅对虚拟数据源展示虚拟库/表/字段登记入口：判定依据为数据源下是否存在 VIRTUAL_* 类型表或所连接源类型为 KAFKA/HDFS（虚拟源）；登记操作按用户权限（`metadata:virtual:edit`）与数据源启用状态控制可编辑性。

#### Scenario: 非虚拟源不展示登记入口

- **WHEN** 用户浏览非虚拟（常规 JDBC）数据源
- **THEN** 不展示虚拟库表字段登记入口，仅保留浏览

#### Scenario: 无权限隐藏登记操作

- **WHEN** 用户缺少 metadata:virtual:edit 权限
- **THEN** 登记入口隐藏，虚拟资产仅可读