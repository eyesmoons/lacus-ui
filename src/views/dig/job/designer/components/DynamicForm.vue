<template>
    <div class="dynamic-form">
        <el-form :model="formData" ref="formRef" label-width="100px" size="small">
            <template v-for="field in formFields" :key="field.name">
                <!-- 文本输入框 -->
                <el-form-item 
                    v-if="field.type === 'string' || field.type === 'text'"
                    :label="field.label"
                    :prop="field.name"
                    :rules="getFieldRules(field)"
                >
                    <el-input
                        v-model="formData[field.name]"
                        :placeholder="field.placeholder || `请输入${field.label}`"
                        :disabled="field.disabled"
                        @change="handleFieldChange"
                    />
                </el-form-item>

                <!-- 数字输入框 -->
                <el-form-item 
                    v-else-if="field.type === 'number' || field.type === 'integer'"
                    :label="field.label"
                    :prop="field.name"
                    :rules="getFieldRules(field)"
                >
                    <el-input-number
                        v-model="formData[field.name]"
                        :min="field.min"
                        :max="field.max"
                        :step="field.step || 1"
                        :disabled="field.disabled"
                        @change="handleFieldChange"
                        style="width: 100%"
                    />
                </el-form-item>

                <!-- 布尔值选择 -->
                <el-form-item 
                    v-else-if="field.type === 'boolean'"
                    :label="field.label"
                    :prop="field.name"
                >
                    <el-switch
                        v-model="formData[field.name]"
                        :disabled="field.disabled"
                        @change="handleFieldChange"
                    />
                </el-form-item>

                <!-- 下拉选择 -->
                <el-form-item 
                    v-else-if="field.type === 'select' || field.type === 'enum'"
                    :label="field.label"
                    :prop="field.name"
                    :rules="getFieldRules(field)"
                >
                    <el-select
                        v-model="formData[field.name]"
                        :placeholder="field.placeholder || `请选择${field.label}`"
                        :disabled="field.disabled"
                        :multiple="field.multiple"
                        :filterable="field.filterable"
                        @change="handleFieldChange"
                        style="width: 100%"
                    >
                        <el-option
                            v-for="option in field.options"
                            :key="option.value"
                            :label="option.label"
                            :value="option.value"
                        />
                    </el-select>
                </el-form-item>

                <!-- 多行文本 -->
                <el-form-item 
                    v-else-if="field.type === 'textarea'"
                    :label="field.label"
                    :prop="field.name"
                    :rules="getFieldRules(field)"
                >
                    <el-input
                        v-model="formData[field.name]"
                        type="textarea"
                        :rows="field.rows || 3"
                        :placeholder="field.placeholder || `请输入${field.label}`"
                        :disabled="field.disabled"
                        @change="handleFieldChange"
                    />
                </el-form-item>

                <!-- JSON 编辑器 -->
                <el-form-item 
                    v-else-if="field.type === 'json'"
                    :label="field.label"
                    :prop="field.name"
                    :rules="getFieldRules(field)"
                >
                    <monaco-editor
                        v-model="formData[field.name]"
                        language="json"
                        :height="field.height || 200"
                        @change="handleFieldChange"
                    />
                </el-form-item>

                <!-- 密码输入框 -->
                <el-form-item 
                    v-else-if="field.type === 'password'"
                    :label="field.label"
                    :prop="field.name"
                    :rules="getFieldRules(field)"
                >
                    <el-input
                        v-model="formData[field.name]"
                        type="password"
                        :placeholder="field.placeholder || `请输入${field.label}`"
                        :disabled="field.disabled"
                        show-password
                        @change="handleFieldChange"
                    />
                </el-form-item>

                <!-- 默认文本输入 -->
                <el-form-item 
                    v-else
                    :label="field.label"
                    :prop="field.name"
                    :rules="getFieldRules(field)"
                >
                    <el-input
                        v-model="formData[field.name]"
                        :placeholder="field.placeholder || `请输入${field.label}`"
                        :disabled="field.disabled"
                        @change="handleFieldChange"
                    />
                </el-form-item>
            </template>
        </el-form>
    </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import MonacoEditor from '@/components/MonacoEditor/index.vue';

const props = defineProps({
    config: {
        type: [Array, Object],
        default: () => []
    },
    modelValue: {
        type: [Object, String],
        default: () => ({})
    }
});

const emit = defineEmits(['update:modelValue', 'change']);

const formRef = ref(null);
const formData = reactive({});

// 计算表单字段
const formFields = computed(() => {
    if (Array.isArray(props.config)) {
        return props.config;
    } else if (props.config && props.config.fields) {
        return props.config.fields;
    }
    return [];
});

// 监听配置变化
watch(() => props.config, (newConfig) => {
    initFormData();
}, { immediate: true, deep: true });

// 监听外部数据变化
watch(() => props.modelValue, (newValue) => {
    if (typeof newValue === 'string') {
        try {
            const parsed = JSON.parse(newValue);
            Object.assign(formData, parsed);
        } catch (e) {
            console.warn('Invalid JSON string:', newValue);
        }
    } else if (newValue && typeof newValue === 'object') {
        Object.assign(formData, newValue);
    }
}, { immediate: true, deep: true });

// 初始化表单数据
const initFormData = () => {
    formFields.value.forEach(field => {
        if (!(field.name in formData)) {
            formData[field.name] = getDefaultValue(field);
        }
    });
};

// 获取字段默认值
const getDefaultValue = (field) => {
    if (field.defaultValue !== undefined) {
        return field.defaultValue;
    }
    
    switch (field.type) {
        case 'number':
        case 'integer':
            return 0;
        case 'boolean':
            return false;
        case 'array':
            return [];
        case 'object':
        case 'json':
            return {};
        case 'select':
            return field.multiple ? [] : '';
        default:
            return '';
    }
};

// 获取字段验证规则
const getFieldRules = (field) => {
    const rules = [];
    
    if (field.required) {
        rules.push({
            required: true,
            message: `${field.label}不能为空`,
            trigger: ['blur', 'change']
        });
    }
    
    if (field.pattern) {
        rules.push({
            pattern: new RegExp(field.pattern),
            message: field.patternMessage || `${field.label}格式不正确`,
            trigger: 'blur'
        });
    }
    
    if (field.min !== undefined) {
        rules.push({
            min: field.min,
            message: `${field.label}长度不能小于${field.min}`,
            trigger: 'blur'
        });
    }
    
    if (field.max !== undefined) {
        rules.push({
            max: field.max,
            message: `${field.label}长度不能大于${field.max}`,
            trigger: 'blur'
        });
    }
    
    return rules;
};

// 字段值变化处理
const handleFieldChange = () => {
    const result = { ...formData };
    emit('update:modelValue', result);
    emit('change', result);
};

// 验证表单
const validate = () => {
    return formRef.value?.validate();
};

// 重置表单
const resetFields = () => {
    formRef.value?.resetFields();
};

// 暴露方法
defineExpose({
    validate,
    resetFields
});
</script>

<style scoped lang="scss">
.dynamic-form {
    .el-form-item {
        margin-bottom: 16px;
    }
}
</style>
