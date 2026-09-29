<template>
    <el-form ref="formRef" :model="innerModel" label-width="110px">
        <el-row :gutter="16">
            <el-col v-for="field in schema" :key="field.field" :span="field.type === 'text_area' ? 24 : 12">
                <el-form-item :label="field.label" :prop="field.field" :rules="buildRules(field)">
                    <el-input
                        v-if="field.type === 'text'"
                        v-model="innerModel[field.field]"
                        :placeholder="field.placeholder || `请输入${field.label}`"
                    />
                    <el-input
                        v-else-if="field.type === 'password'"
                        v-model="innerModel[field.field]"
                        type="password"
                        show-password
                        :placeholder="field.placeholder || `请输入${field.label}`"
                    />
                    <el-input
                        v-else-if="field.type === 'text_area'"
                        v-model="innerModel[field.field]"
                        type="textarea"
                        :rows="4"
                        :placeholder="field.placeholder || `请输入${field.label}`"
                    />
                    <el-input-number
                        v-else-if="field.type === 'number'"
                        v-model="innerModel[field.field]"
                        :min="field.min ?? 0"
                        style="width: 100%"
                    />
                    <el-radio-group v-else-if="field.type === 'radio'" v-model="innerModel[field.field]">
                        <el-radio v-for="option in field.options || []" :key="`${field.field}-${option.value}`" :label="option.value">
                            {{ option.label }}
                        </el-radio>
                    </el-radio-group>
                    <el-input
                        v-else
                        v-model="innerModel[field.field]"
                        :placeholder="field.placeholder || `请输入${field.label}`"
                    />
                </el-form-item>
            </el-col>
        </el-row>
    </el-form>
</template>

<script setup>
const props = defineProps({
    schema: {
        type: Array,
        default: () => [],
    },
    modelValue: {
        type: Object,
        default: () => ({}),
    },
});

const emit = defineEmits(['update:modelValue']);

const formRef = ref();
const innerModel = reactive({});

function defaultValue(field) {
    if (field.defaultValue !== undefined && field.defaultValue !== null) {
        return field.defaultValue;
    }
    if (field.type === 'radio' && field.options?.length) {
        return field.options[0].value;
    }
    return field.type === 'number' ? null : '';
}

function syncSchema(schema) {
    Object.keys(innerModel).forEach((key) => {
        if (!schema.find((item) => item.field === key)) {
            delete innerModel[key];
        }
    });
    schema.forEach((field) => {
        if (!(field.field in innerModel)) {
            innerModel[field.field] = defaultValue(field);
        }
    });
}

function buildRules(field) {
    const rules = [];
    if (field.required) {
        rules.push({
            required: true,
            message: `${field.label}不能为空`,
            trigger: ['blur', 'change'],
        });
    }
    return rules;
}

watch(
    () => props.schema,
    (schema) => {
        syncSchema(schema || []);
    },
    { immediate: true, deep: true },
);

watch(
    () => props.modelValue,
    (value) => {
        syncSchema(props.schema || []);
        Object.assign(innerModel, value || {});
    },
    { immediate: true, deep: true },
);

watch(
    innerModel,
    () => {
        emit('update:modelValue', { ...innerModel });
    },
    { deep: true },
);

function validate() {
    return formRef.value?.validate();
}

function resetFields() {
    formRef.value?.resetFields();
}

defineExpose({
    validate,
    resetFields,
});
</script>
