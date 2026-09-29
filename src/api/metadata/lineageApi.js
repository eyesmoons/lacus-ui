import request from '@/utils/request';

/**
 * 血缘图查询
 * @param {number} tableId 表ID
 * @param {string} direction upstream | downstream | full
 * @param {number} depth 展开深度上限,默认 5
 */
export function getLineageGraph(tableId, direction = 'full', depth = 5) {
    return request({
        url: '/metadata/lineage/graph',
        method: 'get',
        params: { tableId, direction, depth },
    });
}

/**
 * 登记血缘关系(sourceTableId 为上游,targetTableId 为下游)
 */
export function addLineageEdge(data) {
    return request({
        url: '/metadata/lineage/edge',
        method: 'post',
        data,
    });
}

// 删除血缘关系(仅 MANUAL 来源可删)
export function deleteLineageEdge(edgeId) {
    return request({
        url: `/metadata/lineage/edge/${edgeId}`,
        method: 'delete',
    });
}

// 编辑血缘关系(仅 MANUAL 来源可编辑;depType/remark 可改,按方向传 sourceTableId/targetTableId)
export function updateLineageEdge(edgeId, data) {
    return request({
        url: `/metadata/lineage/edge/${edgeId}`,
        method: 'put',
        data,
    });
}

// 查询单个血缘节点信息
export function getLineageNode(tableId) {
    return request({
        url: `/metadata/lineage/node/${tableId}`,
        method: 'get',
    });
}
