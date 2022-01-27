import gql from 'graphql-tag';
import * as VueApolloComposable from '@vue/apollo-composable';
import * as VueCompositionApi from 'vue';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type ReactiveFunction<TParam> = () => TParam;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
};

export type BestProxyItemModel = {
  __typename?: 'BestProxyItemModel';
  proxyAddress: Scalars['String'];
  rating: Scalars['Float'];
};

export type BrowserManagerModel = {
  __typename?: 'BrowserManagerModel';
  knownHosts: Array<KnownHostModel>;
};

export type KnownHostModel = {
  __typename?: 'KnownHostModel';
  hostName: Scalars['String'];
  proxiesBestList?: Maybe<Array<BestProxyItemModel>>;
  proxiesBlackList?: Maybe<Array<Scalars['String']>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  run: Scalars['Boolean'];
  runSourceUpdate: Scalars['JSON'];
  stop: Scalars['Boolean'];
};


export type MutationRunSourceUpdateArgs = {
  sourceId: Scalars['Int'];
};

export type PaginatedProxy = {
  __typename?: 'PaginatedProxy';
  pagination: Pagination;
  rows: Array<Proxy>;
};

export type Pagination = {
  __typename?: 'Pagination';
  page: Scalars['Int'];
  rowsNumber: Scalars['Int'];
  rowsPerPage: Scalars['Int'];
};

export type Proxy = {
  __typename?: 'Proxy';
  host: Scalars['String'];
  id: Scalars['Int'];
  port: Scalars['Int'];
  sources: Array<ProxySourcesView>;
  testsRuns: Array<ProxyTestRun>;
  updates: Array<ProxyListUpdate>;
};

export type ProxyListSource = {
  __typename?: 'ProxyListSource';
  id: Scalars['Int'];
  lastUpdate: ProxyListUpdate;
  name: Scalars['String'];
  updateInterval: Scalars['Int'];
  updates: Array<ProxyListUpdate>;
};

export type ProxyListUpdate = {
  __typename?: 'ProxyListUpdate';
  error?: Maybe<Scalars['JSON']>;
  id: Scalars['Int'];
  loadedProxies: Array<Proxy>;
  newProxies: Array<Proxy>;
  newProxiesCount: Scalars['Int'];
  source: ProxyListSource;
  updateTime: Scalars['DateTime'];
};

export type ProxySourcesView = {
  __typename?: 'ProxySourcesView';
  firstUpdate: ProxyListUpdate;
  lastUpdate: ProxyListUpdate;
  source: ProxyListSource;
};

export type ProxyTestRun = {
  __typename?: 'ProxyTestRun';
  duration_ms: Scalars['Float'];
  errorResult?: Maybe<Scalars['JSON']>;
  id: Scalars['Int'];
  okResult?: Maybe<Scalars['JSON']>;
  protocol: Scalars['Float'];
  runTime: Scalars['DateTime'];
  testType: ProxyTestType;
  testedProxy: Proxy;
};

export type ProxyTestType = {
  __typename?: 'ProxyTestType';
  id: Scalars['Int'];
  name: Scalars['String'];
  testRuns: Array<ProxyTestRun>;
};

export type ProxyTesterWorkerState = {
  __typename?: 'ProxyTesterWorkerState';
  currentTask?: Maybe<ProxyTesterWorkerTask>;
  workerId: Scalars['Int'];
  workers: Array<ProxyTesterWorkerState>;
};

export type ProxyTesterWorkerTask = {
  __typename?: 'ProxyTesterWorkerTask';
  host: Scalars['String'];
  name: Scalars['String'];
  port: Scalars['Int'];
  protocol: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  browserManagerState: BrowserManagerModel;
  proxies: Array<Proxy>;
  proxiesCount: Scalars['Int'];
  proxiesPage: PaginatedProxy;
  proxyListSources: Array<ProxyListSource>;
  proxyListUpdates: Array<ProxyListUpdate>;
  proxyTesterWorkerState: ProxyTesterWorkerState;
  state: SiteCrawlerState;
};


export type QueryProxiesArgs = {
  skip: Scalars['Int'];
  take: Scalars['Int'];
};


export type QueryProxiesPageArgs = {
  page: Scalars['Int'];
  rowsPerPage: Scalars['Int'];
};


export type QueryProxyListSourcesArgs = {
  skip: Scalars['Int'];
  take: Scalars['Int'];
};


export type QueryProxyListUpdatesArgs = {
  skip: Scalars['Int'];
  take: Scalars['Int'];
};

