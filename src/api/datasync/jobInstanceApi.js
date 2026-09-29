import request from '@/utils/request';

export function pageList(query) {
    return request({
        url: `/datasync/job/instance/pageList`,
        method: 'get',
        params: query,
    })
}
