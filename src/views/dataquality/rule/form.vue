<template>
    <div class="app-container rule-form-page">
        <!-- 步骤条（固定顶部） -->
        <el-steps :active="currentStep" finish-status="finish" simple class="task-header">
            <el-step title="基本信息" icon="Document"/>
            <el-step title="数据源配置" icon="DataBoard"/>
            <el-step title="规则配置" icon="Grid"/>
            <el-step title="任务参数" icon="Setting"/>
        </el-steps>

        <!-- 步骤内容区 -->
        <div class="layout">

            <!-- 步骤一：基本信息 -->
            <div v-show="currentStep === 0" class="step-layout">
                <div class="select-header">
                    <div class="select-header-title">基本信息配置</div>
                </div>
                <div class="step-form-body">
                    <el-divider direction="vertical"/>
                    <span class="divider-text">基本信息</span>
                    <div class="params-form">
                        <el-form ref="step1Ref" :model="form" :rules="step1Rules" label-width="100px">
                            <el-row :gutter="24">
                                <el-col :span="10">
                                    <el-form-item label="规则名称" prop="ruleName">
                                        <el-input v-model="form.ruleName" placeholder="请输入规则名称" maxlength="128"
                                                  show-word-limit clearable/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="6">
                                    <el-form-item label="启用状态" prop="enabled">
                                        <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0"
                                                   active-text="启用" inactive-text="禁用"/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="16">
                                    <el-form-item label="规则描述" prop="description">
                                        <el-input v-model="form.description" type="textarea" :rows="4"
                                                  placeholder="请输入规则描述（选填）" maxlength="500" show-word-limit/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-form>
                    </div>
                </div>
            </div>

            <!-- 步骤二：数据源配置 -->
            <div v-show="currentStep === 1" class="step-layout">
                <div class="select-header">
                    <div class="select-header-title">数据源配置</div>
                    <div class="select-header-subtitle">选择要进行质量检测的数据源、库、表和字段</div>
                </div>
                <div class="step-form-body">
                    <el-divider direction="vertical"/>
                    <span class="divider-text">数据源信息</span>
                    <div class="params-form">
                        <el-form ref="step2Ref" :model="form" :rules="step2Rules" label-width="100px">
                            <el-row :gutter="24">
                                <el-col :span="16">
                                    <el-form-item label="数据源" prop="datasourceId">
                                        <el-select
                                            v-model="form.datasourceId"
                                            placeholder="请选择数据源"
                                            style="width: 100%"
                                            filterable
                                            clearable
                                            @change="onDatasourceChange"
                                        >
                                            <el-option v-for="ds in datasourceList" :key="ds.datasourceId"
                                                       :label="ds.datasourceName" :value="ds.datasourceId"/>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="16">
                                    <el-form-item label="数据库" prop="dbName">
                                        <el-select
                                            v-model="form.dbName"
                                            placeholder="请先选择数据源"
                                            style="width: 100%"
                                            filterable
                                            clearable
                                            :disabled="!form.datasourceId"
                                            @change="onDatabaseChange"
                                        >
                                            <el-option v-for="db in dbList" :key="db.dbName" :label="db.dbName"
                                                       :value="db.dbName"/>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="8">
                                    <el-form-item label="数据表" prop="tableName">
                                        <el-select
                                            v-model="form.tableName"
                                            placeholder="请先选择数据库"
                                            style="width: 100%"
                                            filterable
                                            clearable
                                            :disabled="!form.dbName"
                                            @change="onTableChange"
                                        >
                                            <el-option v-for="tb in tableList" :key="tb.tableName" :label="tb.tableName"
                                                       :value="tb.tableName"/>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="10">
                                    <el-form-item label="检测字段" prop="fieldNames">
                                        <el-select
                                            v-model="form.fieldNames"
                                            placeholder="请先选择数据表"
                                            style="width: 100%"
                                            filterable
                                            clearable
                                            :disabled="!form.tableName"
                                        >
                                            <el-option v-for="col in columnList" :key="col.columnName"
                                                       :label="col.columnName" :value="col.columnName">
                                                <span>{{ col.columnName }}</span>
                                                <span style="color: #999; font-size: 12px; margin-left: 8px">{{
                                                        col.columnType
                                                    }}</span>
                                            </el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-form>
                    </div>
                </div>
            </div>

            <!-- 步骤三：规则配置（模板 + 校验规则） -->
            <div v-show="currentStep === 2" class="step-layout">
                <div class="select-header">
                    <div class="select-header-title">规则配置</div>
                    <div class="select-header-subtitle">选择检测模板并配置校验规则参数</div>
                </div>
                <div class="step-form-body">
                    <!-- 规则模板 -->
                    <el-divider direction="vertical"/>
                    <span class="divider-text">规则模板</span>
                    <div class="params-form">
                        <el-form ref="step3aRef" :model="form" :rules="step3aRules" label-width="100px">
                            <el-row :gutter="24">
                                <el-col :span="8">
                                    <el-form-item label="检测模板" prop="templateId">
                                        <el-select v-model="form.templateId" placeholder="请选择规则模板"
                                                   style="width: 100%" filterable>
                                            <el-option-group
                                                v-for="group in templateGroups"
                                                :key="group.dimension"
                                                :label="group.dimensionName"
                                            >
                                                <el-option
                                                    v-for="tpl in group.templates"
                                                    :key="tpl.value"
                                                    :label="tpl.label"
                                                    :value="tpl.value"
                                                >
                                                    <el-icon :style="{ color: tpl.color, marginRight: '6px' }">
                                                        <component :is="tpl.icon"/>
                                                    </el-icon>
                                                    <span>{{ tpl.label }}</span>
                                                    <span style="color: #999; font-size: 12px; margin-left: 8px">{{
                                                            tpl.desc
                                                        }}</span>
                                                </el-option>
                                            </el-option-group>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                                <el-col v-if="form.templateId" :span="4">
                                    <div class="template-badge" :style="{ borderColor: selectedTemplate?.color }">
                                        <el-icon :style="{ color: selectedTemplate?.color }">
                                            <component :is="selectedTemplate?.icon"/>
                                        </el-icon>
                                        <span :style="{ color: selectedTemplate?.color }">{{
                                                selectedTemplate?.label
                                            }}</span>
                                    </div>
                                </el-col>
                            </el-row>
                        </el-form>
                    </div>

                    <!-- 校验规则 -->
                    <el-divider direction="vertical"/>
                    <span class="divider-text" style="margin-top: 20px; display: inline-block">校验规则</span>
                    <div class="params-form">
                        <el-form ref="step3bRef" :model="form.ruleCheckParams" :rules="step4Rules" label-width="120px">
                            <el-row :gutter="24">
                                <el-col :span="20">
                                    <el-form-item label="校验方式" prop="checkMethod">
                                        <el-radio-group v-model="form.ruleCheckParams.checkMethod">
                                            <template v-if="selectedTemplateCode === 'FLUCTUATION_CHECK'">
                                                <el-radio label="fluctuation_check">波动率 = |当前值 - 历史均值| /
                                                    历史均值
                                                </el-radio>
                                            </template>
                                            <template v-else>
                                                <el-radio label="expected_minus_actual">期望值 − 实际值</el-radio>
                                                <el-radio label="actual_minus_expected">实际值 − 期望值</el-radio>
                                                <el-radio label="actual_div_expected">实际值 ÷ 期望值</el-radio>
                                                <el-radio label="diff_div_expected">(期望值 − 实际值) ÷ 期望值
                                                </el-radio>
                                            </template>
                                        </el-radio-group>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="6">
                                    <el-form-item label="校验操作符" prop="operator">
                                        <el-select v-model="form.ruleCheckParams.operator" style="width: 100%">
                                            <el-option label="= 等于" value="="/>
                                            <el-option label="≠ 不等于" value="!="/>
                                            <el-option label="> 大于" value=">"/>
                                            <el-option label="≥ 大于等于" value=">="/>
                                            <el-option label="< 小于" value="<"/>
                                            <el-option label="≤ 小于等于" value="<="/>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                                <!-- STAT_CHECK：统计值与期望值比较，期望值类型固定为 FIXED -->
                                <template v-if="selectedTemplateCode === 'STAT_CHECK'">
                                    <el-col :span="7">
                                        <el-form-item label="期望值类型" prop="expectedType">
                                            <el-select v-model="form.ruleCheckParams.expectedType" style="width: 100%"
                                                       @change="onExpectedTypeChange">
                                                <el-option label="固定值" value="FIXED"/>
                                                <el-option label="每天平均" value="DAILY_AVG"/>
                                                <el-option label="每周平均" value="WEEKLY_AVG"/>
                                                <el-option label="每月平均" value="MONTHLY_AVG"/>
                                                <el-option label="过去7天平均" value="LAST_7_DAYS_AVG"/>
                                                <el-option label="过去30天平均" value="LAST_30_DAYS_AVG"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col v-if="form.ruleCheckParams.expectedType === 'FIXED'" :span="5">
                                        <el-form-item label="期望值" prop="expectedValue">
                                            <el-input-number v-model="form.ruleCheckParams.expectedValue" :precision="4"
                                                             style="width: 100%" placeholder="如：100"/>
                                        </el-form-item>
                                    </el-col>
                                </template>
                                <!-- FLUCTUATION_CHECK：波动率比较，需要历史均值窗口 -->
                                <template v-else-if="selectedTemplateCode === 'FLUCTUATION_CHECK'">
                                    <el-col :span="7">
                                        <el-form-item label="历史均值窗口" prop="expectedType">
                                            <el-select v-model="form.ruleCheckParams.expectedType" style="width: 100%"
                                                       @change="onExpectedTypeChange">
                                                <el-option label="每天平均" value="DAILY_AVG"/>
                                                <el-option label="每周平均" value="WEEKLY_AVG"/>
                                                <el-option label="每月平均" value="MONTHLY_AVG"/>
                                                <el-option label="过去7天平均" value="LAST_7_DAYS_AVG"/>
                                                <el-option label="过去30天平均" value="LAST_30_DAYS_AVG"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="5">
                                        <el-form-item label="波动率阈值" prop="expectedValue">
                                            <el-input-number v-model="form.ruleCheckParams.expectedValue" :min="0"
                                                             :precision="4" style="width: 100%"
                                                             placeholder="如：0.1 表示 10%"/>
                                        </el-form-item>
                                    </el-col>
                                </template>
                                <!-- 其他模板：通用期望值类型 + 期望值 -->
                                <template v-else>
                                    <el-col :span="7">
                                        <el-form-item label="期望值类型" prop="expectedType">
                                            <el-select v-model="form.ruleCheckParams.expectedType" style="width: 100%"
                                                       @change="onExpectedTypeChange">
                                                <el-option label="固定值" value="FIXED"/>
                                                <el-option label="每天平均" value="DAILY_AVG"/>
                                                <el-option label="每周平均" value="WEEKLY_AVG"/>
                                                <el-option label="每月平均" value="MONTHLY_AVG"/>
                                                <el-option label="过去7天平均" value="LAST_7_DAYS_AVG"/>
                                                <el-option label="过去30天平均" value="LAST_30_DAYS_AVG"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col v-if="form.ruleCheckParams.expectedType === 'FIXED'" :span="5">
                                        <el-form-item label="期望值" prop="expectedValue">
                                            <el-input-number v-model="form.ruleCheckParams.expectedValue" :min="0"
                                                             :precision="4" style="width: 100%"/>
                                        </el-form-item>
                                    </el-col>
                                </template>
                            </el-row>

                            <!-- 模板专属：数值范围 -->
                            <template v-if="selectedTemplateCode === 'RANGE_CHECK'">
                                <el-row :gutter="24">
                                    <el-col :span="6">
                                        <el-form-item label="最小值" prop="minValue">
                                            <el-input-number v-model="form.ruleCheckParams.minValue" :precision="4"
                                                             style="width: 100%"/>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="6">
                                        <el-form-item label="最大值" prop="maxValue">
                                            <el-input-number v-model="form.ruleCheckParams.maxValue" :precision="4"
                                                             style="width: 100%"/>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </template>

                            <!-- 模板专属：枚举值 -->
                            <template v-if="selectedTemplateCode === 'ENUM_CHECK'">
                                <el-row :gutter="24">
                                    <el-col :span="16">
                                        <el-form-item label="允许的枚举值" prop="enumValues">
                                            <div class="enum-input-area">
                                                <el-tag v-for="(val, idx) in form.ruleCheckParams.enumValues" :key="idx"
                                                        closable @close="removeEnumValue(idx)">{{ val }}
                                                </el-tag>
                                                <el-input v-if="enumInputVisible" ref="enumInputRef"
                                                          v-model="enumInputValue" size="small" style="width: 120px"
                                                          @keyup.enter="addEnumValue" @blur="addEnumValue"/>
                                                <el-button v-else size="small" icon="Plus" @click="showEnumInput">
                                                    添加值
                                                </el-button>
                                            </div>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </template>

                            <!-- 模板专属：正则 -->
                            <template v-if="selectedTemplateCode === 'REGEX_CHECK'">
                                <el-row :gutter="24">
                                    <el-col :span="10">
                                        <el-form-item label="正则表达式" prop="regexPattern">
                                            <el-input v-model="form.ruleCheckParams.regexPattern"
                                                      placeholder="如: ^[0-9]+$"/>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </template>

                            <!-- 模板专属：字段长度 -->
                            <template v-if="selectedTemplateCode === 'LENGTH_CHECK'">
                                <el-row :gutter="24">
                                    <el-col :span="5">
                                        <el-form-item label="操作符" prop="lengthOp">
                                            <el-select v-model="form.ruleCheckParams.lengthOp" style="width: 100%">
                                                <el-option label="< 小于" value="<"/>
                                                <el-option label="> 大于" value=">"/>
                                                <el-option label="= 等于" value="="/>
                                                <el-option label="≠ 不等于" value="!="/>
                                                <el-option label="≤ 小于等于" value="<="/>
                                                <el-option label="≥ 大于等于" value=">="/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="5">
                                        <el-form-item label="长度阈值" prop="length">
                                            <el-input-number v-model="form.ruleCheckParams.length" :min="0"
                                                             :precision="0" style="width: 100%"/>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </template>

                            <!-- 模板专属：统计方式（STAT_CHECK / FLUCTUATION_CHECK） -->
                            <template
                                v-if="selectedTemplateCode === 'STAT_CHECK' || selectedTemplateCode === 'FLUCTUATION_CHECK'">
                                <el-row :gutter="24">
                                    <el-col :span="6">
                                        <el-form-item label="统计方式" prop="statMethod">
                                            <el-select v-model="form.ruleCheckParams.statMethod" style="width: 100%">
                                                <el-option label="平均值 AVG" value="AVG"/>
                                                <el-option label="最大值 MAX" value="MAX"/>
                                                <el-option label="最小值 MIN" value="MIN"/>
                                                <el-option label="求和 SUM" value="SUM"/>
                                                <el-option label="行数 COUNT" value="COUNT"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </template>

                            <!-- 模板专属：字段一致性（同表两字段比较） -->
                            <template v-if="selectedTemplateCode === 'CONSISTENCY_CHECK'">
                                <el-row :gutter="24">
                                    <el-col :span="8">
                                        <el-form-item label="对比字段B" prop="field2">
                                            <el-select v-model="form.ruleCheckParams.field2"
                                                       placeholder="请选择对比字段" style="width: 100%" filterable>
                                                <el-option v-for="col in columnList" :key="col.columnName"
                                                           :label="col.columnName" :value="col.columnName"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </template>

                            <!-- 模板专属：单表时间比较 -->
                            <template v-if="selectedTemplateCode === 'SINGLE_TABLE_TIME_CHECK'">
                                <el-row :gutter="24">
                                    <el-col :span="8">
                                        <el-form-item label="对比时间字段" prop="field2">
                                            <el-select v-model="form.ruleCheckParams.field2"
                                                       placeholder="请选择对比时间字段" style="width: 100%" filterable>
                                                <el-option v-for="col in columnList" :key="col.columnName"
                                                           :label="col.columnName" :value="col.columnName"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="6">
                                        <el-form-item label="时间单位" prop="timeUnit">
                                            <el-select v-model="form.ruleCheckParams.timeUnit" style="width: 100%">
                                                <el-option label="秒" value="1"/>
                                                <el-option label="分钟" value="60"/>
                                                <el-option label="小时" value="3600"/>
                                                <el-option label="天" value="86400"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="6">
                                        <el-form-item label="时间差阈值" prop="threshold">
                                            <el-input-number v-model="form.ruleCheckParams.threshold" :min="0"
                                                             :precision="2" style="width: 100%"/>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </template>

                            <!-- 模板专属：两表时间比较 -->
                            <template v-if="selectedTemplateCode === 'CROSS_TABLE_TIME_CHECK'">
                                <el-row :gutter="24">
                                    <el-col :span="7">
                                        <el-form-item label="参考数据库" prop="refDbName">
                                            <el-select
                                                v-model="form.ruleCheckParams.refDbName"
                                                placeholder="请选择参考库"
                                                style="width: 100%"
                                                filterable
                                                :disabled="!form.datasourceId"
                                                @change="onRefDbChange"
                                            >
                                                <el-option v-for="db in refDbList" :key="db.dbName" :label="db.dbName"
                                                           :value="db.dbName"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="7">
                                        <el-form-item label="参考表名" prop="refTable">
                                            <el-select
                                                v-model="form.ruleCheckParams.refTable"
                                                placeholder="请选择参考表"
                                                style="width: 100%"
                                                filterable
                                                :disabled="!form.ruleCheckParams.refDbName"
                                                @change="onRefTableChange"
                                            >
                                                <el-option v-for="tb in refTableList" :key="tb.tableName"
                                                           :label="tb.tableName" :value="tb.tableName"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="7">
                                        <el-form-item label="关联字段" prop="joinField">
                                            <el-select v-model="form.ruleCheckParams.joinField"
                                                       placeholder="请选择关联字段" style="width: 100%" filterable>
                                                <el-option v-for="col in columnList" :key="col.columnName"
                                                           :label="col.columnName" :value="col.columnName"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                                <el-row :gutter="24">
                                    <el-col :span="7">
                                        <el-form-item label="参考时间字段" prop="field2">
                                            <el-select
                                                v-model="form.ruleCheckParams.field2"
                                                placeholder="请选择参考表时间字段"
                                                style="width: 100%"
                                                filterable
                                                :disabled="!form.ruleCheckParams.refTable"
                                            >
                                                <el-option v-for="col in refColumnList" :key="col.columnName"
                                                           :label="col.columnName" :value="col.columnName"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="6">
                                        <el-form-item label="时间单位" prop="timeUnit">
                                            <el-select v-model="form.ruleCheckParams.timeUnit" style="width: 100%">
                                                <el-option label="秒" value="1"/>
                                                <el-option label="分钟" value="60"/>
                                                <el-option label="小时" value="3600"/>
                                                <el-option label="天" value="86400"/>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="6">
                                        <el-form-item label="时间差阈值" prop="threshold">
                                            <el-input-number v-model="form.ruleCheckParams.threshold" :min="0"
                                                             :precision="2" style="width: 100%"/>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </template>
                        </el-form>
                    </div>
                </div>
            </div>

            <!-- 步骤四：任务参数配置 -->
            <div v-show="currentStep === 3" class="step-layout">
                <div class="select-header">
                    <div class="select-header-title">任务参数配置</div>
                    <div class="select-header-subtitle">配置 Spark 任务的资源参数</div>
                </div>
                <div class="step-form-body">
                    <el-divider direction="vertical"/>
                    <span class="divider-text">资源配置</span>
                    <div class="params-form">
                        <el-form ref="step4Ref" :model="form.sparkParamsObj" :rules="step4SparkRules"
                                 label-width="140px">
                            <el-row :gutter="24">
                                <el-col :span="8">
                                    <el-form-item label="部署模式" prop="deployMode">
                                        <el-select v-model="form.sparkParamsObj.deployMode" placeholder="请选择部署模式"
                                                   style="width: 100%">
                                            <el-option-group label="YARN">
                                                <el-option label="YARN_CLIENT" value="YARN_CLIENT"/>
                                                <el-option label="YARN_CLUSTER" value="YARN_CLUSTER"/>
                                            </el-option-group>
                                            <el-option-group label="Local">
                                                <el-option label="LOCAL（本地模式）" value="LOCAL"/>
                                            </el-option-group>
                                            <el-option-group label="Standalone">
                                                <el-option label="STANDALONE_CLIENT" value="STANDALONE_CLIENT"/>
                                                <el-option label="STANDALONE_CLUSTER" value="STANDALONE_CLUSTER"/>
                                            </el-option-group>
                                            <el-option-group label="Kubernetes">
                                                <el-option label="K8S_CLIENT" value="K8S_CLIENT"/>
                                                <el-option label="K8S_CLUSTER" value="K8S_CLUSTER"/>
                                            </el-option-group>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                                <!-- Standalone/K8S 需要填写 master 地址 -->
                                <el-col v-if="needMasterInput" :span="8">
                                    <el-form-item label="Master地址" prop="masterAddress">
                                        <el-input
                                            v-model="form.sparkParamsObj.masterAddress"
                                            :placeholder="masterAddressPlaceholder"
                                            clearable
                                        />
                                    </el-form-item>
                                </el-col>
                                <el-col :span="7">
                                    <el-form-item label="Yarn队列" prop="queue">
                                        <el-input v-model="form.sparkParamsObj.queue" :disabled="!isYarnMode"
                                                  placeholder="选填，如 default" clearable/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="7">
                                    <el-form-item label="Driver核心数" prop="driverCores">
                                        <el-input-number v-model="form.sparkParamsObj.driverCores" :min="1"
                                                         :precision="0" :step="1" style="width: 100%"
                                                         placeholder="正整数"/>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="7">
                                    <el-form-item label="Driver内存" prop="driverMemory">
                                        <el-input-number v-model="form.sparkParamsObj.driverMemory" :min="1"
                                                         :precision="0" :step="1" style="width: 100%"
                                                         placeholder="正整数">
                                            <template #append>GB</template>
                                        </el-input-number>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="7">
                                    <el-form-item label="Executor数量" prop="numExecutors">
                                        <el-input-number v-model="form.sparkParamsObj.numExecutors" :min="1"
                                                         :precision="0" :step="1" style="width: 100%"
                                                         placeholder="正整数"/>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="7">
                                    <el-form-item label="Executor内存" prop="executorMemory">
                                        <el-input-number v-model="form.sparkParamsObj.executorMemory" :min="1"
                                                         :precision="0" :step="1" style="width: 100%"
                                                         placeholder="正整数">
                                            <template #append>GB</template>
                                        </el-input-number>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="7">
                                    <el-form-item label="Executor核心数" prop="executorCores">
                                        <el-input-number v-model="form.sparkParamsObj.executorCores" :min="1"
                                                         :precision="0" :step="1" style="width: 100%"
                                                         placeholder="正整数"/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-form>
                    </div>
                    <el-divider direction="vertical"/>
                    <span class="divider-text" style="margin-top: 20px; display: inline-block">其他参数</span>
                    <div class="params-form">
                        <el-form label-width="140px">
                            <el-row :gutter="24">
                                <el-col :span="16">
                                    <el-form-item label="其他参数">
                                        <el-input
                                            v-model="form.sparkParamsObj.otherParams"
                                            type="textarea"
                                            :rows="4"
                                            placeholder="选填，如 --conf spark.executor.extraJavaOptions=-XX:+UseG1GC"
                                        />
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-form>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部操作栏（固定右下） -->
        <div class="task-bottom">
            <el-button v-if="currentStep === 0" @click="goBack">取消</el-button>
            <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
            <el-button v-if="currentStep < 3" type="primary" @click="nextStep">下一步</el-button>
            <el-button v-if="currentStep === 3" type="primary" :loading="submitLoading" @click="handleSubmit">保存规则
            </el-button>
        </div>
    </div>
