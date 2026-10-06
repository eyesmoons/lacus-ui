<template>
    <div class="app-container">
        <el-row :gutter="20">
            <el-col :span="24">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span><i class="el-icon-s-data"></i> 训练进度</span>
                            <div>
                                <el-button text @click="$router.push('/lake-intelligence/tasks')">
                                    <i class="el-icon-back"></i> 返回任务列表
                                </el-button>
                                <el-button
                                    type="danger"
                                    plain
                                    @click="handleCancel"
                                    v-if="!isFinished"
                                >
                                    <i class="el-icon-video-pause"></i> 取消训练
                                </el-button>
                            </div>
                        </div>
                    </template>

                    <!-- 状态卡片 -->
                    <el-row :gutter="20" class="status-row">
                        <el-col :span="6">
                            <el-card shadow="hover" class="status-card">
                                <div class="status-label">状态</div>
                                <div class="status-value">
                                    <el-tag :type="statusTagType" size="large">{{ statusText }}</el-tag>
                                </div>
                            </el-card>
                        </el-col>
                        <el-col :span="6">
                            <el-card shadow="hover" class="status-card">
                                <div class="status-label">当前轮次</div>
                                <div class="status-value text-primary">{{ currentEpoch }} / {{ totalEpochs }}</div>
                            </el-card>
                        </el-col>
                        <el-col :span="6">
                            <el-card shadow="hover" class="status-card">
                                <div class="status-label">训练损失</div>
                                <div class="status-value text-info">{{ trainLossDisplay }}</div>
                            </el-card>
                        </el-col>
                        <el-col :span="6">
                            <el-card shadow="hover" class="status-card">
                                <div class="status-label">验证损失</div>
                                <div class="status-value text-warning">{{ valLossDisplay }}</div>
                            </el-card>
                        </el-col>
                    </el-row>

                    <!-- 进度条 -->
                    <el-card shadow="never" class="mt-3">
                        <div class="progress-header">
                            <span>训练进度</span>
                            <span class="text-muted">{{ progressPct }}%</span>
                        </div>
                        <el-progress
                            :percentage="progressPct"
                            :stroke-width="24"
                            :status="progressStatus"
                            striped
                            striped-flow
                        />
                        <div class="text-muted small mt-2">{{ progressMessage }}</div>
                    </el-card>

                    <!-- 训练结果 -->
                    <el-card v-if="isCompleted" shadow="never" class="mt-3">
                        <template #header>
                            <span><i class="el-icon-trophy"></i> 训练结果</span>
                        </template>
                        <el-descriptions :column="2" border>
                            <el-descriptions-item label="模型ID">{{ modelId || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="模型名称">{{ modelName || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="最终损失">{{ finalLossDisplay }}</el-descriptions-item>
                            <el-descriptions-item label="训练轮数">{{ trainingEpochs || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="模型大小">{{ modelSizeDisplay }}</el-descriptions-item>
                            <el-descriptions-item label="模型路径">{{ modelPath || '-' }}</el-descriptions-item>
                        </el-descriptions>
                    </el-card>

                    <!-- 训练完成操作 -->
                    <el-alert
                        v-if="isCompleted"
                        title="训练完成"
                        type="success"
                        description="模型已保存，可以开始构建向量库"
                        show-icon
                        :closable="false"
                        class="mt-3"
                    >
                        <template #default>
                            <el-button type="success" @click="$router.push('/lake-intelligence/similarity/vector/build')">
                                <i class="el-icon-data-analysis"></i> 构建向量库
                            </el-button>
                            <el-button type="primary" @click="$router.push('/lake-intelligence/model/list')">
                                <i class="el-icon-back"></i> 返回模型列表
                            </el-button>
                        </template>
                    </el-alert>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getProgress, cancelTraining } from '@/api/lakeintelligence/train';

const route = useRoute();
const router = useRouter();

const taskId = ref(null);
const pollTimer = ref(null);
const taskStatus = ref('PENDING');
const currentEpoch = ref(0);
const totalEpochs = ref(0);
const trainLoss = ref(null);
const valLoss = ref(null);
const progressMessage = ref('');
const modelId = ref(null);
const modelName = ref(null);
const modelPath = ref(null);
const finalLoss = ref(null);
const trainingEpochs = ref(null);
const modelSizeBytes = ref(null);

const statusMap = {
    training: { text: '训练中', type: 'primary' },
    PENDING: { text: '等待中', type: 'info' },
    completed: { text: '已完成', type: 'success' },
    COMPLETED: { text: '已完成', type: 'success' },
    failed: { text: '失败', type: 'danger' },
    FAILED: { text: '失败', type: 'danger' },
    cancelled: { text: '已取消', type: 'warning' },
    CANCELLED: { text: '已取消', type: 'warning' },
};

const statusText = computed(() => statusMap[taskStatus.value]?.text || taskStatus.value);
const statusTagType = computed(() => statusMap[taskStatus.value]?.type || 'info');
const trainLossDisplay = computed(() => (trainLoss.value != null ? trainLoss.value.toFixed(4) : '-'));
const valLossDisplay = computed(() => (valLoss.value != null ? valLoss.value.toFixed(4) : '-'));
const finalLossDisplay = computed(() => (finalLoss.value != null ? Number(finalLoss.value).toFixed(4) : '-'));
const modelSizeDisplay = computed(() => {
    if (!modelSizeBytes.value) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = modelSizeBytes.value;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return size.toFixed(size < 10 && i > 0 ? 1 : 0) + ' ' + units[i];
});

const progressPct = computed(() => {
    if (!totalEpochs.value) return 0;
    return Math.round((currentEpoch.value / totalEpochs.value) * 100);
});

const progressStatus = computed(() => {
    if (taskStatus.value === 'completed' || taskStatus.value === 'COMPLETED') return 'success';
    if (taskStatus.value === 'failed' || taskStatus.value === 'FAILED') return 'exception';
    return '';
});

const isFinished = computed(() => {
    const s = taskStatus.value;
    return ['completed', 'COMPLETED', 'failed', 'FAILED', 'cancelled', 'CANCELLED'].includes(s);
});

const isCompleted = computed(() => {
    return taskStatus.value === 'completed' || taskStatus.value === 'COMPLETED';
});

async function pollProgress() {
    if (!taskId.value) return;
    try {
        const data = await getProgress(taskId.value);
        taskStatus.value = data.status;
        currentEpoch.value = data.progress || data.currentEpoch || 0;
        totalEpochs.value = data.total || data.totalEpochs || 0;
        if (data.trainLoss != null) trainLoss.value = data.trainLoss;
        if (data.valLoss != null) valLoss.value = data.valLoss;
        if (data.message) progressMessage.value = data.message;

        if (data.modelId) {
            modelId.value = data.modelId;
            modelName.value = data.modelName;
            modelPath.value = data.modelPath;
            finalLoss.value = data.finalLoss;
            trainingEpochs.value = data.trainingEpochs;
            modelSizeBytes.value = data.modelSizeBytes;
        }

        if (['training', 'PENDING'].includes(data.status)) {
            pollTimer.value = setTimeout(pollProgress, 2000);
        }
    } catch (err) {
        progressMessage.value = '获取进度失败：' + err.message;
        pollTimer.value = setTimeout(pollProgress, 5000);
    }
}

function handleCancel() {
    if (!taskId.value) return;
    ElMessageBox.confirm('确认取消当前训练任务？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => cancelTraining(taskId.value))
        .then(() => {
            ElMessage.success('训练任务已取消');
            if (pollTimer.value) clearTimeout(pollTimer.value);
        })
        .catch(() => {});
}

onMounted(() => {
    taskId.value = route.params.id;
    if (taskId.value) {
        pollProgress();
    }
});

onUnmounted(() => {
    if (pollTimer.value) clearTimeout(pollTimer.value);
});
</script>

<style scoped>
.app-container {
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mb-4 {
    margin-bottom: 16px;
}

.mt-3 {
    margin-top: 12px;
}

.status-row {
    margin-bottom: 16px;
}

.status-card {
    text-align: center;
}

.status-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
}

.status-value {
    font-size: 20px;
    font-weight: bold;
}

.text-primary {
    color: #409EFF;
}

.text-info {
    color: #909399;
}

.text-warning {
    color: #E6A23C;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.small {
    font-size: 12px;
}

.text-muted {
    color: #909399;
}
</style>
