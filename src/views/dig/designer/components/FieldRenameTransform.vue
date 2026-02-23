<template>
    <div class="output-model-section">
        <div class="replace-model-container">
            <div v-if="!inputFieldList.length" class="empty-tip">
                <div>{{ hasUpstreamConnection }}, upstreamOutputModel: {{ upstreamOutputModel }}</div>
                {{
                    hasUpstreamConnection ? '上游节点暂无输出模型，请先配置上游节点' : '暂无上游节点连接，请连接上游节点'
                }}
            </div>
            <div v-else>
                <div class="table-info" v-if="upstreamOutputTableNames.length > 0">
                    <div class="section-title">表名：{{ upstreamOutputTableNames.join(', ') }}</div>
                </div>
                <el-table :data="inputFieldList" size="small" max-height="600" class="field-table">
                    <el-table-column type="index" label="#" width="40" align="center" />
                    <el-table-column prop="columnName" label="字段名" min-width="100" show-overflow-tooltip>
                        <template #default="scope">
                            {{ getRowColumnName(scope.row) || '-' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="columnType" label="类型" width="90" show-overflow-tooltip />
                    <el-table-column label="重命名为" min-width="120" show-overflow-tooltip>
                        <template #default="scope">
                            <span>{{ getRenamedName(scope.row) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="90" align="center" fixed="right">
                        <template #default="scope">
                            <el-button size="small" @click="$emit('open-rename', scope.row)">重命名</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    hasUpstreamConnection: {
        type: [Boolean, String],
        default: false,
    },
    upstreamOutputModel: {
        type: Object,
        default: null,
    },
    inputFieldList: {
        type: Array,
        default: () => [],
    },
    upstreamOutputTableNames: {
        type: Array,
        default: () => [],
    },
    getRowColumnName: {
        type: Function,
        required: true,
    },
    getRenamedName: {
        type: Function,
        required: true,
    },
});

defineEmits(['open-rename']);
</script>
