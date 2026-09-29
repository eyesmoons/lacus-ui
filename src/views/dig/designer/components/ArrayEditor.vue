<template>
    <div class="array-editor">
        <div class="editor-header">
            <span class="header-title">数组配置</span>
            <el-button type="primary" size="small" icon="Plus" @click="addItem">
                添加项
            </el-button>
        </div>
        
        <div class="editor-content">
            <div 
                v-for="(item, index) in items" 
                :key="index"
                class="array-item"
            >
                <div class="item-index">{{ index + 1 }}</div>
                <div class="item-content">
                    <!-- 字符串类型 -->
                    <el-input
                        v-if="itemType === 'string' || !itemType"
                        v-model="items[index]"
                        placeholder="请输入值"
                        size="small"
                        @change="handleChange"
                    />
                    
                    <!-- 数字类型 -->
                    <el-input-number
                        v-else-if="itemType === 'number'"
                        v-model="items[index]"
                        size="small"
                        @change="handleChange"
                        style="width: 100%"
                    />
                    
                    <!-- 布尔类型 -->
                    <el-switch
                        v-else-if="itemType === 'boolean'"
                        v-model="items[index]"
                        @change="handleChange"
                    />
                    
                    <!-- 对象类型 -->
                    <el-input
                        v-else-if="itemType === 'object'"
                        v-model="items[index]"
                        type="textarea"
                        :rows="2"
                        placeholder="请输入JSON格式的对象"
                        size="small"
                        @change="handleObjectChange(index)"
                    />
                    
                    <!-- 选择类型 -->
                    <el-select
                        v-else-if="itemType === 'select'"
                        v-model="items[index]"
                        placeholder="请选择"
                        size="small"
                        @change="handleChange"
                        style="width: 100%"
                    >
                        <el-option
                            v-for="option in selectOptions"
                            :key="option.value"
                            :label="option.label"
                            :value="option.value"
                        />
                    </el-select>
                    
                    <!-- 默认字符串 -->
                    <el-input
                        v-else
                        v-model="items[index]"
                        placeholder="请输入值"
                        size="small"
                        @change="handleChange"
                    />
                </div>
                <div class="item-actions">
                    <el-button
                        type="text"
                        size="small"
                        icon="Top"
                        @click="moveUp(index)"
                        :disabled="index === 0"
                        title="上移"
                    />
                    <el-button
                        type="text"
                        size="small"
                        icon="Bottom"
                        @click="moveDown(index)"
                        :disabled="index === items.length - 1"
                        title="下移"
                    />
                    <el-button
                        type="danger"
                        size="small"
                        icon="Delete"
                        @click="removeItem(index)"
                        title="删除"
                    />
                </div>
            </div>
            
            <div v-if="items.length === 0" class="empty-state">
                <el-empty description="暂无数据项" :image-size="60" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Plus, Delete, Top, Bottom } from '@element-plus/icons-vue';

const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    },
    itemType: {
        type: String,
        default: 'string',
        validator: (value) => ['string', 'number', 'boolean', 'object', 'select'].includes(value)
    },
    selectOptions: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:modelValue', 'change']);

const items = ref([]);

// 监听外部数据变化
watch(() => props.modelValue, (newValue) => {
    if (Array.isArray(newValue)) {
        items.value = [...newValue];
    } else {
        items.value = [];
    }
}, { immediate: true, deep: true });

// 获取默认值
const getDefaultValue = () => {
    switch (props.itemType) {
        case 'number':
            return 0;
        case 'boolean':
            return false;
        case 'object':
            return '{}';
        case 'select':
            return props.selectOptions[0]?.value || '';
        default:
            return '';
    }
};

// 添加项
const addItem = () => {
    items.value.push(getDefaultValue());
    handleChange();
};

// 移除项
const removeItem = (index) => {
    items.value.splice(index, 1);
    handleChange();
};

// 上移
const moveUp = (index) => {
    if (index > 0) {
        const temp = items.value[index];
        items.value[index] = items.value[index - 1];
        items.value[index - 1] = temp;
        handleChange();
    }
};

// 下移
const moveDown = (index) => {
    if (index < items.value.length - 1) {
        const temp = items.value[index];
        items.value[index] = items.value[index + 1];
        items.value[index + 1] = temp;
        handleChange();
    }
};

// 处理对象类型变化
const handleObjectChange = (index) => {
    try {
        const parsed = JSON.parse(items.value[index]);
        items.value[index] = parsed;
    } catch (e) {
        // 保持原始字符串，等待用户修正
    }
    handleChange();
};

// 处理变化
const handleChange = () => {
    const result = [...items.value];
    emit('update:modelValue', result);
    emit('change', result);
};
</script>

<style scoped lang="scss">
.array-editor {
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    
    .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--el-fill-color-light);
        border-bottom: 1px solid var(--el-border-color);
        border-radius: 6px 6px 0 0;
        
        .header-title {
            font-size: 13px;
            font-weight: 500;
            color: var(--el-text-color-primary);
        }
    }
    
    .editor-content {
        padding: 12px;
        min-height: 100px;
        
        .array-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 8px;
            padding: 8px;
            background: var(--el-fill-color-lighter);
            border-radius: 4px;
            
            .item-index {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--el-color-primary);
                color: white;
                border-radius: 50%;
                font-size: 12px;
                font-weight: 500;
                margin-right: 12px;
                flex-shrink: 0;
            }
            
            .item-content {
                flex: 1;
                margin-right: 12px;
            }
            
            .item-actions {
                display: flex;
                flex-direction: column;
                gap: 4px;
                
                .el-button {
                    padding: 4px;
                    width: 24px;
                    height: 24px;
                }
            }
        }
        
        .empty-state {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 80px;
        }
    }
}
</style>
