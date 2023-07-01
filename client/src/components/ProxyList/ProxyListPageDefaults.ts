import { ProxyQuerySortEnum } from '../../graphql';
import { useRouteQuery, enumTransform, boolNullTransform } from './../../composables/useRouteQuery'



export function useProxyListPageRouteQuery() {
    return {
        page: useRouteQuery('page', '1', { transform: Number }),
        rowsPerPage: useRouteQuery('rowsPerPage', '10', { transform: Number }),
        sortBy: useRouteQuery<ProxyQuerySortEnum>('sortBy', ProxyQuerySortEnum.Id, { transform: enumTransform(ProxyQuerySortEnum, ProxyQuerySortEnum.Id) }),
        descending: useRouteQuery('descending', 'false', { transform: boolNullTransform }),
        hasNoTests: useRouteQuery('hasNoTests', 'null', { transform: boolNullTransform }),
        hasSuccessTests: useRouteQuery('hasSuccessTests', 'null', { transform: boolNullTransform }),
        proxyTestsHoursAgo: useRouteQuery('proxyTestsHoursAgo', '1', { transform: Number }),
        testIntervalEnable: useRouteQuery('testIntervalEnable', 'false', { transform: boolNullTransform }),
    }
};