</template>

<script setup name="DqRuleForm">
import {ref, reactive, computed, watch, onMounted, nextTick} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import {ElMessage} from 'element-plus';
import * as ruleApi from '@/api/dataquality/ruleApi';
import {getTemplateList} from '@/api/dataquality/templateApi';
import {getDatasourceList} from '@/api/metadata/datasourceApi';
import {getDatasourceList as getDbList} from '@/api/metadata/dbApi';
import {listTable} from '@/api/metadata/tableApi';
import {listColumnByName} from '@/api/metadata/columnApi';

const router = useRouter();
const route = useRoute();

const isEdit = computed(() => !!route.params.id);
const currentStep = ref(0);
const submitLoading = ref(false);

// 步骤 ref
const step1Ref = ref(null);
const step2Ref = ref(null);
const step3aRef = ref(null);
const step3bRef = ref(null);
const step4Ref = ref(null);

// 联动数据
const datasourceList = ref([]);
const dbList = ref([]);
const tableList = ref([]);
const columnList = ref([]);
// 参考表联动（CROSS_TABLE_TIME_CHECK 专用）
const refDbList = ref([]);
const refTableList = ref([]);
const refColumnList = ref([]);

// 规则模板列表
const templateOptions = ref([]);

// 大类维度中文名映射（按展示顺序）
const DIMENSION_ORDER = ['completeness', 'uniqueness', 'timeliness', 'validity', 'consistency', 'stability'];
const DIMENSION_LABEL = {
    completeness: '完整性',
    uniqueness: '唯一性',
    timeliness: '及时性',
    validity: '有效性',
    consistency: '一致性',
    stability: '稳定性',
};

