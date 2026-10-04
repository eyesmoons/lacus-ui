<template>
    <div class="app-container">
        <el-row :gutter="20">
            <el-col :span="16">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span><i class="el-icon-cpu"></i> 新建训练任务</span>
                            <el-button class="button" text @click="$router.back()">
                                <i class="el-icon-back"></i> 返回
                            </el-button>
                        </div>
                    </template>
                    <p class="text-muted mb-4">配置训练参数，启动自编码器模型训练</p>

                    <el-form ref="trainFormRef" :model="form" :rules="rules" label-width="120px">
                        <!-- 任务基本信息 -->
                        <el-divider content-position="left">任务信息</el-divider>
                        <el-form-item label="任务名称" prop="taskName">
                            <el-input v-model="form.taskName" placeholder="例如：产品图片相似度训练" />
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
                        <el-form-item label="任务类型">
                            <el-select v-model="form.taskType" style="width: 100%">
                                <el-option label="图像相似度 (IMAGE_SIMILARITY)" value="IMAGE_SIMILARITY" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="训练器类型">
                            <el-input v-model="form.trainerType" readonly />
                            <div class="form-tip">当前仅支持相似度训练器</div>
                        </el-form-item>

                        <!-- 训练参数 -->
                        <el-divider content-position="left">训练参数</el-divider>
                        <el-form-item label="训练轮数 (Epochs)">
                            <div class="slider-row">
                                <el-slider v-model="form.epochs" :min="5" :max="200" show-input />
                            </div>
                            <div class="form-tip">推荐值：30，训练轮数越多效果可能越好但耗时更长</div>
                        </el-form-item>
                        <el-form-item label="学习率 (Learning Rate)">
                            <div class="slider-row">
                                <el-slider v-model="form.lrLog" :min="-4" :max="-2" :step="0.1" show-input />
                            </div>
                            <div class="form-tip">推荐值：{{ learningRateDisplay }}（10<sup>-3</sup>）</div>
                        </el-form-item>
                        <el-form-item label="批次大小 (Batch Size)">
                            <el-radio-group v-model="form.batchSize">
                                <el-radio-button :label="16">16</el-radio-button>
                                <el-radio-button :label="32">32</el-radio-button>
                                <el-radio-button :label="64">64</el-radio-button>
                            </el-radio-group>
                            <div class="form-tip">批次大小影响训练速度和显存占用，推荐值：32</div>
                        </el-form-item>
                        <el-form-item label="计算设备">
                            <el-select v-model="form.device" style="width: 100%">
                                <el-option label="CPU" value="cpu" />
                                <el-option label="CUDA (GPU)" value="cuda" />
                            </el-select>
                        </el-form-item>

                        <!-- 参数预览 -->
                        <el-descriptions title="参数预览" :column="2" border class="mt-3">
                            <el-descriptions-item label="轮数">{{ form.epochs }}</el-descriptions-item>
                            <el-descriptions-item label="学习率">{{ learningRateDisplay }}</el-descriptions-item>
                            <el-descriptions-item label="批次">{{ form.batchSize }}</el-descriptions-item>
                            <el-descriptions-item label="设备">{{ deviceDisplay }}</el-descriptions-item>
                        </el-descriptions>
                    </el-form>

                    <!-- 提交 -->
                    <div class="dialog-footer">
                        <el-button @click="$router.back()">取消</el-button>
                        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
                            <i class="el-icon-video-play"></i> 启动训练
                        </el-button>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { startTraining } from '@/api/lakeintelligence/train';
import { listDatasets } from '@/api/lakeintelligence/dataset';

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();

const trainFormRef = ref(null);
const submitLoading = ref(false);
const datasetOptions = ref([]);

const form = reactive({
    taskName: '',
    taskType: 'IMAGE_SIMILARITY',
    datasetId: null,
    trainerType: 'similarity',
    epochs: 30,
    lrLog: -3,
    batchSize: 32,
    device: 'cpu',
});

const rules = {
    taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
    datasetId: [{ required: true, message: '请选择训练数据集', trigger: 'change' }],
};

const learningRateDisplay = computed(() => {
    const val = Math.pow(10, form.lrLog);
    return parseFloat(val.toFixed(6));
});

const deviceDisplay = computed(() => {
    return form.device === 'cuda' ? 'CUDA (GPU)' : 'CPU';
});

function loadDatasets() {
    listDatasets({ page: 1, pageSize: 100 }).then((response) => {
        const list = response.rows || response.list || response || [];
        datasetOptions.value = list.filter((ds) => ds.status === 'READY');

        // 从 URL 参数预选数据集
        const preselectId = route.query.datasetId;
        if (preselectId) {
            const found = list.find((ds) => String(ds.datasetId) === String(preselectId));
            if (found) {
                form.datasetId = found.datasetId;
            }
        }
    }).catch(() => {
        ElMessage.error('加载数据集列表失败');
    });
}

async function handleSubmit() {
    try {
        await proxy.$refs.trainFormRef.validate();
    } catch (e) {
        return;
    }

    submitLoading.value = true;
    try {
        const payload = {
            taskName: form.taskName,
            taskType: form.taskType,
            datasetId: Number(form.datasetId),
            trainerType: form.trainerType,
            epochs: form.epochs,
            learningRate: Math.pow(10, form.lrLog),
            batchSize: form.batchSize,
            device: form.device,
            creatorId: 'current-user',
        };
        const result = await startTraining(payload);
        ElMessage.success('训练任务已启动！');
        setTimeout(() => {
            // 根据任务类型路由到对应的训练进度页
            const basePath = form.taskType === 'CLASSIFICATION' ? '/lake-intelligence/classification' : '/lake-intelligence/similarity';
            router.push(`${basePath}/training/${result.taskId || result}`);
        }, 1000);
    } catch (err) {
        ElMessage.error('启动失败：' + err.message);
    } finally {
        submitLoading.value = false;
    }
}

onMounted(() => {
    // 从 URL 路径推断任务类型
    const path = router.currentRoute.value.path || '';
    if (path.includes('/classification')) {
        form.taskType = 'CLASSIFICATION';
        form.trainerType = 'classifier';
    } else {
        form.taskType = 'IMAGE_SIMILARITY';
        form.trainerType = 'similarity';
    }
    loadDatasets();
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

.slider-row {
    width: 100%;
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
</style>
