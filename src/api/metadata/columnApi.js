import request from "@/utils/request";

export function listTable(tableId) {
    return request({
        url: `/metadata/column/getColumnsBytTableId/${tableId}`,
        method: 'get'
    });
}