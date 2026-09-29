# 任务：legacy-baseline-snapshot（存量基线逆向梳理）

> 本变更性质为纯文档产出：全部任务均为文档核对/撰写动作，不涉及任何 src/ 代码修改。
> 文档完成后**暂停于第 5 组等待人工评审**；评审通过才执行第 6 组归档与同步。

## 1. 基建域基线

- [x] 1.1 撰写 app-foundation/spec.md（启动装配/Layout/主题持久化/首页工作台/构建配置/qiankun 未使用），接口与行为对照 main.js、layout/*、store/*、views/index.vue、vite.config.js 核实
- [x] 1.2 撰写 auth-and-routing/spec.md（登录注册/RSA/Token Cookie/路由守卫/动态路由/权限指令/20101 链路），对照 interceptor.js、user store、rsaUtil、directive 核实
- [x] 1.3 撰写 http-gateway/spec.md（axios 配置/拦截器五分支/防重提交/download/错误码表/独立上传通道），逐行核对 utils/request.js、plugins/download.js、resourceApi 上传

## 2. 业务域基线（系统侧）

- [x] 2.1 撰写 system-admin/spec.md，九个子模块接口表逐一对照 src/api/system/*.js 的 method/path
- [x] 2.2 撰写 ops-monitor/spec.md，告警四块接口表对照 alertApi.js 全部 14 个函数，Druid 入口核实为 iframe

## 3. 业务域基线（数据侧）

- [x] 3.1 撰写 metadata-domain/spec.md（插件驱动动态表单/虚拟源差异/编辑回填兜底/schema 同步/表详情四 Tab/业务元数据/血缘图与登记/定时同步），并产出与 datasource-module-hld.md 的差异比对（Δ1/Δ4/Δ6）
- [x] 3.2 撰写 datasync-domain/spec.md，三步向导流对照 job.vue 实际步骤与 preCheck/listMappedColumn 调用点，标注 remove/stop 为 GET 的异常语义
- [x] 3.3 撰写 dig-integration/spec.md，区分 designer(X6 DAG) 与 expert(Monaco JSON) 两形态，记录自动保存被注释/实例详情路由被注释/_bak 死代码三项现状
- [x] 3.4 撰写 compute-jobs/spec.md，Flink 四生命周期 vs Spark 双操作+未接线 online/offline 差异如实分述，记录 Spark 重复路由
- [x] 3.5 撰写 dataquality-domain/spec.md，10 秒轮询间隔、stop 终止条件、check-result 明细形态核实到代码行

## 4. 共享层与总装

- [x] 4.1 撰写 oneapi-domain/spec.md（四步向导/parse 解析/colTypeList 映射/updateStatus GET 状态机/离线在线测试）
- [x] 4.2 撰写 shared-ui-toolkit/spec.md（Pagination/CronTab 六段事实/上传契约/Monaco/$modal/$tab/$cache/useDict/v-copyText/存储键位总账），CRON 文档"7 Tab 含年"记入差异 Δ2/Δ3
- [x] 4.3 撰写 design.md：模块依赖图、技术债清单 TD1–TD16、风险清单 R1–R7、文档差异清单 Δ1–Δ6
- [x] 4.4 校验：运行 `openspec validate legacy-baseline-snapshot --strict` 通过；抽查每份 spec 的 Scenario 格式（恰好 4 个 #）与 Requirement 数

## 5. 人工评审（暂停点）

- [ ] 5.1 提请评审：向评审人说明变更位置（openspec/changes/legacy-baseline-snapshot/）、重点审阅 design.md 差异清单与各域接口表
- [ ] 5.2 按评审意见修订对应 spec/design 并复跑 4.4 校验（如有意见）
- [ ] 5.3 评审通过确认（本项勾选即视为放行归档）

## 6. 归档锁定与同源同步（评审通过后执行）

- [ ] 6.1 执行 `openspec archive legacy-baseline-snapshot --yes` 将 delta specs 合入 openspec/specs/ 锁定基线
- [ ] 6.2 新建 topics/ 目录，将 openspec/specs/ 下 12 份定稿 spec 复制为同名路径，并在 topics/README.md 注明"内容与 openspec/specs 同源，以 OpenSpec 目录为权威源"
- [ ] 6.3 归档后声明：后续所有需求一律走 /opsx:propose 正向流程先文档后代码，禁止再以逆向方式补规格
