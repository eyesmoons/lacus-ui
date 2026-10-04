<template>
    <div class="app-container">
        <el-row :gutter="20">
            <el-col :span="16">
                <el-card class="box-card" v-show="showConfig">
                    <template #header>
                        <div class="card-header">
                            <span><i class="el-icon-data-analysis"></i> 向量库构建</span>
                            <el-button class="button" text @click="$router.push('/lake-intelligence/training/new')">
                                <i class="el-icon-back"></i> 返回
                            </el-button>
                        </div>
                    </template>
                    <p class="text-muted mb-4">将图片库中的图像编码为向量索引，用于相似度检索</p>

                    <el-form ref="buildFormRef" :model="form" :rules="rules" label-width="120px">
                        <el-form-item label="向量库名称" prop="indexName">
                            <el-input v-model="form.indexName" placeholder="例如：product_vectors" />
                        </el-form-item>
                        <el-form-item label="选择图片库" prop="datasetId">
                            <el-select v-model="form.datasetId" placeholder="请选择数据集" style="width: 100%">
                                <el-option
                                    v-for="ds in datasetOptions"
                                    :key="ds.datasetId"
                                    :label="`${ds.datasetName} (${ds.imageCount || 0} 张)`"
                                    :value="ds.datasetId"
                                />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="选择模型" prop="modelId">
                            <el-select v-model="form.modelId" placeholder="请选择训练完成的模型" style="width: 100%">
                                <el-option
                                    v-for="m in modelOptions"
                                    :key="m.modelId"
                                    :label="`${m.modelName} (轮数: ${m.trainingEpochs || '-'})`"
                                    :value="m.modelId"
                                />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="集合名称">
                            <el-input v-model="form.collectionName" />
                        </el-form-item>
                        <el-form-item label="距离度量">
                            <el-select v-model="form.distanceMetric" style="width: 100%">
                                <el-option label="余弦相似度 (Cosine)" value="cosine" />
                                <el-option label="欧氏距离 (Euclidean)" value="euclidean" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="批次大小">
                            <el-input-number v-model="form.batchSize" :min="1" :max="256" />
                        </el-form-item>
                    </el-form>

                    <div class="dialog-footer">
                        <el-button type="primary" @click="startBuild" :loading="loading">
                            <i class="el-icon-cpu"></i> 开始构建
                        </el-button>
                    </div>
                </el-card>

                <!-- 构建进度 -->
                <el-card class="box-card" v-show="!showConfig">
                    <template #header>
                        <span><i class="el-icon-loading"></i> 构建进度</span>
                    </template>
                    <div class="progress-header">
                        <span>{{ buildStatusText }}</span>
                        <span class="text-muted">{{ indexedCount }} / {{ totalCount }}</span>
                    </div>
                    <el-progress
                        :percentage="progressPct"
                        :stroke-width="24"
                        :status="progressStatus"
                        striped
                        striped-flow
                    />
                    <div class="text-muted small mt-2">{{ buildMessage }}</div>

                    <el-alert
                        v-if="buildCompleted"
                        title="向量库构建完成"
                        type="success"
                        :description="`共索引 ${totalCount} 张图片`"
                        show-icon
                        :closable="false"
                        class="mt-3"
                    >
                        <template #default>
                            <el-button type="success" @click="$router.push('/lake-intelligence/search')">
                                <i class="el-icon-search"></i> 开始检索
                            </el-button>
                        </template>
                    </el-alert>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed, getCurrentInstance } from 'vue';
import { ElMessage } from 'element-plus';
import { buildVectors, getBuildProgress } from '@/api/lakeintelligence/search';
import { listDatasets } from '@/api/lakeintelligence/dataset';
import { listModels } from '@/api/lakeintelligence/model';

const router = useRouter();
const { proxy } = getCurrentInstance();

