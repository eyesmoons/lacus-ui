import request from '@/utils/request';

export function listMappedColumn(data) {
    return request({
        url: `/datasync/job/listMappedColumn`,
        method: 'post',
        data
    });
}