// 将 templateOptions 按大类分组，供 el-option-group 使用
const templateGroups = computed(() => {
    const map = {};
    templateOptions.value.forEach((tpl) => {
        const dim = tpl.dimension || 'other';
        if (!map[dim]) map[dim] = [];
        map[dim].push(tpl);
    });
    return DIMENSION_ORDER
        .filter((d) => map[d] && map[d].length > 0)
        .map((d) => ({
            dimension: d,
            dimensionName: `${DIMENSION_LABEL[d] || d}（${d}）`,
            templates: map[d],
        }));
});

// 枚举输入
const enumInputVisible = ref(false);
const enumInputValue = ref('');
const enumInputRef = ref(null);

// 表单数据
const form = reactive({
    id: null,
    ruleName: '',
    description: '',
    enabled: 1,
    templateId: null,
    datasourceId: null,
    dbName: '',
    tableName: '',
    fieldNames: '',
    ruleCheckParams: {
        checkMethod: 'actual_minus_expected',
        operator: '>',
        expectedType: 'FIXED',
        expectedValue: 0,
        minValue: null,
        maxValue: null,
        enumValues: [],
        regexPattern: '',
        lengthOp: '!=',
        length: null,
        statMethod: 'COUNT',
        field2: '',
        timeUnit: '3600',
        threshold: null,
        refTable: '',
        refDbName: '',
        joinField: '',
    },
    sparkParamsObj: {
        deployMode: 'LOCAL',
        masterAddress: '',
        driverCores: 1,
        driverMemory: 1,
        numExecutors: 1,
        executorMemory: 1,
        executorCores: 1,
        queue: '',
        otherParams: '',
    },
});

