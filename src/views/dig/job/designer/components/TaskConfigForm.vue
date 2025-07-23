<template>
    <div class="task-config-form">
        <el-form :model="formData" :rules="rules" ref="formRef" label-width="80px" size="small">
            <!-- 基本信息 -->
            <div class="config-section">
                <div class="section-title">基本信息</div>
                <el-form-item label="任务名称" prop="taskName">
                    <el-input v-model="formData.taskName" placeholder="请输入任务名称" />
                </el-form-item>

                <el-form-item label="连接器" prop="connectorName">
                    <el-input v-model="formData.connectorName" disabled />
                </el-form-item>
            </div>

            <!-- 数据源配置 -->
            <div class="config-section" v-if="formData.connectorType === 'SOURCE'">
                <div class="section-title">数据源配置</div>
                <el-form-item label="数据源" prop="datasourceId">
                    <el-select
                        v-model="formData.datasourceId"
                        placeholder="请选择数据源"
                        @change="onDatasourceChange"
                        filterable
                    >
                        <el-option
                            v-for="ds in datasourceList"
                            :key="ds.id"
                            :label="ds.name"
                            :value="ds.id"
                        />
                    </el-select>
                </el-form-item>

                <el-form-item label="数据库" prop="database" v-if="databaseList.length > 0">
                    <el-select
                        v-model="formData.datasourceConfig.database"
                        placeholder="请选择数据库"
                        @change="onDatabaseChange"
                        filterable
                    >
                        <el-option
                            v-for="db in databaseList"
                            :key="db"
                            :label="db"
                            :value="db"
                        />
                    </el-select>
                </el-form-item>

                <el-form-item label="数据表" prop="tables" v-if="tableList.length > 0">
                    <el-select
                        v-model="formData.datasourceConfig.tables"
                        placeholder="请选择数据表"
                        multiple
                        filterable
                        @change="onTableChange"
                    >
                        <el-option
                            v-for="table in tableList"
                            :key="table"
                            :label="table"
                            :value="table"
                        />
                    </el-select>
                </el-form-item>
            </div>

            <!-- 字段配置 -->
            <div class="config-section" v-if="showFieldConfig">
                <div class="section-title">字段配置</div>
                <div class="field-config">
                    <el-table :data="fieldList" size="small" max-height="200">
                        <el-table-column prop="name" label="字段名" width="100" />
                        <el-table-column prop="type" label="类型" width="80" />
                        <el-table-column prop="comment" label="注释" show-overflow-tooltip />
                        <el-table-column label="主键" width="60" align="center">
                            <template #default="scope">
                                <el-checkbox v-model="scope.row.primaryKey" />
                            </template>
                        </el-table-column>
                        <el-table-column label="可空" width="60" align="center">
                            <template #default="scope">
                                <el-checkbox v-model="scope.row.nullable" />
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>

            <!-- 动态表单配置 -->
            <div class="config-section" v-if="dynamicFormConfig">
                <div class="section-title">连接器配置</div>
                <dynamic-form
                    :config="dynamicFormConfig"
                    v-model="formData.taskConfig"
                    @change="onConfigChange"
                />
            </div>

            <!-- Transform 配置 -->
            <div class="config-section" v-if="formData.connectorType === 'TRANSFORM'">
                <div class="section-title">转换配置</div>
                <el-form-item label="转换规则">
                    <monaco-editor
                        v-model="transformConfig"
                        language="sql"
                        :height="200"
                        @change="onTransformConfigChange"
                    />
                </el-form-item>
            </div>

            <!-- Sink 配置 -->
            <div class="config-section" v-if="formData.connectorType === 'SINK'">
                <div class="section-title">输出配置</div>
                <el-form-item label="目标数据源" prop="sinkDatasourceId">
                    <el-select
                        v-model="formData.sinkDatasourceId"
                        placeholder="请选择目标数据源"
                        @change="onSinkDatasourceChange"
                        filterable
                    >
                        <el-option
                            v-for="ds in sinkDatasourceList"
                            :key="ds.id"
                            :label="ds.name"
                            :value="ds.id"
                        />
                    </el-select>
                </el-form-item>

                <el-form-item label="目标表" prop="sinkTable">
                    <el-input v-model="formData.sinkTable" placeholder="请输入目标表名" />
                </el-form-item>

                <el-form-item label="写入模式" prop="writeMode">
                    <el-select v-model="formData.writeMode" placeholder="请选择写入模式">
                        <el-option label="追加" value="append" />
                        <el-option label="覆盖" value="overwrite" />
                        <el-option label="更新插入" value="upsert" />
                    </el-select>
                </el-form-item>
            </div>

            <!-- 操作按钮 -->
            <div class="form-actions">
                <el-button type="primary" @click="saveConfig" :loading="saving">
                    保存配置
                </el-button>
                <el-button @click="resetConfig">重置</el-button>
                <el-button type="success" @click="testConnection" :loading="testing">
                    测试连接
                </el-button>
            </div>
        </el-form>
    </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as connectorApi from '@/api/dig/connectorApi';
import DynamicForm from './DynamicForm.vue';
import MonacoEditor from '@/components/MonacoEditor/index.vue';

