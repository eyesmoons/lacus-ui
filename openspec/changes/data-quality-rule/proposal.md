## Why

数据质量规则管理当前缺少两个关键能力：一是规则列表页没有直达调度的入口，用户必须手动进入调度列表再按规则筛选；二是规则配置只有「执行失败告警」（Step0 告警组），缺少「检测结果超阈值告警」——而后者正是监控场景的核心诉求。本次变更补齐这两项，并显式盘点后端接口完整性。

## What Changes

- **规则列表新增「定时调度」入口**：在 `rule/index.vue` 操作列增加「调度」按钮，点击跳转调度列表并按该规则 `ruleId` 自动过滤。
- **Step2（规则配置）新增通用「阈值告警」配置**：启用开关 + 比较操作符（`> >= < <= = !=`）+ 阈值 + 告警组；阈值作用于模板主检测值（空值数/重复值/波动率/统计值等）。
- **阈值告警与执行失败告警并存**：Step0 的「执行失败告警组」保持不动，二者语义独立。
- **后端接口完整性检查**：在 Spec 中显式列出已有/缺失接口，明确后端待补齐项。

> 非目标：不修改 schedule 模块本身；不改动 Step0 告警组语义与接口。

## Capabilities

### New Capabilities

- `dataquality-rule-schedule-entry`: 规则列表到调度的快捷入口（跳转并按 ruleId 过滤）。
- `dataquality-threshold-alert`: Step2 通用阈值告警配置（启用开关、比较操作符、阈值、告警组），阈值作用于模板主检测值并与执行失败告警并存。

### Modified Capabilities

- `dataquality-domain`: 规则列表能力扩展（增加调度入口列），规则创建/编辑能力扩展（ruleCheckParams 增加阈值告警字段）。

## Impact

- **前端文件**：`src/views/dataquality/rule/index.vue`、`src/views/dataquality/rule/form.vue`、`src/api/dataquality/ruleApi.js`（可能扩展）。
- **后端接口**：
  - 规则侧 `POST/PUT /dq/rule` 的 `ruleCheckParams` **缺失**阈值告警字段（`alertEnabled`/`alertOperator`/`alertThreshold`/`alertGroupCode` 等）。
  - 调度侧 `GET /dq/schedule/list` 是否支持 `ruleId` 过滤参数**待后端确认**。
  - 告警组数据源 `GET /dq/schedule/alert-groups` **已就绪**，可复用。
- **兼容性**：阈值告警默认不启用，未启用时行为与改动前完全一致。