// 当前选中模板的 templateCode（用于专属配置判断）
const selectedTemplateCode = computed(() => {
    if (!form.templateId) return '';
    const tpl = templateOptions.value.find((t) => t.value === form.templateId);
    return tpl?.templateCode || '';
});

// 切换模板时：自动为特殊模板设置默认 checkMethod
watch(selectedTemplateCode, (code) => {
    if (code === 'FLUCTUATION_CHECK') {
        form.ruleCheckParams.checkMethod = 'fluctuation_check';
        // 波动率默认用近7天历史均值
        if (!form.ruleCheckParams.expectedType || form.ruleCheckParams.expectedType === 'FIXED') {
            form.ruleCheckParams.expectedType = 'LAST_7_DAYS_AVG';
        }
    } else if (code === 'STAT_CHECK') {
        if (form.ruleCheckParams.checkMethod === 'fluctuation_check') {
            form.ruleCheckParams.checkMethod = 'actual_minus_expected';
        }
    } else if (['CONSISTENCY_CHECK', 'NULL_CHECK', 'EMPTY_STRING_CHECK', 'UNIQUENESS_CHECK',
        'DUPLICATE_COUNT_CHECK', 'RANGE_CHECK', 'ENUM_CHECK', 'REGEX_CHECK',
        'LENGTH_CHECK', 'SINGLE_TABLE_TIME_CHECK', 'CROSS_TABLE_TIME_CHECK'].includes(code)) {
        // 对于非波动性校验模板，如果当前是 fluctuation_check，重置为默认
        if (form.ruleCheckParams.checkMethod === 'fluctuation_check') {
            form.ruleCheckParams.checkMethod = 'actual_minus_expected';
        }
    }
});

