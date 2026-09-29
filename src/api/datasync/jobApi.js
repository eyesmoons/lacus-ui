import request from '@/utils/request';

export function preCheck(data) {
    return request({
        url: `/datasync/job/definition/preCheck`,
        method: 'post',
        data
    });
}

export function listMappedColumn(data) {
    return request({
        url: `/datasync/job/definition/listMappedColumn`,
        method: 'post',
        data
    });
}

export function add(data) {
    return request({
        url: `/datasync/job/definition/add`,
        method: 'post',
        data
    });
}

export function update(data) {
    return request({
        url: `/datasync/job/definition/modify`,
        method: 'post',
        data
    });
}

export function pageList(query) {
    return request({
        url: `/datasync/job/definition/pageList`,
        method: 'get',
        params: query,
    })
}

export function detail(jobId) {
    return request({
        url: `/datasync/job/definition/detail/${jobId}`,
        method: 'get'
    })
}

export function remove(jobId) {
    return request({
        url: `/datasync/job/definition/remove/${jobId}`,
        method: 'get'
    });
}

export function submitJob(data) {
    return request({
        url: '/datasync/job/operation/start',
        method: 'post',
        data,
    });
}

export function stopJob(jobId) {
    return request({
        url: `/datasync/job/operation/stop/${jobId}`,
        method: 'get'
    });
}

export function jobDetail(catalogId, type) {
    let query = {
        catalogId: catalogId,
        type: type
    }
    return request({
        url: `/datasync/job/definition/jobDetail`,
        method: 'get',
        params: query
    });
}