<template>
    <el-dialog
        v-model="dialogVisible"
        :title="editing ? '编辑模型' : '添加模型'"
        width="500px"
        :close-on-click-modal="false"
        append-to-body
    >
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="模型名称" prop="modelName">
                <el-input v-model="form.modelName" placeholder="请输入模型名称" />
            </el-form-item>
            <el-form-item label="模型描述" prop="description">
                <el-input v-model="form.description" type="textarea" placeholder="请输入模型描述" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { createModel, updateModel } from '@/api/lakeintelligence/model';

const props = defineProps({
    modelValue: Boolean,
    model: Object,  // 编辑时的模型数据
});

const emit = defineEmits(['update:modelValue', 'success']);

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
});

const formRef = ref(null);
const submitting = ref(false);
const editing = computed(() => !!props.model?.modelId);

const form = reactive({
    modelName: '',
    description: '',
});

const rules = {
    modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
};

function resetForm() {
    form.modelName = props.model?.modelName || '';
    form.description = props.model?.description || '';
}

function open() {
    resetForm();
    dialogVisible.value = true;
}

watch(
    () => props.model,
    () => {
        if (dialogVisible.value) {
            resetForm();
        }
    }
);

async function handleSubmit() {
    await formRef.value.validate();
    submitting.value = true;
    try {
        if (editing.value) {
            await updateModel({ ...props.model, ...form });
        } else {
            await createModel(form);
        }
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        emit('success');
    } catch (err) {
        ElMessage.error('保存失败：' + (err.message || '未知错误'));
    } finally {
        submitting.value = false;
    }
}

defineExpose({ open });
</script>
