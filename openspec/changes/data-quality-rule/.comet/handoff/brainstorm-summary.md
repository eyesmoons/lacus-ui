# Brainstorm Summary

- Change: data-quality-rule
- Date: 2026-08-29

## 确认的技术方案

### 整体架构（Bounded 变更）
- 调度入口：规则列表「调度」按钮 → `router.push({ path: '/dataquality/schedule', query: { ruleId } })`，跳转而非内联。
- 阈值告警：Step2 独立分区（启用开关 + 比较操作符 + 阈值 + 告警组），字段复用 `ruleCheckParams` 容器。
- 阈值作用于模板主检测值，不区分模板子类型。
- 告警组下拉复用 `GET /dq/schedule/alert-groups`（`scheduleApi.getAlertGroupOptions`）。
- 阈值告警与 Step0「执行失败告警组」语义独立、并存。

### 调度入口设计
- 规则列表操作列「删除」后加「调度」按钮（`Clock` 图标，`type="info"`）。
- 调度列表 `onMounted` 读 `route.query.ruleId`，存在时传参 + 前端本地过滤兜底。
- 顶部 `el-tag` 展示当前过滤规则名（无接口时显示 ruleId）。

### 阈值告警配置设计
- UI：Step2「校验规则」区后独立「阈值告警」区（竖线 + divider-text 样式），附说明文案。
- 表单：`ruleCheckParams` 增加 `alertEnabled`/`alertOperator`/`alertThreshold`/`alertGroupCode`。
- 校验：动态 `step3cRules`，启用时 3 字段必填，未启用返回空对象。

### 校验策略 + 提交/回填
- `nextStep` Step2 增加 `step3cRef.validate()`。
- 提交时未启用阈值告警 → 主动 delete 4 字段，保证老后端兼容。
- 编辑回填：`loadEditData` 解析 `ruleConfig` 时按 `cfg[key] !== undefined` 回填。

## 关键取舍与风险

- **[后端字段缺失]** 规则侧 `rule_config` 尚无阈值告警字段。缓解：前端按约定字段承载，后端同步补齐。
- **[过滤能力不确定]** `/dq/schedule/list` 是否支持 `ruleId` 待确认。缓解：前端本地过滤兜底。
- **[语义混淆]** Step2 已有「期望值/阈值」用于 pass/fail。缓解：UI 命名「阈值告警」+ 说明文案。
- **[兜底一致性]** 前端本地过滤期间，分页 total 可能与列表条数不一致。缓解：过滤后 total 取过滤后长度。

## 测试策略

- 调度按钮跳转 + 调度列表过滤（后端支持 / 前端兜底）。
- 阈值告警启用/必填校验/保存/未启用不携带字段/编辑回填。
- 老数据兼容 + Step0 告警组独立。
- 回归：规则列表/表单全流程 + 调度列表。
- 边界：阈值 0/负数/小数；告警组接口失败。

## Spec Patch

无。现有 delta spec 验收场景已覆盖设计方案，无需回写。
