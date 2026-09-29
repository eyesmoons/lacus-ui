## Purpose

为数据质量模块提供「规则模板」管理能力。规则模板定义校验模板的编码、名称、质量维度、图标、检测/明细 SQL 模板、专属配置 Schema、排序与启用状态；规则表单（`rule/form.vue`）在第一步选择模板时复用 `GET /dq/template/list`（仅启用的模板）。管理页提供列表（全部模板）+ 新建/编辑/删除/启停。

后端 CRUD 接口（`/dq/template/*`）与实体（`dq_rule_template`）已就绪，本规格仅覆盖前端页面、路由、`templateApi.js` 扩展与后端 `sys_menu` 菜单入库。

## ADDED Requirements

### Requirement: 规则模板管理列表
数据质量侧边栏 SHALL 在「数据质量」目录下展示「规则模板」菜单项，进入后展示全部模板列表（含启用/禁用），支持按模板名称关键字、质量维度、启用状态搜索。

#### Scenario: 进入规则模板列表
- **WHEN** 用户从侧边栏点击「规则模板」
- **THEN** 展示模板列表表格，列包含：模板编码、模板名称、质量维度、图标预览、排序、启用状态、描述（溢出提示）、操作列

#### Scenario: 搜索过滤
- **WHEN** 用户在搜索区输入模板名称关键字或选择质量维度/启用状态
- **THEN** 列表按条件过滤展示

### Requirement: 新建与编辑模板
管理页 SHALL 提供「新建模板」入口与行内「编辑」入口，打开同一表单弹框（Dialog）：字段包含模板编码、模板名称、质量维度、前端图标、图标颜色、描述、检测 SQL 模板、明细 SQL 模板、额外配置 Schema（JSON）、排序序号、是否启用。编辑时模板编码 SHALL 只读。

#### Scenario: 新建模板
- **WHEN** 用户点击「新建模板」并填写完整后提交
- **THEN** 调用 `POST /dq/template` 持久化，成功后关闭弹框并刷新列表

#### Scenario: 编辑模板
- **WHEN** 用户点击行内「编辑」
- **THEN** 弹框回填全部字段（模板编码只读），修改后提交调用 `PUT /dq/template`

#### Scenario: 表单校验
- **WHEN** 模板编码/模板名称为空，或模板编码格式非法（非大写+下划线）
- **THEN** 校验不通过并提示

### Requirement: 删除模板
管理页行内 SHALL 提供「删除」操作，二次确认后调用 `DELETE /dq/template/{id}`。

#### Scenario: 删除模板
- **WHEN** 用户点击「删除」并确认
- **THEN** 调用删除接口，成功后刷新列表

#### Scenario: 取消删除
- **WHEN** 用户在确认弹框点击「取消」
- **THEN** 不执行删除，数据不变

### Requirement: 启用/禁用模板
列表 SHALL 提供启用状态开关，切换时调用更新接口；禁用的模板 SHALL 不出现在规则表单的模板选择器（`GET /dq/template/list` 仅返回 enabled=1）中。

#### Scenario: 禁用模板
- **WHEN** 用户将某模板启用开关置为关闭
- **THEN** 调用 `PUT /dq/template` 更新 enabled=0，规则表单选择器不再出现该模板

### Requirement: 菜单可见性
「规则模板」菜单项 SHALL 由后端 `sys_menu` 表驱动（`dataquality/template`），前端路由 `hidden:true` 与兄弟路由保持一致。

#### Scenario: 侧边栏展示
- **WHEN** 后端 `sys_menu` 已写入 `dataquality/template` 菜单项
- **THEN** 侧边栏「数据质量」目录下展示「规则模板」
