import request from '@/utils/request';

export function getSchemaDbList(datasourceId) {
    return request({
        url: `/metadata/schema/listSchemaDb/${datasourceId}`,
        method: 'get',
    });
}

export function getSchemaTableList(datasourceId, dbName) {
    return request({
        url: `/metadata/schema/listSchemaTable/${datasourceId}/${dbName}`,
        method: 'get',
    });
}

export function syncDbTables(data) {
    console.log(data)
    return request({
        url: `/metadata/schema/syncDbTables`,
        method: 'post',
        data,
    });
}