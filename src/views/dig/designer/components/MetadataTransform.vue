<template>
    <div class="output-model-section">
        <div class="metadata-model-container">
            <div v-if="!inputFieldList.length" class="empty-tip">
                {{
                    hasUpstreamConnection ? '上游节点暂无输出模型，请先配置上游节点' : '暂无上游节点连接，请连接上游节点'
                }}
            </div>
            <div v-else>
                <div class="table-info" v-if="upstreamOutputTableNames.length > 0">
                    <div class="section-title">表名：{{ upstreamOutputTableNames.join(', ') }}</div>
                </div>
                <div style="display: flex; gap: 16px; align-items: stretch">
                    <div class="panel left-panel">
                        <div class="section-title">左侧：上游字段 + 元数据</div>
                        <el-table :data="leftCombinedList" size="small" max-height="600" class="field-table">
                            <el-table-column type="index" label="#" width="40" align="center" />
                            <el-table-column prop="columnName" label="字段名" min-width="100" show-overflow-tooltip>
                                <template #default="scope">
                                    {{ getRowColumnName(scope.row) || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="columnType" label="类型" width="90" show-overflow-tooltip />
                            <el-table-column label="操作" width="70" align="center" fixed="right">
                                <template #default="scope">
                                    <el-button v-if="isMetadataRow(scope.row)" size="small" @click="$emit('add-metadata-field', scope.row)">
                                        添加
                                    </el-button>
                                    <span v-else style="color: #c0c4cc">-</span>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                    <div class="panel center-panel">
                        <div class="connection-lines">
                            <div
                                v-for="(row, index) in leftCombinedList"
                                :key="index"
                                class="connection-item"
                                :class="isRowConnected(row) ? 'connected' : 'missing'"
                                :title="getRowColumnName(row)"
                            >
                                <span class="connector-dot left-dot" />
                                <span class="connector-line" />
                                <span class="connector-dot right-dot" />
                            </div>
                            <div v-if="!leftCombinedList.length" class="no-connections">暂无连接</div>
                        </div>
                    </div>
                    <div class="panel right-panel">
                        <div class="section-title">右侧：输出字段（默认等于上游）</div>
                        <el-table :data="rightAlignedList" size="small" max-height="600" class="field-table">
                            <el-table-column type="index" label="#" width="40" align="center" />
                            <el-table-column prop="columnName" label="字段名" min-width="100" show-overflow-tooltip>
                                <template #default="scope">
                                    {{ getRowColumnName(scope.row) || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="columnType" label="类型" width="90" show-overflow-tooltip />
                            <el-table-column label="操作" width="70" align="center" fixed="right">
                                <template #default="scope">
                                    <el-button
                                        v-if="isMetadataIndex(scope.$index) && getRowColumnName(leftCombinedList[scope.$index])"
                                        size="small"
                                        type="danger"
                                        @click="
                                            $emit(
                                                'remove-output-field',
                                                getRowColumnName(leftCombinedList[scope.$index])
                                            )
                                        "
                                    >
                                        移除
                                    </el-button>
                                    <span v-else style="color: #c0c4cc">-</span>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </div>
            </div>
        </div>
    </div>
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
    upstreamOutputTableNames: {
        type: Array,
        default: () => [],
    },
    leftCombinedList: {
        type: Array,
        default: () => [],
    },
    rightAlignedList: {
        type: Array,
        default: () => [],
    },
    getRowColumnName: {
        type: Function,
        required: true,
    },
    isMetadataRow: {
        type: Function,
        required: true,
    },
    isMetadataIndex: {
        type: Function,
        required: true,
    },
    isRowConnected: {
        type: Function,
        required: true,
    },
});

defineEmits(['add-metadata-field', 'remove-output-field']);
</script>