// 当前选中模板对象（用于 badge 展示）
const selectedTemplate = computed(() => {
    return templateOptions.value.find((t) => t.value === form.templateId) || null;
});

// 步骤一校验规则
const step1Rules = {
    ruleName: [
        {required: true, message: '请输入规则名称', trigger: 'blur'},
        {min: 2, max: 128, message: '规则名称长度在 2 到 128 个字符', trigger: 'blur'},
    ],
};

// 步骤二校验规则
const step2Rules = {
    datasourceId: [{required: true, message: '请选择数据源', trigger: 'change'}],
    dbName: [{required: true, message: '请选择数据库', trigger: 'change'}],
    tableName: [{required: true, message: '请选择数据表', trigger: 'change'}],
    fieldNames: [{required: true, message: '请选择检测字段', trigger: 'change'}],
};

// 步骤三a：模板校验
const step3aRules = {
    templateId: [{required: true, message: '请选择规则模板', trigger: 'change'}],
};

// 步骤三b/四：校验规则（动态规则，根据当前模板决定哪些专属字段必填）
const step4Rules = computed(() => {
    const code = selectedTemplateCode.value;
    const rules = {
        checkMethod: [{required: true, message: '请选择校验方式', trigger: 'change'}],
        operator: [{required: true, message: '请选择校验操作符', trigger: 'change'}],
        expectedType: [{required: true, message: '请选择期望值类型', trigger: 'change'}],
        expectedValue: [{required: true, message: '请输入期望值', trigger: 'blur', type: 'number'}],
    };
    // 一致性比较：对比字段B必填
    if (code === 'CONSISTENCY_CHECK') {
        rules.field2 = [{required: true, message: '请选择对比字段B', trigger: 'change'}];
    }
    // 统计/波动：统计方式必填
    if (code === 'STAT_CHECK' || code === 'FLUCTUATION_CHECK') {
        rules.statMethod = [{required: true, message: '请选择统计方式', trigger: 'change'}];
    }
    // 单表时间比较
    if (code === 'SINGLE_TABLE_TIME_CHECK') {
        rules.field2 = [{required: true, message: '请选择对比时间字段', trigger: 'change'}];
        rules.timeUnit = [{required: true, message: '请选择时间单位', trigger: 'change'}];
        rules.threshold = [{required: true, message: '请输入时间差阈值', trigger: 'blur', type: 'number'}];
    }
    // 跨表时间比较
    if (code === 'CROSS_TABLE_TIME_CHECK') {
        rules.refTable = [{required: true, message: '请选择参考表', trigger: 'change'}];
        rules.refDbName = [{required: true, message: '请选择参考数据库', trigger: 'change'}];
        rules.joinField = [{required: true, message: '请选择关联字段', trigger: 'change'}];
        rules.field2 = [{required: true, message: '请选择参考时间字段', trigger: 'change'}];
        rules.timeUnit = [{required: true, message: '请选择时间单位', trigger: 'change'}];
        rules.threshold = [{required: true, message: '请输入时间差阈值', trigger: 'blur', type: 'number'}];
    }
    return rules;
});

