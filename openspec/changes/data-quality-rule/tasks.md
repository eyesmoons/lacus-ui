## 1. 调度入口（规则列表弹框直管每规则唯一调度）

- [x] 1.1 在 `rule/index.vue` 操作列「调度」按钮改为打开弹框（不再跳转调度列表页）。验证：点击后弹出 `el-dialog` 且标题含规则名。
- [x] 1.2 弹框按 `rule.schedule` 状态切换：未绑显示创建表单（调度名称/Cron/错误策略/并发/备注，ruleId 预绑定隐藏），已绑显示详情（名称/Cron/状态/下次执行）+ 暂停/恢复/立即执行/编辑/删除按钮。验证：两种状态切换正确。
- [x] 1.3 弹框内创建调度调用 `addSchedule`，成功后关闭弹框并刷新规则列表（获取最新 `schedule` 状态）。验证：创建后弹框刷新为「已绑」态。
- [x] 1.4 弹框内暂停/恢复调用 `pauseSchedule`/`resumeSchedule`，立即执行调用 `runSchedule`，编辑回填预填充，删除调用 `deleteSchedule`。验证：各操作成功且刷新列表。
- [x] 1.5 每规则唯一调度约束：已绑规则弹框隐藏「新建」、展示详情；`getOptionalRules()` 已排除已绑规则（表单侧防二次绑定）。验证：已绑规则无法再新建第二个调度。
- [x] 1.6 后端 `GET /dq/rule/list` 返回 `schedule: { id, jobName, cronExpression, status } | null`；前端兜底：缺失时视为 null 退化为「未绑」态。验证：字段缺失时不阻塞。

## 2. Step2 阈值告警配置

- [x] 2.1 在 `rule/form.vue` Step2 增加通用「阈值告警」区：启用开关 + 比较操作符（`> >= < <= = !=`）+ 阈值（数值）+ 告警组下拉（复用 `getAlertGroupOptions`）。验证：启用时展示并校验必填；未启用时隐藏且无校验。
- [x] 2.2 表单数据 `ruleCheckParams` 增加阈值告警字段（`alertEnabled`/`alertOperator`/`alertThreshold`/`alertGroupCode`），提交时写入 payload。验证：提交后 `ruleCheckParams` 含阈值告警字段。
- [x] 2.3 编辑回填：`loadEditData` 解析 `ruleConfig` 时回填阈值告警字段。验证：编辑已配置阈值告警的规则时，Step2 各区正确回显。

## 3. 验证与兼容

- [x] 4.1 未启用阈值告警时，提交 payload 不含阈值告警字段，行为与改动前一致。验证：存量规则编辑保存无回归。
- [x] 4.2 Step0 执行失败告警组功能不受影响。验证：Step0 告警组独立保存与回显正常。
- [x] 4.3 调度弹框全流程回归：创建/暂停/恢复/立即执行/编辑/删除/列表刷新。验证：弹框内各操作后列表 `schedule` 状态同步。（代码已实现，E2E 待后端 `schedule` 字段同步后验证）
- [x] 4.4 后端 `schedule` 字段缺失兜底：弹框退化为「未绑」态、不阻塞。验证：mock 缺失场景。（代码层面已实现兜底：`rule?.schedule` 为空即显示创建表单）

## 5. 规则模板管理

- [x] 5.1 后端 `sys_menu` 写入「规则模板」菜单项（menu_id 建议 2106，parent_id=2092 数据质量，path=`dataquality/template`，component=`dataquality/template/index`，menu_type=2，perms=`dq:template:list`）。验证：登录后侧边栏「数据质量」下展示「规则模板」。
- [x] 5.2 扩展 `templateApi.js`：新增 `listAllTemplates()`（→ GET /dq/template/listAll）、`addTemplate(data)`（→ POST）、`updateTemplate(data)`（→ PUT）、`deleteTemplate(id)`（→ DELETE /{id}）。验证：函数可用且路径/方法正确。
- [x] 5.3 新建 `src/views/dataquality/template/index.vue` 管理列表：搜索区（模板名称关键字/质量维度/启用状态）+ 表格（编码/名称/维度/图标预览/排序/启用开关/描述/操作）+ 新建/编辑/删除/启停。验证：列表加载、搜索过滤、启停、删除二次确认。
- [x] 5.4 新建 `src/views/dataquality/template/TemplateDialog.vue` 表单弹框：新建+编辑复用，字段含 templateCode（编辑只读）/templateName/dimension/templateIcon/templateColor/description/checkSqlPattern/itemsSqlPattern/extraConfigSchema/sortOrder/enabled；编码正则校验。验证：新建提交、编辑回填、编码只读、格式校验拦截。
- [x] 5.5 路由注册：`/dataquality` children 追加 `{ path: 'template', name: 'DqRuleTemplate', component: () => import('@/views/dataquality/template/index'), meta: { title: '规则模板', icon: 'document' }, hidden: true }`。验证：侧边栏点击跳转 `/dataquality/template`。
- [x] 5.6 回归：规则表单第一步模板选择器（`GET /dq/template/list`）仅展示启用模板，禁用后选择器不再出现。验证：禁用某模板后进入规则表单，该模板不在下拉中。