const buildFormRef = ref(null);
const loading = ref(false);
const showConfig = ref(true);
const buildTimer = ref(null);
const currentBuildId = ref(null);
const buildStatus = ref('PENDING');
const indexedCount = ref(0);
const totalCount = ref(0);
const buildMessage = ref('');
const datasetOptions = ref([]);
const modelOptions = ref([]);

const form = reactive({
    indexName: '',
    datasetId: null,
    modelId: null,
    collectionName: 'image_collection',
    distanceMetric: 'cosine',
    batchSize: 32,
});

const rules = {
    indexName: [{ required: true, message: '请输入向量库名称', trigger: 'blur' }],
    datasetId: [{ required: true, message: '请选择图片库', trigger: 'change' }],
    modelId: [{ required: true, message: '请选择模型', trigger: 'change' }],
};

const buildStatusText = computed(() => {
    if (buildStatus.value === 'building' || buildStatus.value === 'BUILDING') return '构建中...';
    if (buildStatus.value === 'completed' || buildStatus.value === 'COMPLETED') return '构建完成';
    if (buildStatus.value === 'failed' || buildStatus.value === 'FAILED') return '构建失败';
    return '处理中';
});

const progressPct = computed(() => {
    if (!totalCount.value) return 0;
    return Math.round((indexedCount.value / totalCount.value) * 100);
});

const progressStatus = computed(() => {
    if (buildStatus.value === 'completed' || buildStatus.value === 'COMPLETED') return 'success';
    if (buildStatus.value === 'failed' || buildStatus.value === 'FAILED') return 'exception';
    return '';
});

const buildCompleted = computed(() => {
    return buildStatus.value === 'completed' || buildStatus.value === 'COMPLETED';
});

function loadDatasets() {
    listDatasets({ page: 1, pageSize: 100 }).then((response) => {
        const list = response.rows || response.list || response || [];
        datasetOptions.value = list;
    }).catch(() => {
        ElMessage.error('加载数据集列表失败');
    });
}

function loadModels() {
    listModels({ page: 1, pageSize: 100 }).then((response) => {
        const list = response.rows || response.list || response || [];
        modelOptions.value = list;
    }).catch(() => {
        ElMessage.error('加载模型列表失败');
    });
}

async function startBuild() {
    try {
        await proxy.$refs.buildFormRef.validate();
    } catch (e) {
        return;
    }

    loading.value = true;
    try {
        const payload = {
            indexName: form.indexName,
            datasetId: Number(form.datasetId),
            modelId: Number(form.modelId),
            collectionName: form.collectionName,
            batchSize: form.batchSize,
            distanceMetric: form.distanceMetric,
            creatorId: 'current-user',
        };
        const result = await buildVectors(payload);
        currentBuildId.value = result.indexId || result.taskId || result;
        ElMessage.success('向量构建任务已启动！');
        showConfig.value = false;
        pollBuildProgress();
    } catch (err) {
        ElMessage.error('启动失败：' + err.message);
    } finally {
        loading.value = false;
    }
}

async function pollBuildProgress() {
    if (!currentBuildId.value) return;
    try {
        const data = await getBuildProgress(currentBuildId.value);
        buildStatus.value = data.status;
        indexedCount.value = data.progress || data.indexedCount || 0;
        totalCount.value = data.total || data.totalCount || 0;
        if (data.message) buildMessage.value = data.message;

        if (['building', 'BUILDING'].includes(data.status)) {
            buildTimer.value = setTimeout(pollBuildProgress, 2000);
        }
    } catch (err) {
        buildMessage.value = '获取进度失败：' + err.message;
        buildTimer.value = setTimeout(pollBuildProgress, 5000);
    }
}

onMounted(() => {
    loadDatasets();
    loadModels();
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

.text-muted {
    color: #909399;
}

.mb-4 {
    margin-bottom: 16px;
}

.mt-3 {
    margin-top: 12px;
}

.dialog-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.small {
    font-size: 12px;
}
</style>
