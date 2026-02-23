<template>
    <div class="output-model-section">
        <div class="replace-model-container">
            <div v-if="!inputFieldList.length" class="empty-tip">
                <div
                    v-if="
                        hasUpstreamConnection &&
                        upstreamOutputModel &&
                        Array.isArray(upstreamOutputModel.fields) &&
                        upstreamOutputModel.fields.length > 0
                    "
                >
                    检测到上游字段，可点击“拆分”开始配置
                </div>
                <div v-else-if="hasUpstreamConnection">上游节点暂无输出模型，请先配置上游节点</div>
                <div v-else>暂无上游节点连接，请连接上游节点</div>
            </div>
            <div v-else>
                <div style="display: flex; gap: 16px; align-items: stretch; margin-top: 12px">
                    <div style="flex: 1">
                        <div class="section-title">输入模型</div>
                        <el-table :data="inputFieldList" size="small" max-height="480" class="field-table">
                            <el-table-column type="index" label="#" width="40" align="center" />
                            <el-table-column prop="columnName" label="字段名" min-width="100" show-overflow-tooltip>
                                <template #default="scope">
                                    {{ getRowColumnName(scope.row) || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="columnType" label="类型" width="90" show-overflow-tooltip />
                            <el-table-column label="拆分为" min-width="180" show-overflow-tooltip>
                                <template #default="scope">
                                    <span
                                        v-if="
                                            getRowColumnName(scope.row) === splitSourceField &&
                                            Array.isArray(splitTargetFields) &&
                                            splitTargetFields.length >= 2
                                        "
                                    >
                                        <code>{{ '{ ' + splitSourceField + ' }' }}</code>
                                        ⇒
                                        <code>{{ '{ ' + splitTargetFields.join(', ') + ' }' }}</code>
                                    </span>
                                    <span v-else>-</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="120" align="center" fixed="right">
                                <template #default="scope">
                                    <el-button size="small" @click="$emit('open-split', scope.row)">拆分</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                    <div style="flex: 1">
                        <div class="section-title">输出模型</div>
                        <el-table
                            :data="getSplitPreviewOutputFields().map((n) => ({ name: n }))"
                            size="small"
                            max-height="480"
                            class="field-table"
                        >
                            <el-table-column type="index" label="#" width="40" align="center" />
                            <el-table-column prop="name" label="字段名" min-width="100" show-overflow-tooltip />
                        </el-table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <el-dialog
        :model-value="splitDialogVisible"
        @update:model-value="$emit('update:splitDialogVisible', $event)"
        title="配置拆分"
        width="520px"
    >
        <div>
            <div style="margin-bottom: 8px">
                源字段：<code>{{ splitSourceField }}</code>
            </div>
            <div>
                <div style="margin-bottom: 6px">目标字段列表（至少两个）：</div>
                <div v-for="(t, idx) in splitTargetFields" :key="idx" style="display: flex; gap: 8px; margin-bottom: 6px">
                    <el-input
                        :model-value="splitTargetFields[idx]"
                        @update:model-value="
                            $emit(
                                'update:splitTargetFields',
                                splitTargetFields.map((x, i) => (i === idx ? $event : x))
                            )
                        "
                        placeholder="目标字段名"
                    />
                    <el-button
                        @click="
                            $emit(
                                'update:splitTargetFields',
                                splitTargetFields.filter((_, i) => i !== idx)
                            )
                        "
                        size="small"
                        >移除</el-button
                    >
                </div>
                <el-button @click="$emit('update:splitTargetFields', [...(splitTargetFields || []), ''])" size="small"
                    >添加目标字段</el-button
                >
            </div>
        </div>
        <template #footer>
            <el-button @click="$emit('update:splitDialogVisible', false)">取消</el-button>
            <el-button type="primary" @click="$emit('confirm-split')">应用</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
defineProps({
    inputFieldList: {
        type: Array,
        default: () => [],
    },
    hasUpstreamConnection: {
        type: [Boolean, String],
        default: false,
    },
    upstreamOutputModel: {
        type: Object,
        default: null,
    },
    splitDialogVisible: {
        type: Boolean,
        default: false,
    },
    splitSourceField: {
        type: String,
        default: '',
    },
    splitTargetFields: {
        type: Array,
        default: () => [],
    },
    getRowColumnName: {
        type: Function,
        required: true,
    },
    getSplitPreviewOutputFields: {
        type: Function,
        required: true,
    },
});

defineEmits([
    'open-split',
    'confirm-split',
    'update:splitDialogVisible',
    'update:splitTargetFields',
]);
</script>