// 步骤四：Spark 参数校验
const step4SparkRules = computed(() => ({
    deployMode: [{required: true, message: '请选择部署模式', trigger: 'change'}],
    masterAddress: needMasterInput.value
        ? [{required: true, message: '请输入 Master 地址', trigger: 'blur'}]
        : [],
    driverCores: [{required: true, message: '请输入 Driver 核心数', trigger: 'blur', type: 'number'}],
    driverMemory: [{required: true, message: '请输入 Driver 内存', trigger: 'blur', type: 'number'}],
    numExecutors: [{required: true, message: '请输入 Executor 数量', trigger: 'blur', type: 'number'}],
    executorMemory: [{required: true, message: '请输入 Executor 内存', trigger: 'blur', type: 'number'}],
    executorCores: [{required: true, message: '请输入 Executor 核心数', trigger: 'blur', type: 'number'}],
}));

// 是否需要填写 Master 地址（Standalone/K8S 模式）
const needMasterInput = computed(() => {
    const m = form.sparkParamsObj.deployMode;
    return ['STANDALONE_CLIENT', 'STANDALONE_CLUSTER', 'K8S_CLIENT', 'K8S_CLUSTER'].includes(m);
});

// 是否是 YARN 模式（队列字段仅 YARN 下可用）
const isYarnMode = computed(() => {
    const m = form.sparkParamsObj.deployMode;
    return ['YARN_CLIENT', 'YARN_CLUSTER'].includes(m);
});

// Master 地址输入框占位提示
const masterAddressPlaceholder = computed(() => {
    const m = form.sparkParamsObj.deployMode;
    if (m === 'STANDALONE_CLIENT' || m === 'STANDALONE_CLUSTER') return '如：spark://host:7077';
    if (m === 'K8S_CLIENT' || m === 'K8S_CLUSTER') return '如：k8s://https://host:6443';
    return '';
});

// 上一步
const prevStep = () => {
    currentStep.value--;
};

// 下一步
const nextStep = async () => {
    if (currentStep.value === 0) {
        const valid = await step1Ref.value?.validate().catch(() => false);
        if (!valid) return;
    }
    if (currentStep.value === 1) {
        const valid = await step2Ref.value?.validate().catch(() => false);
        if (!valid) return;
    }
    if (currentStep.value === 2) {
        const v1 = await step3aRef.value?.validate().catch(() => false);
        const v2 = await step3bRef.value?.validate().catch(() => false);
        if (!v1 || !v2) return;
    }
    currentStep.value++;
};

// 提交
const handleSubmit = async () => {
    const valid = await step4Ref.value?.validate().catch(() => false);
    if (!valid) return;

    submitLoading.value = true;
    try {
        const payload = {
            ruleName: form.ruleName,
            templateId: form.templateId,
            description: form.description,
            enabled: form.enabled,
            datasourceId: form.datasourceId,
            dbName: form.dbName,
            tableName: form.tableName,
            fieldNames: form.fieldNames,
            ruleCheckParams: {...form.ruleCheckParams},
            sparkParams: JSON.stringify(form.sparkParamsObj),
        };
        if (isEdit.value) {
            payload.id = form.id;
            await ruleApi.updateRule(payload);
            ElMessage.success('规则更新成功');
        } else {
            await ruleApi.createRule(payload);
            ElMessage.success('规则创建成功');
        }
        router.push('/dataquality/rule');
    } catch (e) {
        ElMessage.error(isEdit.value ? '规则更新失败' : '规则创建失败');
    } finally {
        submitLoading.value = false;
    }
};

const goBack = () => {
    router.push('/dataquality/rule');
};

