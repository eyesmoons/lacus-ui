import request from "@/utils/request";

export function listTable(query) {
    return request({
        url: `/metadata/table/pageList`,
        method: 'get',
        params: {
            'datasourceId': query.datasourceId,
            'dbId': query.dbId,
            'tableName': query.tableName
        }
    });
}

export function tableDetail(tableId) {
    return request({
        url: `/metadata/table/detail/${tableId}`,
        method: 'get'
    });
}