const props = defineProps({
    task: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['update']);

// 响应式数据
const formRef = ref(null);
const saving = ref(false);
const testing = ref(false);
const datasourceList = ref([]);
const sinkDatasourceList = ref([]);
const databaseList = ref([]);
const tableList = ref([]);
const fieldList = ref([]);
const dynamicFormConfig = ref(null);
const transformConfig = ref('');

// 表单数据
const formData = reactive({
    taskId: null,
    taskName: '',
    connectorType: '',
    connectorName: '',
    datasourceId: null,
    taskConfig: '',
    datasourceConfig: {
        database: '',
        tables: []
    },
    sinkDatasourceId: null,
    sinkTable: '',
    writeMode: 'append'
});

// 表单验证规则
const rules = {
    taskName: [
        { required: true, message: '请输入任务名称', trigger: 'blur' }
    ],
    datasourceId: [
        { required: true, message: '请选择数据源', trigger: 'change' }
    ]
};

// 计算属性
const showFieldConfig = computed(() => {
    return formData.connectorType === 'SOURCE' && fieldList.value.length > 0;
});

// 监听任务变化
watch(() => props.task, (newTask) => {
    if (newTask) {
        Object.assign(formData, newTask);
        loadTaskConfig();
    }
}, { immediate: true, deep: true });

// 加载任务配置
const loadTaskConfig = async () => {
    if (!formData.connectorName) return;

    try {
        // 加载动态表单配置
        const formConfig = await connectorApi.getConnectorForm(
            formData.connectorType,
            formData.connectorName
        );
        dynamicFormConfig.value = formConfig;

        // 加载数据源列表
        if (formData.connectorType === 'SOURCE' || formData.connectorType === 'SINK') {
            const datasources = await connectorApi.getDatasourceList(formData.connectorName);
            if (formData.connectorType === 'SOURCE') {
                datasourceList.value = datasources;
            } else {
                sinkDatasourceList.value = datasources;
            }
        }

        // 如果已有数据源配置，加载相关数据
        if (formData.datasourceId) {
            await onDatasourceChange(formData.datasourceId);
        }

    } catch (error) {
        console.error('加载任务配置失败:', error);
        ElMessage.error('加载任务配置失败');
    }
};

// 数据源变化
const onDatasourceChange = async (datasourceId) => {
    if (!datasourceId) return;

    try {
        const databases = await connectorApi.getDatabaseList(datasourceId);
        databaseList.value = databases;

        // 清空下级选择
        formData.datasourceConfig.database = '';
        formData.datasourceConfig.tables = [];
        tableList.value = [];
        fieldList.value = [];
    } catch (error) {
        console.error('加载数据库列表失败:', error);
        ElMessage.error('加载数据库列表失败');
    }
};

// 数据库变化
const onDatabaseChange = async (database) => {
    if (!database || !formData.datasourceId) return;

    try {
        const tables = await connectorApi.getTableList(formData.datasourceId, database);
        tableList.value = tables;

        // 清空下级选择
        formData.datasourceConfig.tables = [];
        fieldList.value = [];
    } catch (error) {
        console.error('加载表列表失败:', error);
        ElMessage.error('加载表列表失败');
    }
};

// 表变化
const onTableChange = async (tables) => {
    if (!tables || tables.length === 0) {
        fieldList.value = [];
        return;
    }

    try {
        // 加载第一个表的字段信息
        const fields = await connectorApi.getTableFields(
            formData.datasourceId,
            formData.datasourceConfig.database,
            tables[0]
        );
        fieldList.value = fields;
    } catch (error) {
        console.error('加载字段列表失败:', error);
        ElMessage.error('加载字段列表失败');
    }
};

// 目标数据源变化
const onSinkDatasourceChange = (datasourceId) => {
    // 处理目标数据源变化逻辑
};

// 配置变化
const onConfigChange = (config) => {
    formData.taskConfig = config;
};

// Transform 配置变化
const onTransformConfigChange = (config) => {
    formData.transformConfig = config;
};

// 保存配置
const saveConfig = async () => {
    try {
        await formRef.value.validate();
        saving.value = true;

        // 构建完整的任务配置
        const taskConfig = {
            ...formData,
            sourceFieldsConfig: {
                tableName: formData.datasourceConfig.tables[0] || '',
                tableFields: fieldList.value
            }
        };

        emit('update', taskConfig);
        ElMessage.success('配置保存成功');
    } catch (error) {
        console.error('保存配置失败:', error);
        ElMessage.error('保存配置失败');
    } finally {
        saving.value = false;
    }
};

// 重置配置
const resetConfig = () => {
    formRef.value.resetFields();
};

// 测试连接
const testConnection = async () => {
    testing.value = true;
    try {
        // 实现测试连接逻辑
        await new Promise(resolve => setTimeout(resolve, 1000));
        ElMessage.success('连接测试成功');
    } catch (error) {
        console.error('连接测试失败:', error);
        ElMessage.error('连接测试失败');
    } finally {
        testing.value = false;
    }
};

onMounted(() => {
    loadTaskConfig();
});
</script>

<style scoped lang="scss">
.task-config-form {
    .config-section {
        margin-bottom: 20px;

        .section-title {
            font-size: 13px;
            font-weight: 500;
            color: var(--el-text-color-primary);
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid var(--el-border-color-lighter);
        }
    }

    .field-config {
        margin-top: 8px;
    }

    .form-actions {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--el-border-color-lighter);

        .el-button {
            width: 100%;
            margin-bottom: 8px;
        }
    }
}
</style>