// 数据源联动
const onDatasourceChange = async (val) => {
    form.dbName = '';
    form.tableName = '';
    form.fieldNames = '';
    dbList.value = [];
    tableList.value = [];
    columnList.value = [];
    // 同步重置参考表选项
    form.ruleCheckParams.refDbName = '';
    form.ruleCheckParams.refTable = '';
    form.ruleCheckParams.field2 = '';
    refDbList.value = [];
    refTableList.value = [];
    refColumnList.value = [];
    if (!val) return;
    try {
        const res = await getDbList(val);
        dbList.value = Array.isArray(res) ? res : (res.data || []);
        // 参考库与主库共用同一数据源
        refDbList.value = dbList.value;
    } catch {
        ElMessage.error('获取数据库列表失败');
    }
};

const onDatabaseChange = async (val) => {
    form.tableName = '';
    form.fieldNames = '';
    tableList.value = [];
    columnList.value = [];
    if (!val) return;
    try {
        const res = await listTable({datasourceId: form.datasourceId, dbName: val});
        tableList.value = Array.isArray(res) ? res : (res.data || []);
    } catch {
        ElMessage.error('获取数据表列表失败');
    }
};

const onTableChange = async (val) => {
    form.fieldNames = '';
    columnList.value = [];
    if (!val) return;
    try {
        const res = await listColumnByName(form.datasourceId, form.dbName, val);
        columnList.value = Array.isArray(res) ? res : (res.data || []);
    } catch {
        ElMessage.error('获取字段列表失败');
    }
};

// 参考表联动（CROSS_TABLE_TIME_CHECK）
// 数据源选中后同时加载参考库列表（与主库共用同一数据源）
const loadRefDbList = async () => {
    if (!form.datasourceId) return;
    try {
        const res = await getDbList(form.datasourceId);
        refDbList.value = Array.isArray(res) ? res : (res.data || []);
    } catch {
        ElMessage.error('获取参考库列表失败');
    }
};

const onRefDbChange = async (val) => {
    form.ruleCheckParams.refTable = '';
    form.ruleCheckParams.field2 = '';
    refTableList.value = [];
    refColumnList.value = [];
    if (!val) return;
    try {
        const res = await listTable({datasourceId: form.datasourceId, dbName: val});
        refTableList.value = Array.isArray(res) ? res : (res.data || []);
    } catch {
        ElMessage.error('获取参考表列表失败');
    }
};

const onRefTableChange = async (val) => {
    form.ruleCheckParams.field2 = '';
    refColumnList.value = [];
    if (!val) return;
    try {
        const res = await listColumnByName(form.datasourceId, form.ruleCheckParams.refDbName, val);
        refColumnList.value = Array.isArray(res) ? res : (res.data || []);
    } catch {
        ElMessage.error('获取参考表字段列表失败');
    }
};

const onExpectedTypeChange = (val) => {
    form.ruleCheckParams.expectedValue = val !== 'FIXED' ? null : 0;
};

// 枚举值操作
const showEnumInput = () => {
    enumInputVisible.value = true;
    nextTick(() => enumInputRef.value?.focus());
};
const addEnumValue = () => {
    if (enumInputValue.value.trim()) {
        form.ruleCheckParams.enumValues.push(enumInputValue.value.trim());
    }
    enumInputVisible.value = false;
    enumInputValue.value = '';
};
const removeEnumValue = (idx) => {
    form.ruleCheckParams.enumValues.splice(idx, 1);
};

// 内置默认模板
const DEFAULT_TEMPLATES = [
    {
        value: 1,
        templateCode: 'NULL_CHECK',
        label: '空值检测',
        icon: 'Warning',
        color: '#e6a23c',
        desc: '检测字段中空值/NULL 的数量或比例',
        dimension: 'completeness'
    },
    {
        value: 2,
        templateCode: 'UNIQUENESS_CHECK',
        label: '唯一性检测',
        icon: 'Key',
        color: '#67c23a',
        desc: '检测字段值是否唯一，无重复',
        dimension: 'uniqueness'
    },
    {
        value: 3,
        templateCode: 'DUPLICATE_CHECK',
        label: '重复值检测',
        icon: 'CopyDocument',
        color: '#f56c6c',
        desc: '检测字段中重复值的数量或比例',
        dimension: 'uniqueness'
    },
    {
        value: 4,
        templateCode: 'RANGE_CHECK',
        label: '数值范围检测',
        icon: 'Odometer',
        color: '#409eff',
        desc: '检测数值字段是否在指定范围内',
        dimension: 'validity'
    },
    {
        value: 5,
        templateCode: 'ENUM_CHECK',
        label: '枚举值检测',
        icon: 'List',
        color: '#909399',
        desc: '检测字段值是否属于指定枚举集合',
        dimension: 'validity'
    },
    {
        value: 6,
        templateCode: 'REGEX_CHECK',
        label: '正则格式检测',
        icon: 'EditPen',
        color: '#6c5ff5',
        desc: '检测字段值是否符合正则表达式',
        dimension: 'validity'
    },
];

// 加载规则模板
const loadTemplates = async () => {
    try {
        const res = await getTemplateList();
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) {
            templateOptions.value = list.map((t) => ({
                value: t.id,
                templateCode: t.templateCode,
                label: t.templateName,
                icon: t.templateIcon || 'Warning',
                color: t.templateColor || '#409eff',
                desc: t.description || '',
                dimension: t.dimension || 'other',
            }));
        } else {
            templateOptions.value = DEFAULT_TEMPLATES;
        }
    } catch {
        templateOptions.value = DEFAULT_TEMPLATES;
    }
};

// 加载数据源列表
const loadDatasources = async () => {
    try {
        const res = await getDatasourceList('', null);
        datasourceList.value = Array.isArray(res) ? res : (res.data || res.rows || []);
    } catch {
        ElMessage.error('获取数据源列表失败');
    }
};

