<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
            <el-form-item label="模型名称" prop="modelName">
                <el-input v-model="queryParams.modelName" placeholder="搜索模型名称..." clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="架构" prop="modelArch">
                <el-select v-model="queryParams.modelArch" placeholder="请选择架构" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="ResNet18" value="ResNet18" />
                    <el-option label="ResNet50" value="ResNet50" />
                    <el-option label="MobileNetV2" value="MobileNetV2" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd">添加模型</el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
        </el-row>

        <el-table v-loading="loading" :data="modelList" stripe border>
            <el-table-column label="ID" align="center" prop="modelId" width="80" />
            <el-table-column label="模型名称" align="left" prop="modelName" />
            <el-table-column label="架构" align="left" prop="modelArch">
                <template #default="scope">
                    <code>{{ scope.row.modelArch || '-' }}</code>
                </template>
            </el-table-column>
            <el-table-column label="类别数" align="center" prop="numClasses" width="90" />
            <el-table-column label="训练轮数" align="center" prop="trainingEpochs" width="100" />
            <el-table-column label="验证准确率" align="center" prop="valAccuracy" width="120">
                <template #default="scope">
                    {{ scope.row.valAccuracy != null ? (scope.row.valAccuracy * 100).toFixed(1) + '%' : '-' }}
                </template>
            </el-table-column>
            <el-table-column label="模型状态" align="center" prop="status" width="120">
                <template #default="scope">
                    <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="文件大小" align="center" prop="modelSizeBytes" width="100">
                <template #default="scope">
                    {{ formatFileSize(scope.row.modelSizeBytes) }}
                </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" width="160">
                <template #default="scope">
                    {{ parseTime(scope.row.createTime) }}
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" fixed="right" width="200">
                <template #default="scope">
                    <el-button-group class="ml-4">
                        <el-tooltip content="训练" placement="top">
                            <el-button type="primary" icon="VideoPlay" @click="handleTrain(scope.row)" />
                        </el-tooltip>
                        <el-tooltip content="下载" placement="top">
                            <el-button type="success" icon="Download" @click="handleDownload(scope.row)" />
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button type="danger" icon="Delete" @click="handleDelete(scope.row)" />
                        </el-tooltip>
                    </el-button-group>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
        />
        <!-- 模型配置弹窗 -->
        <ModelConfigDialog
            v-model="configDialogVisible"
            task-type="CLASSIFICATION"
            @success="handleTrainingSuccess"
        />
        <!-- 训练配置弹窗 -->
        <TrainingConfigDialog ref="trainDialogRef" v-model="trainDialogVisible" task-type="CLASSIFICATION" @success="getList" />
    </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { parseTime } from '@/utils/dateUtil';
import { ElMessage, ElMessageBox } from 'element-plus';
import { deleteModel, downloadModel, listModels } from '@/api/lakeintelligence/model';
import ModelConfigDialog from '../components/ModelConfigDialog.vue';
import TrainingConfigDialog from '../components/TrainingConfigDialog.vue';

const router = useRouter();

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const modelList = ref([]);
const configDialogVisible = ref(false);
const trainDialogRef = ref(null);
const trainDialogVisible = ref(false);

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    modelName: undefined,
    modelArch: undefined,
    taskType: 'CLASSIFICATION',
});

function getList() {
    loading.value = true;
    listModels(queryParams).then((response) => {
        modelList.value = response.rows || response.list || [];
        total.value = response.total || modelList.value.length;
        loading.value = false;
    }).catch(() => {
        loading.value = false;
    });
}

function handleQuery() {
    queryParams.pageNum = 1;
    getList();
}

function resetQuery() {
    queryParams.modelName = undefined;
    queryParams.modelArch = undefined;
    handleQuery();
}

function handleAdd() {
    configDialogVisible.value = true;
}

function handleTrain(row) {
    trainDialogRef.value?.open();
    // 设置当前选中的模型
    trainDialogRef.value.modelId = row.modelId;
    trainDialogRef.value.modelName = row.modelName;
}

function handleTrainingSuccess(taskId) {
    configDialogVisible.value = false;
    ElMessage.success('训练任务已启动');
    router.push(`/lake-intelligence/classification/training/${taskId}`);
}

function getStatusType(status) {
    switch (status) {
        case 'TRAINING_COMPLETED': return 'success';
        case 'TRAINING_FAILED': return 'danger';
        case 'TRAINING':
        default: return 'warning';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'TRAINING_COMPLETED': return '训练完成';
        case 'TRAINING_FAILED': return '训练失败';
        case 'TRAINING':
        default: return '训练中';
    }
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return bytes.toFixed(bytes < 10 && i > 0 ? 1 : 0) + ' ' + units[i];
}

function handleDownload(row) {
    downloadModel(row.modelId).then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${row.modelName || 'model'}.pt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        ElMessage.success('下载成功');
    }).catch(() => {
        ElMessage.error('下载失败');
    });
}

function handleDelete(row) {
    ElMessageBox.confirm('确认删除此模型？此操作不可恢复。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => deleteModel(row.modelId))
        .then(() => {
            getList();
            ElMessage.success('模型已删除');
        })
        .catch(() => {});
}

watch(
    () => queryParams.pageSize,
    () => {
        queryParams.pageNum = 1;
        getList();
    }
);

onMounted(() => {
    getList();
});
</script>

<style scoped>
.app-container {
    padding: 20px;
}

.mb8 {
    margin-bottom: 8px;
}
</style>
