## MODIFIED Requirements

### Requirement: 业务元数据维护（表级聚焦）

系统 SHALL 将业务元数据维护限定为表资产描述。BusinessMetaPanel 必须以 props {bizType, bizId} 驱动：加载 GET /metadata/bizmeta/{bizType}/{bizId} 回显 businessName/description/owner/tags 四键；保存 POST /metadata/bizmeta/batch 全量提交四键 items（空串语义为删除该条），有改动才允许点保存，重置恢复服务端快照。系统 SHALL 仅允许在表详情页（bizType=TABLE，bizId=tableId）使用该组件；数据源管理页 SHALL 不再提供「业务信息」行操作与 DATASOURCE 级业务元数据弹窗。权限控制点为 v-hasPermission/$permissionChecker 的 metadata:bizmeta:edit。

> 变更说明（MODIFIED）：原契约含数据源级（DATASOURCE）业务信息入口，现收敛为仅表级维护，移除数据源管理页入口。

#### Scenario: 表详情页维护业务元数据

- **WHEN** 用户在表详情页的业务元数据面板编辑并保存 businessName/description/owner/tags
- **THEN** batch 提交后后端持久化，回显为最新值

#### Scenario: 清空责任人保存

- **WHEN** 用户清空 owner 后点击保存
- **THEN** batch 提交 objValue 为空串，后端删除该条 KV

#### Scenario: 数据源管理页无业务信息入口

- **WHEN** 用户打开数据源管理页查看行操作
- **THEN** 不再存在"业务信息"按钮，业务元数据仅可在表详情维护

### Requirement: 数据血缘登记与展示（表维度）

系统 SHALL 支持血缘登记的增删改完善。LineagePanel 必须：并行拉取 GET /metadata/lineage/graph?direction=upstream&depth=1 与 direction=downstream&depth=1，从 edges 还原上下游两张表（来源标签 AUTO 显示「采集」info、MANUAL 显示「手动」success）；「登记上游/下游」按钮受 metadata:lineage:edit 权限控制，弹窗内关联表远程搜索（排除自身）、依赖类型 DIRECT/TRANSFORM 单选、备注选填；提交前本地去重（同方向已存在该表则警告「该血缘关系已存在」不提交）；上游登记提交 sourceTableId=对方/targetTableId=本表，下游反之。系统 SHALL 允许编辑手动登记的边缘：调 PUT /metadata/lineage/edge/{edgeId} 修改依赖类型/备注（按上游/下游方向换算 source/target），仅 MANUAL 来源的行提供编辑入口。删除仅 MANUAL 行可用，DELETE /metadata/lineage/edge/{edgeId} 前需确认「确认删除与"x"的血缘关系吗?」。

> 变更说明（MODIFIED）：新增编辑（修改）能力——MANUAL 血缘可改 depType/remark/目标节点；登记时校验源/目标表存在。

#### Scenario: 登记重复血缘被拦截

- **WHEN** 对已是上游的表再次登记为上游
- **THEN** 前端警告已存在且不发起请求

#### Scenario: 编辑 MANUAL 血缘的依赖类型与备注

- **WHEN** 用户编辑一条 MANUAL 血缘,将依赖类型从 DIRECT 改为 TRANSFORM 并修改备注
- **THEN** PUT /metadata/lineage/edge/{edgeId} 提交成功,图查询返回更新后的 depType/remark

#### Scenario: AUTO 血缘不可编辑删除

- **WHEN** 用户尝试对 AUTO(采集)来源的血缘执行编辑或删除
- **THEN** 前端不提供编辑/删除入口,该行仅只读展示