export type SiteCrawlerState = {
  __typename?: 'SiteCrawlerState';
  pendingRequests: Array<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  onTaskFinish: WorkerResult;
};

export type WorkerResult = {
  __typename?: 'WorkerResult';
  result: ProxyTestRun;
  workerId: Scalars['Int'];
};

export type GetProxiesPageQueryVariables = Exact<{
  page: Scalars['Int'];
  rowsPerPage: Scalars['Int'];
}>;


export type GetProxiesPageQuery = { __typename?: 'Query', proxiesPage: { __typename?: 'PaginatedProxy', pagination: { __typename?: 'Pagination', page: number, rowsPerPage: number, rowsNumber: number }, rows: Array<{ __typename?: 'Proxy', id: number, host: string, port: number, sources: Array<{ __typename?: 'ProxySourcesView', source: { __typename?: 'ProxyListSource', name: string }, firstUpdate: { __typename?: 'ProxyListUpdate', updateTime: any }, lastUpdate: { __typename?: 'ProxyListUpdate', updateTime: any } }> }> } };

export type KnownHostsQueryVariables = Exact<{ [key: string]: never; }>;


export type KnownHostsQuery = { __typename?: 'Query', browserManagerState: { __typename?: 'BrowserManagerModel', knownHosts: Array<{ __typename?: 'KnownHostModel', hostName: string, proxiesBlackList?: Array<string> | null | undefined, proxiesBestList?: Array<{ __typename?: 'BestProxyItemModel', proxyAddress: string, rating: number }> | null | undefined }> } };

export type ProxyTesterWorkerStateQueryVariables = Exact<{ [key: string]: never; }>;


export type ProxyTesterWorkerStateQuery = { __typename?: 'Query', proxyTesterWorkerState: { __typename?: 'ProxyTesterWorkerState', workers: Array<{ __typename?: 'ProxyTesterWorkerState', workerId: number, currentTask?: { __typename?: 'ProxyTesterWorkerTask', host: string, port: number, protocol: string, name: string } | null | undefined }> } };

export type WorkerTaskFinishSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type WorkerTaskFinishSubscription = { __typename?: 'Subscription', onTaskFinish: { __typename?: 'WorkerResult', workerId: number, result: { __typename?: 'ProxyTestRun', okResult?: any | null | undefined, errorResult?: any | null | undefined, runTime: any, duration_ms: number, protocol: number, id: number, testType: { __typename?: 'ProxyTestType', name: string }, testedProxy: { __typename?: 'Proxy', id: number, host: string, port: number } } } };


export const GetProxiesPage = gql`
    query getProxiesPage($page: Int!, $rowsPerPage: Int!) {
  proxiesPage(page: $page, rowsPerPage: $rowsPerPage) {
    pagination {
      page
      rowsPerPage
      rowsNumber
    }
    rows {
      id
      host
      port
      sources {
        source {
          name
        }
        firstUpdate {
          updateTime
        }
        lastUpdate {
          updateTime
        }
      }
    }
  }
}
    `;
export const KnownHosts = gql`
    query knownHosts {
  browserManagerState {
    knownHosts {
      hostName
      proxiesBlackList
      proxiesBestList {
        proxyAddress
        rating
      }
    }
  }
}
    `;
export const ProxyTesterWorkerState = gql`
    query proxyTesterWorkerState {
  proxyTesterWorkerState {
    workers {
      workerId
      currentTask {
        host
        port
        protocol
        name
      }
    }
  }
}
    `;
export const WorkerTaskFinish = gql`
    subscription WorkerTaskFinish {
  onTaskFinish {
    workerId
    result {
      okResult
      errorResult
      runTime
      duration_ms
      protocol
      id
      testType {
        name
      }
      testedProxy {
        id
        host
        port
      }
    }
  }
}
    `;

export const GetProxiesPageDocument = gql`
    query getProxiesPage($page: Int!, $rowsPerPage: Int!) {
  proxiesPage(page: $page, rowsPerPage: $rowsPerPage) {
    pagination {
      page
      rowsPerPage
      rowsNumber
    }
    rows {
      id
      host
      port
      sources {
        source {
          name
        }
        firstUpdate {
          updateTime
        }
        lastUpdate {
          updateTime
        }
      }
    }
  }
}
    `;

