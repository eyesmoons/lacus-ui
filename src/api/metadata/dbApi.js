import request from "@/utils/request";

export function getDatasourceList(datasourceId) {
    return request({
        url: `/metadata/db/list/${datasourceId}`,
        method: 'get'
    });
}