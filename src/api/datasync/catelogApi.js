import request from '@/utils/request';

export function list(catelogName) {
    return request({
        url: `/datasync/job/catelog/list`,
        method: 'get',
        params: catelogName,
    });
}

export function detail(catelogId) {
    return request({
        url: `/datasync/job/catelog/${catelogId}`,
        method: 'get'
    })
}

export function pageList(query) {
    return request({
        url: '/datasync/job/catelog/pageList',
        method: 'get',
        params: query,
    });
}

export function edit(data) {
    return request({
        url: '/datasync/job/catelog',
        method: 'put',
        data,
    });
}

export function add(data) {
    return request({
        url: '/datasync/job/catelog',
        method: 'post',
        data,
    });
}

export function remove(catelogIds) {
    return request({
        url: `/datasync/job/catelog/${catelogIds}`,
        method: 'delete'
    });
}