/**
 * __useGetProxiesPageQuery__
 *
 * To run a query within a Vue component, call `useGetProxiesPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProxiesPageQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useGetProxiesPageQuery({
 *   page: // value for 'page'
 *   rowsPerPage: // value for 'rowsPerPage'
 * });
 */
export function useGetProxiesPageQuery(variables: GetProxiesPageQueryVariables | VueCompositionApi.Ref<GetProxiesPageQueryVariables> | ReactiveFunction<GetProxiesPageQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetProxiesPageQuery, GetProxiesPageQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetProxiesPageQuery, GetProxiesPageQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetProxiesPageQuery, GetProxiesPageQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetProxiesPageQuery, GetProxiesPageQueryVariables>(GetProxiesPageDocument, variables, options);
}
export type GetProxiesPageQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<GetProxiesPageQuery, GetProxiesPageQueryVariables>;
export const KnownHostsDocument = gql`
    query knownHosts {
  browserManagerState {
    knownHosts {
      hostName
      proxiesBlackList
      proxiesBestList {
        proxyAddress
        rating
      }
    }
  }
}
    `;

/**
 * __useKnownHostsQuery__
 *
 * To run a query within a Vue component, call `useKnownHostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useKnownHostsQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useKnownHostsQuery();
 */
export function useKnownHostsQuery(options: VueApolloComposable.UseQueryOptions<KnownHostsQuery, KnownHostsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<KnownHostsQuery, KnownHostsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<KnownHostsQuery, KnownHostsQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<KnownHostsQuery, KnownHostsQueryVariables>(KnownHostsDocument, {}, options);
}
export type KnownHostsQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<KnownHostsQuery, KnownHostsQueryVariables>;
export const ProxyTesterWorkerStateDocument = gql`
    query proxyTesterWorkerState {
  proxyTesterWorkerState {
    workers {
      workerId
      currentTask {
        host
        port
        protocol
        name
      }
    }
  }
}
    `;

/**
 * __useProxyTesterWorkerStateQuery__
 *
 * To run a query within a Vue component, call `useProxyTesterWorkerStateQuery` and pass it any options that fit your needs.
 * When your component renders, `useProxyTesterWorkerStateQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useProxyTesterWorkerStateQuery();
 */
export function useProxyTesterWorkerStateQuery(options: VueApolloComposable.UseQueryOptions<ProxyTesterWorkerStateQuery, ProxyTesterWorkerStateQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<ProxyTesterWorkerStateQuery, ProxyTesterWorkerStateQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<ProxyTesterWorkerStateQuery, ProxyTesterWorkerStateQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<ProxyTesterWorkerStateQuery, ProxyTesterWorkerStateQueryVariables>(ProxyTesterWorkerStateDocument, {}, options);
}
export type ProxyTesterWorkerStateQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<ProxyTesterWorkerStateQuery, ProxyTesterWorkerStateQueryVariables>;
export const WorkerTaskFinishDocument = gql`
    subscription WorkerTaskFinish {
  onTaskFinish {
    workerId
    result {
      okResult
      errorResult
      runTime
      duration_ms
      protocol
      id
      testType {
        name
      }
      testedProxy {
        id
        host
        port
      }
    }
  }
}
    `;

/**
 * __useWorkerTaskFinishSubscription__
 *
 * To run a query within a Vue component, call `useWorkerTaskFinishSubscription` and pass it any options that fit your needs.
 * When your component renders, `useWorkerTaskFinishSubscription` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the subscription, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/subscription.html#options;
 *
 * @example
 * const { result, loading, error } = useWorkerTaskFinishSubscription();
 */
export function useWorkerTaskFinishSubscription(options: VueApolloComposable.UseSubscriptionOptions<WorkerTaskFinishSubscription, WorkerTaskFinishSubscriptionVariables> | VueCompositionApi.Ref<VueApolloComposable.UseSubscriptionOptions<WorkerTaskFinishSubscription, WorkerTaskFinishSubscriptionVariables>> | ReactiveFunction<VueApolloComposable.UseSubscriptionOptions<WorkerTaskFinishSubscription, WorkerTaskFinishSubscriptionVariables>> = {}) {
  return VueApolloComposable.useSubscription<WorkerTaskFinishSubscription, WorkerTaskFinishSubscriptionVariables>(WorkerTaskFinishDocument, {}, options);
}
export type WorkerTaskFinishSubscriptionCompositionFunctionResult = VueApolloComposable.UseSubscriptionReturn<WorkerTaskFinishSubscription, WorkerTaskFinishSubscriptionVariables>;