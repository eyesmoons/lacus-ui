import request from '@/utils/request';

export function listMappedColumn(data) {
    return request({
        url: `/datasync/job/listMappedColumn`,
        method: 'post',
        data
    });
}

export function add(data) {
    return request({
        url: `/datasync/job/add`,
        method: 'post',
        data
    });
}

export function pageList(query) {
    return request({
        url: `/datasync/job/pageList`,
        method: 'get',
        params: query,
    })
}

export function listSavedDbTableByDbName(query) {
    return request({
        url: `/datasync/job/listSavedDbTableByDbName`,
        method: 'get',
        params: query,
    })
}

export function listSavedDbTableByJobId(jobId) {
    return request({
        url: `/datasync/job/listSavedDbTableByDbName/${jobId}`,
        method: 'get'
    })
}

export function detail(jobId) {
    return request({
        url: `/datasync/job/detail/${jobId}`,
        method: 'get'
    })
}
