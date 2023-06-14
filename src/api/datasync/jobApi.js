import request from '@/utils/request';

export function preCheck(data) {
    return request({
        url: `/datasync/job/manager/preCheck`,
        method: 'post',
        data
    });
}

export function listMappedColumn(data) {
    return request({
        url: `/datasync/job/manager/listMappedColumn`,
        method: 'post',
        data
    });
}

export function add(data) {
    return request({
        url: `/datasync/job/manager/add`,
        method: 'post',
        data
    });
}

export function update(data) {
    return request({
        url: `/datasync/job/manager/modify`,
        method: 'post',
        data
    });
}

export function jobListTree(query) {
    return request({
        url: `/datasync/job/manager/jobListTree`,
        method: 'get',
        params: query,
    })
}

export function pageList(query) {
    return request({
        url: `/datasync/job/manager/pageList`,
        method: 'get',
        params: query,
    })
}

export function listSavedDbTableByDbName(query) {
    return request({
        url: `/datasync/job/manager/listSavedDbTableByDbName`,
        method: 'get',
        params: query,
    })
}

export function listSavedDbTableByJobId(jobId) {
    return request({
        url: `/datasync/job/manager/listSavedDbTableByDbName/${jobId}`,
        method: 'get'
    })
}

export function detail(jobId) {
    return request({
        url: `/datasync/job/manager/detail/${jobId}`,
        method: 'get'
    })
}

export function submitJob(data) {
    return request({
        url: '/datasync/job/operation/submitJob',
        method: 'post',
        data,
    });
}