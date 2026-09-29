import request from '@/utils/request';

export function list(catalogName) {
    return request({
        url: `/datasync/job/catalog/list`,
        method: 'get',
        params: catalogName,
    });
}

export function detail(catalogId) {
    return request({
        url: `/datasync/job/catalog/${catalogId}`,
        method: 'get'
    })
}

export function pageList(query) {
    return request({
        url: '/datasync/job/catalog/pageList',
        method: 'get',
        params: query,
    });
}

export function edit(data) {
    return request({
        url: '/datasync/job/catalog',
        method: 'put',
        data,
    });
}

export function add(data) {
    return request({
        url: '/datasync/job/catalog',
        method: 'post',
        data,
    });
}

export function remove(catalogIds) {
    return request({
        url: `/datasync/job/catalog/${catalogIds}`,
        method: 'delete'
    });
}