import request from "@/utils/request";

export function listTable(tableId) {
    return request({
        url: `/metadata/column/getColumnsByTableId/${tableId}`,
        method: 'get'
    });
}

export function listTableByName(datasourceId, dbName, tableName) {
    return request({
        url: `/metadata/column/getColumnsByTableName`,
        method: 'get',
        params: {
            datasourceId: datasourceId,
            dbName: dbName,
            tableName: tableName
        }
    });
}