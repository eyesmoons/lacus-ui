import request from '@/utils/request';

export function listDatasourceCatalog() {
    return request({
        url: `/metadata/datasource/type/listDatasourceCatalog`,
        method: 'get'
    });
}

export function list(typeName) {
    return request({
        url: `/metadata/datasource/type/list`,
        method: 'get',
        params: {
            "typeName": typeName
        },
    });
}

export function add(data) {
    return request({
        url: '/metadata/datasource/type',
        method: 'post',
        data,
    });
}

export function update(data) {
    return request({
        url: '/metadata/datasource/type',
        method: 'put',
        data,
    });
}

export function remove(datasourceTypeIds) {
    return request({
        url: `/metadata/datasource/type/${datasourceTypeIds}`,
        method: 'delete'
    });
}

// 查询参数详细
export function detail(typeId) {
    return request({
        url: `/metadata/datasource/type/${typeId}`,
        method: 'get',
    });
}
