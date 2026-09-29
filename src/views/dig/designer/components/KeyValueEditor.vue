<template>
    <div class="key-value-editor">
        <div class="editor-header">
            <span class="header-title">键值对配置</span>
            <el-button type="primary" size="small" icon="Plus" @click="addItem">
                添加
            </el-button>
        </div>
        
        <div class="editor-content">
            <div 
                v-for="(item, index) in items" 
                :key="index"
                class="kv-item"
            >
                <div class="kv-inputs">
                    <el-input
                        v-model="item.key"
                        placeholder="键"
                        size="small"
                        @change="handleChange"
                        class="key-input"
                    />
                    <span class="separator">:</span>
                    <el-input
                        v-model="item.value"
                        placeholder="值"
                        size="small"
                        @change="handleChange"
                        class="value-input"
                    />
                </div>
                <div class="kv-actions">
                    <el-button
                        type="danger"
                        size="small"
                        icon="Delete"
                        @click="removeItem(index)"
                        circle
                    />
                </div>
            </div>
            
            <div v-if="items.length === 0" class="empty-state">
                <el-empty description="暂无配置项" :image-size="60" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Plus, Delete } from '@element-plus/icons-vue';

const props = defineProps({
    modelValue: {
        type: [Object, String],
        default: () => ({})
    }
});

const emit = defineEmits(['update:modelValue', 'change']);

const items = ref([]);

// 监听外部数据变化
watch(() => props.modelValue, (newValue) => {
    if (typeof newValue === 'string') {
        try {
            const parsed = JSON.parse(newValue);
            convertObjectToItems(parsed);
        } catch (e) {
            items.value = [];
        }
    } else if (newValue && typeof newValue === 'object') {
        convertObjectToItems(newValue);
    } else {
        items.value = [];
    }
}, { immediate: true, deep: true });

// 将对象转换为键值对数组
const convertObjectToItems = (obj) => {
    items.value = Object.entries(obj).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));
};

// 将键值对数组转换为对象
const convertItemsToObject = () => {
    const result = {};
    items.value.forEach(item => {
        if (item.key && item.key.trim()) {
            let value = item.value;
            // 尝试解析 JSON
            try {
                value = JSON.parse(item.value);
            } catch (e) {
                // 如果不是有效的 JSON，保持原始字符串
            }
            result[item.key.trim()] = value;
        }
    });
    return result;
};

// 添加项
const addItem = () => {
    items.value.push({
        key: '',
        value: ''
    });
};

// 移除项
const removeItem = (index) => {
    items.value.splice(index, 1);
    handleChange();
};

// 处理变化
const handleChange = () => {
    const result = convertItemsToObject();
    emit('update:modelValue', result);
    emit('change', result);
};
</script>

<style scoped lang="scss">
.key-value-editor {
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
        
        .kv-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            
            .kv-inputs {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 8px;
                
                .key-input {
                    flex: 1;
                }
                
                .separator {
                    color: var(--el-text-color-secondary);
                    font-weight: 500;
                }
                
                .value-input {
                    flex: 2;
                }
            }
            
            .kv-actions {
                margin-left: 12px;
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
