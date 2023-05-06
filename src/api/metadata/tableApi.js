import request from "@/utils/request";

export function listTable(query) {
    return request({
        url: `/metadata/table/pageList`,
        method: 'get',
        params: query
    });
}

export function tableDetail(tableId) {
    return request({
        url: `/metadata/table/detail/${tableId}`,
        method: 'get'
    });
}