// 编辑时回填数据
const loadEditData = async () => {
    const id = route.params.id;
    if (!id) return;
    try {
        const res = await ruleApi.getRuleDetail(id);
        form.id = res.id;
        form.ruleName = res.ruleName || '';
        form.description = res.description || '';
        form.enabled = res.enabled ?? 1;
        form.templateId = res.templateId || null;
        form.datasourceId = res.datasourceId || null;
        form.dbName = res.dbName || '';
        form.tableName = res.tableName || '';
        form.fieldNames = res.fieldNames ? res.fieldNames.trim() : '';
        // 解析 rule_config（步骤三校验规则）
        if (res.ruleConfig) {
            try {
                const cfg = JSON.parse(res.ruleConfig);
                const checkFields = ['checkMethod', 'operator', 'expectedType', 'expectedValue',
                    'minValue', 'maxValue', 'enumValues', 'regexPattern',
                    'lengthOp', 'length', 'statMethod', 'field2', 'timeUnit',
                    'threshold', 'refTable', 'refDbName', 'joinField'];
                checkFields.forEach((key) => {
                    if (cfg[key] !== undefined) form.ruleCheckParams[key] = cfg[key];
                });
            } catch (e) {
                console.warn('解析 ruleConfig 失败', e);
            }
        }
        // 解析 sparkParams（步骤四）
        if (res.sparkParams) {
            try {
                const sp = JSON.parse(res.sparkParams);
                Object.keys(form.sparkParamsObj).forEach((key) => {
                    if (sp[key] !== undefined) form.sparkParamsObj[key] = sp[key];
                });
            } catch (e) {
                console.warn('解析 sparkParams 失败', e);
            }
        }
        // 回填联动下拉数据（直接加载各级列表，不走 onChange 事件，避免清空已赋值字段）
        if (form.datasourceId) {
            try {
                const dbRes = await getDbList(form.datasourceId);
                dbList.value = Array.isArray(dbRes) ? dbRes : (dbRes.data || []);
                // 参考库与主库共用同一数据源
                refDbList.value = dbList.value;
            } catch { /* ignore */
            }
        }
        if (form.datasourceId && form.dbName) {
            try {
                const tableRes = await listTable({datasourceId: form.datasourceId, dbName: form.dbName});
                tableList.value = Array.isArray(tableRes) ? tableRes : (tableRes.data || []);
            } catch { /* ignore */
            }
        }
        if (form.datasourceId && form.dbName && form.tableName) {
            try {
                const colRes = await listColumnByName(form.datasourceId, form.dbName, form.tableName);
                columnList.value = Array.isArray(colRes) ? colRes : (colRes.data || []);
            } catch { /* ignore */
            }
        }
        // 回填参考表三级联动
        const refDb = form.ruleCheckParams.refDbName;
        const refTb = form.ruleCheckParams.refTable;
        if (form.datasourceId && refDb) {
            try {
                const refTableRes = await listTable({datasourceId: form.datasourceId, dbName: refDb});
                refTableList.value = Array.isArray(refTableRes) ? refTableRes : (refTableRes.data || []);
            } catch { /* ignore */
            }
        }
        if (form.datasourceId && refDb && refTb) {
            try {
                const refColRes = await listColumnByName(form.datasourceId, refDb, refTb);
                refColumnList.value = Array.isArray(refColRes) ? refColRes : (refColRes.data || []);
            } catch { /* ignore */
            }
        }
    } catch (e) {
        ElMessage.error('获取规则详情失败');
    }
};

onMounted(async () => {
    await Promise.all([loadTemplates(), loadDatasources()]);
    await loadEditData();
});
</script>

<style scoped lang="scss">
/* ========== 与 datasync/job.vue 对齐的整体布局 ========== */

.rule-form-page {
    padding: 0;
}

.task-header {
    box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.1);
    z-index: 10;
    text-align: center;
    padding: 15px 10px;
    background: #ffffff;
}

.layout {
    height: calc(100vh - 220px);
    overflow-y: auto;
    padding: 0 20px;
}

/* ========== 步骤内容区 ========== */

.step-layout {
    display: flex;
    flex-direction: column;
}

.select-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0 15px;
    border: 1px dashed #d2dae2;
    margin-top: 12px;
    border-radius: 4px;
    background: #fafbfc;

    .select-header-title {
        font-size: 14px;
        font-weight: bold;
        color: #303133;
    }

    .select-header-subtitle {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
    }
}

.step-form-body {
    margin-top: 16px;

    /* 竖线 + 小标题，与 datasync 一致 */
    > .el-divider--vertical {
        border-left: 2px #1c84c6 solid;
        margin: 0 5px;
    }

    .divider-text {
        display: inline-block;
        font-size: 13px;
        font-weight: 600;
        color: #303133;
        margin-top: 10px;
        vertical-align: middle;
    }
}

.params-form {
    margin-top: 12px;
    border: 1px dashed #e2dcd2;
    padding: 16px 20px 4px;
    border-radius: 4px;
    background: #fff;
}

/* ========== 模板选择卡片 ========== */

.template-group {
    width: 100%;
    margin-top: 4px;
}

.template-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    width: 100%;
}

.template-card {
    width: 100%;
    height: auto;

    :deep(.el-radio-button__inner) {
        width: 100%;
        height: auto;
        padding: 0;
        border-radius: 8px !important;
        border: 1px solid var(--el-border-color) !important;
        box-shadow: none !important;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
        border-color: var(--el-color-primary) !important;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
    }
}

.template-card-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 12px;
    gap: 8px;
    cursor: pointer;

    .template-icon {
        font-size: 30px;
    }

    .template-name {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
    }

    .template-desc {
        font-size: 12px;
        color: #909399;
        text-align: center;
        line-height: 1.5;
    }
}

.template-required-tip {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 12px;
    padding: 8px 12px;
    background: #fef0f0;
    border-radius: 4px;
    color: #f56c6c;
    font-size: 13px;
}

/* ========== 模板 badge（下拉选中后的标识） ========== */

.template-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border: 2px solid #409eff;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    margin-top: 4px;
}

/* ========== 枚举输入区 ========== */

.enum-input-area {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    min-height: 40px;
    background: #fff;
    width: 100%;
    box-sizing: border-box;
}

/* ========== 底部操作栏（固定右下，与 datasync 一致） ========== */

.task-bottom {
    padding: 16px;
    margin-top: 5px;
    position: fixed;
    bottom: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    border-top: 1px solid var(--el-border-color-light);
    display: flex;
    gap: 8px;
    z-index: 99;
}
</style>
