import request from '@/utils/request';

export function getDatasourceList(datasourceName, sourceType) {
    return request({
        url: `/metadata/datasource/list`,
        method: 'get',
        params: {
            "datasourceName": datasourceName,
            "sourceType": sourceType
        },
    });
}

export function changeStatus(datasourceId, status) {
    const data = {
        datasourceId,
        status,
    };
    return request({
        url: `/metadata/datasource/${datasourceId}/status`,
        method: 'put',
        data,
    });
}


export function testDatasource(datasourceId) {
    return request({
        url: `/metadata/datasource/test/${datasourceId}`,
        method: 'get',
    });
}

// 查询数据源列表
export function listDatasource(query) {
    return request({
        url: '/metadata/datasource/pageList',
        method: 'get',
        params: query,
    });
}

// 查询参数详细
export function getDatasource(datasourceId) {
    return request({
        url: `/metadata/datasource/${datasourceId}`,
        method: 'get',
    });
}

export function updateDatasource(data) {
    return request({
        url: '/metadata/datasource',
        method: 'put',
        data,
    });
}

export function addDatasource(data) {
    return request({
        url: '/metadata/datasource',
        method: 'post',
        data,
    });
}

export function deleteDatasource(datasourceIds) {
    return request({
        url: `/metadata/datasource/${datasourceIds}`,
        method: 'delete'
    });
}