<template>
    <el-dialog
        v-model="dialogVisible"
        title="模型训练"
        width="500px"
        :close-on-click-modal="false"
        append-to-body
    >
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
            <el-form-item label="任务名称" prop="taskName">
                <el-input v-model="form.taskName" placeholder="请输入训练任务名称" />
            </el-form-item>
            <el-form-item label="训练轮数" prop="epochs">
                <el-slider v-model="form.epochs" :min="5" :max="200" show-input style="width: 100%" />
            </el-form-item>
            <el-form-item label="学习率" prop="learningRate">
                <el-slider v-model="form.lrLog" :min="-4" :max="-2" :step="0.1" show-input style="width: 100%" />
                <div class="form-tip">当前值：{{ learningRateDisplay }}</div>
            </el-form-item>
            <el-form-item label="批次大小" prop="batchSize">
                <el-radio-group v-model="form.batchSize">
                    <el-radio-button :label="16">16</el-radio-button>
                    <el-radio-button :label="32">32</el-radio-button>
                    <el-radio-button :label="64">64</el-radio-button>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="计算设备" prop="device">
                <el-select v-model="form.device" style="width: 100%">
                    <el-option label="CPU" value="cpu" />
                    <el-option label="CUDA (GPU)" value="cuda" />
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="submitting">开始训练</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { trainModel } from '@/api/lakeintelligence/model';

const props = defineProps({
    modelValue: Boolean,
    model: Object,
    taskType: {
        type: String,
        default: 'SIMILARITY',
    },
});

const emit = defineEmits(['update:modelValue', 'success']);

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
});

const formRef = ref(null);
const submitting = ref(false);

const form = reactive({
    taskName: '',
    epochs: 30,
    lrLog: -3,
    batchSize: 32,
    device: 'cpu',
});

const rules = {
    taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
};

const learningRateDisplay = computed(() => {
    const val = Math.pow(10, form.lrLog);
    return val >= 0.01 ? val.toFixed(4) : val.toExponential(2);
});

watch(dialogVisible, (val) => {
    if (val) {
        resetForm();
    }
});

function resetForm() {
    form.taskName = props.model?.modelName + '_训练' || '';
    form.epochs = 30;
    form.lrLog = -3;
    form.batchSize = 32;
    form.device = 'cpu';
}

async function handleSubmit() {
    await formRef.value.validate();
    submitting.value = true;
    try {
        await trainModel(props.model.modelId, {
            taskName: form.taskName,
            taskType: props.taskType,
            datasetId: props.model.datasetId,
            trainerType: props.taskType === 'CLASSIFICATION' ? 'classifier' : 'similarity',
            epochs: form.epochs,
            batchSize: form.batchSize,
            learningRate: Math.pow(10, form.lrLog),
            device: form.device,
        });
        ElMessage.success('训练任务已启动');
        dialogVisible.value = false;
        emit('success');
    } catch (err) {
        ElMessage.error('启动训练失败：' + (err.message || '未知错误'));
    } finally {
        submitting.value = false;
    }
}

defineExpose({ open: () => { dialogVisible.value = true; } });
</script>

<style scoped>
.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
</style>
