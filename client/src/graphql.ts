import gql from 'graphql-tag';
import * as VueApolloComposable from '@vue/apollo-composable';
import * as VueCompositionApi from 'vue';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type ReactiveFunction<TParam> = () => TParam;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string | number; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
};

export type BestProxyItemModel = {
  __typename?: 'BestProxyItemModel';
  proxyAddress: Scalars['String']['output'];
  rating: Scalars['Float']['output'];
};

export type BrowserManagerModel = {
  __typename?: 'BrowserManagerModel';
  knownHosts: Array<KnownHostModel>;
};

export type KnownHostModel = {
  __typename?: 'KnownHostModel';
  hostName: Scalars['String']['output'];
  proxiesBestList?: Maybe<Array<BestProxyItemModel>>;
  proxiesBlackList?: Maybe<Array<Scalars['String']['output']>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  deleteProxy: Scalars['JSON']['output'];
  run: Scalars['Boolean']['output'];
  runSourceUpdate: Scalars['JSON']['output'];
  stop: Scalars['Boolean']['output'];
};


export type MutationDeleteProxyArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRunSourceUpdateArgs = {
  sourceId: Scalars['Int']['input'];
};

export type PaginatedProxy = {
  __typename?: 'PaginatedProxy';
  pagination: Pagination;
  rows: Array<Proxy>;
};

export type Pagination = {
  __typename?: 'Pagination';
  page: Scalars['Int']['output'];
  rowsNumber: Scalars['Int']['output'];
  rowsPerPage: Scalars['Int']['output'];
};

export type Proxy = {
  __typename?: 'Proxy';
  host: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  lastSeenOnSourcesHoursAgo?: Maybe<Scalars['Float']['output']>;
  port: Scalars['Int']['output'];
  sources: Array<ProxySourcesView>;
  successTestRate?: Maybe<Scalars['Float']['output']>;
  successTestsCount?: Maybe<Scalars['Int']['output']>;
  testsCount?: Maybe<Scalars['Int']['output']>;
  testsRuns: Array<ProxyTestRun>;
  updates: Array<ProxyListUpdate>;
};

export type ProxyListSource = {
  __typename?: 'ProxyListSource';
  id: Scalars['Int']['output'];
  lastUpdate: ProxyListUpdate;
  name: Scalars['String']['output'];
  updateInterval: Scalars['Int']['output'];
  updates: Array<ProxyListUpdate>;
};

export type ProxyListUpdate = {
  __typename?: 'ProxyListUpdate';
  error?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['Int']['output'];
  loadedProxies: Array<Proxy>;
  newProxies: Array<Proxy>;
  newProxiesCount: Scalars['Int']['output'];
  source: ProxyListSource;
  updateTime: Scalars['DateTime']['output'];
};

export enum ProxyQuerySortEnum {
  Id = 'id',
  LastSeenOnSourcesHoursAgo = 'lastSeenOnSourcesHoursAgo',
  SuccessTestCount = 'successTestCount',
  SuccessTestRate = 'successTestRate',
  TestsCount = 'testsCount'
}

export type ProxySourcesView = {
  __typename?: 'ProxySourcesView';
  firstUpdate: ProxyListUpdate;
  lastUpdate: ProxyListUpdate;
  source: ProxyListSource;
};

export type ProxyTestRun = {
  __typename?: 'ProxyTestRun';
  duration_ms: Scalars['Float']['output'];
  errorResult?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['Int']['output'];
  okResult?: Maybe<Scalars['JSON']['output']>;
  protocol: Scalars['Float']['output'];
  runTime: Scalars['DateTime']['output'];
  testType: ProxyTestType;
  testedProxy: Proxy;
};

export type ProxyTestType = {
  __typename?: 'ProxyTestType';
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  testRuns: Array<ProxyTestRun>;
};

export type ProxyTesterWorkerState = {
  __typename?: 'ProxyTesterWorkerState';
  currentTask?: Maybe<ProxyTesterWorkerTask>;
  workerId: Scalars['Int']['output'];
  workers: Array<ProxyTesterWorkerState>;
};

export type ProxyTesterWorkerTask = {
  __typename?: 'ProxyTesterWorkerTask';
  host: Scalars['String']['output'];
  name: Scalars['String']['output'];
  port: Scalars['Int']['output'];
  protocol: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  browserManagerState: BrowserManagerModel;
  proxies: Array<Proxy>;
  proxiesCount: Scalars['Int']['output'];
  proxiesPage: PaginatedProxy;
  proxyById: Proxy;
  proxyListSources: Array<ProxyListSource>;
  proxyListUpdates: Array<ProxyListUpdate>;
  proxyTesterWorkerState: ProxyTesterWorkerState;
  state: SiteCrawlerState;
  telegramUser: TelegramChatUser;
  telegramUsers: Array<TelegramChatUser>;
};


export type QueryProxiesArgs = {
  descending?: InputMaybe<Scalars['Boolean']['input']>;
  hasNoTests?: InputMaybe<Scalars['Boolean']['input']>;
  hasSuccessTests?: InputMaybe<Scalars['Boolean']['input']>;
  proxySourcesIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  proxyTestTypesIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  proxyTestsHoursAgo?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<ProxyQuerySortEnum>;
  take: Scalars['Int']['input'];
};


export type QueryProxiesPageArgs = {
  descending?: InputMaybe<Scalars['Boolean']['input']>;
  hasNoTests?: InputMaybe<Scalars['Boolean']['input']>;
  hasSuccessTests?: InputMaybe<Scalars['Boolean']['input']>;
  page: Scalars['Int']['input'];
  proxySourcesIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  proxyTestTypesIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  proxyTestsHoursAgo?: InputMaybe<Scalars['Int']['input']>;
  rowsPerPage: Scalars['Int']['input'];
  sortBy?: InputMaybe<ProxyQuerySortEnum>;
};


export type QueryProxyByIdArgs = {
  proxyId: Scalars['Int']['input'];
};


export type QueryProxyListUpdatesArgs = {
  skip: Scalars['Int']['input'];
  take: Scalars['Int']['input'];
};


export type QueryTelegramUserArgs = {
  userId: Scalars['Int']['input'];
};

export type SiteCrawlerState = {
  __typename?: 'SiteCrawlerState';
  pendingRequests: Array<Scalars['String']['output']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  onTaskFinish: WorkerResult;
};

export type TelegramBotAnswer = {
  __typename?: 'TelegramBotAnswer';
  answerTime: Scalars['DateTime']['output'];
  extra?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['Int']['output'];
  text: Scalars['String']['output'];
};

export type TelegramChatDialog = {
  __typename?: 'TelegramChatDialog';
  answers?: Maybe<Array<TelegramBotAnswer>>;
  chatId: Scalars['Int']['output'];
  from: TelegramChatUser;
  id: Scalars['Int']['output'];
  inputMessage: Scalars['String']['output'];
  startTime: Scalars['DateTime']['output'];
};

export type TelegramChatUser = {
  __typename?: 'TelegramChatUser';
  dialogs: Array<TelegramChatDialog>;
  first_name: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  is_bot: Scalars['Boolean']['output'];
  language_code?: Maybe<Scalars['String']['output']>;
  last_name?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};


export type TelegramChatUserDialogsArgs = {
  skip: Scalars['Int']['input'];
  take: Scalars['Int']['input'];
};

export type WorkerResult = {
  __typename?: 'WorkerResult';
  result: ProxyTestRun;
  workerId: Scalars['Int']['output'];
};

export type GetProxiesPageQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  rowsPerPage: Scalars['Int']['input'];
  sortBy?: InputMaybe<ProxyQuerySortEnum>;
  descending?: InputMaybe<Scalars['Boolean']['input']>;
  hasNoTests?: InputMaybe<Scalars['Boolean']['input']>;
  hasSuccessTests?: InputMaybe<Scalars['Boolean']['input']>;
  proxyTestsHoursAgo?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetProxiesPageQuery = { __typename?: 'Query', proxiesPage: { __typename?: 'PaginatedProxy', pagination: { __typename?: 'Pagination', page: number, rowsPerPage: number, rowsNumber: number }, rows: Array<{ __typename?: 'Proxy', id: number, host: string, port: number, lastSeenOnSourcesHoursAgo?: number | null, testsCount?: number | null, successTestsCount?: number | null, successTestRate?: number | null, sources: Array<{ __typename?: 'ProxySourcesView', source: { __typename?: 'ProxyListSource', name: string }, firstUpdate: { __typename?: 'ProxyListUpdate', updateTime: any }, lastUpdate: { __typename?: 'ProxyListUpdate', updateTime: any } }> }> } };

export type KnownHostsQueryVariables = Exact<{ [key: string]: never; }>;


export type KnownHostsQuery = { __typename?: 'Query', browserManagerState: { __typename?: 'BrowserManagerModel', knownHosts: Array<{ __typename?: 'KnownHostModel', hostName: string, proxiesBlackList?: Array<string> | null, proxiesBestList?: Array<{ __typename?: 'BestProxyItemModel', proxyAddress: string, rating: number }> | null }> } };

export type ProxyTesterWorkerStateQueryVariables = Exact<{ [key: string]: never; }>;


export type ProxyTesterWorkerStateQuery = { __typename?: 'Query', proxyTesterWorkerState: { __typename?: 'ProxyTesterWorkerState', workers: Array<{ __typename?: 'ProxyTesterWorkerState', workerId: number, currentTask?: { __typename?: 'ProxyTesterWorkerTask', host: string, port: number, protocol: string, name: string } | null }> } };

export type WorkerTaskFinishSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type WorkerTaskFinishSubscription = { __typename?: 'Subscription', onTaskFinish: { __typename?: 'WorkerResult', workerId: number, result: { __typename?: 'ProxyTestRun', okResult?: any | null, errorResult?: any | null, runTime: any, duration_ms: number, protocol: number, id: number, testType: { __typename?: 'ProxyTestType', name: string }, testedProxy: { __typename?: 'Proxy', id: number, host: string, port: number } } } };

export type ProxyListSourcesWithLastUpdateQueryVariables = Exact<{ [key: string]: never; }>;


export type ProxyListSourcesWithLastUpdateQuery = { __typename?: 'Query', proxyListSources: Array<{ __typename?: 'ProxyListSource', id: number, name: string, updateInterval: number, lastUpdate: { __typename?: 'ProxyListUpdate', updateTime: any, newProxiesCount: number, error?: any | null, newProxies: Array<{ __typename?: 'Proxy', id: number, host: string, port: number }> } }> };

export type TelegramUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type TelegramUsersQuery = { __typename?: 'Query', telegramUsers: Array<{ __typename?: 'TelegramChatUser', id: number, first_name: string, username?: string | null }> };

export type TelegramUserQueryVariables = Exact<{
  userId: Scalars['Int']['input'];
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
}>;


export type TelegramUserQuery = { __typename?: 'Query', telegramUser: { __typename?: 'TelegramChatUser', id: number, first_name: string, username?: string | null, dialogs: Array<{ __typename?: 'TelegramChatDialog', id: number, inputMessage: string, startTime: any, answers?: Array<{ __typename?: 'TelegramBotAnswer', id: number, answerTime: any, text: string, extra?: any | null }> | null }> } };

export type DeleteProxyMutationVariables = Exact<{
  Id: Scalars['Int']['input'];
}>;


export type DeleteProxyMutation = { __typename?: 'Mutation', deleteProxy: any };


export const GetProxiesPage = gql`
    query getProxiesPage($page: Int!, $rowsPerPage: Int!, $sortBy: ProxyQuerySortEnum, $descending: Boolean, $hasNoTests: Boolean, $hasSuccessTests: Boolean, $proxyTestsHoursAgo: Int) {
  proxiesPage(
    page: $page
    rowsPerPage: $rowsPerPage
    sortBy: $sortBy
    descending: $descending
    hasNoTests: $hasNoTests
    hasSuccessTests: $hasSuccessTests
    proxyTestsHoursAgo: $proxyTestsHoursAgo
  ) {
    pagination {
      page
      rowsPerPage
      rowsNumber
    }
    rows {
      id
      host
      port
      lastSeenOnSourcesHoursAgo
      testsCount
      successTestsCount
      successTestRate
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
export const ProxyListSourcesWithLastUpdate = gql`
    query ProxyListSourcesWithLastUpdate {
  proxyListSources {
    id
    name
    updateInterval
    lastUpdate {
      updateTime
      newProxiesCount
      error
      newProxies {
        id
        host
        port
      }
    }
  }
}
    `;
export const TelegramUsers = gql`
    query telegramUsers {
  telegramUsers {
    id
    first_name
    username
  }
}
    `;
export const TelegramUser = gql`
    query TelegramUser($userId: Int!, $take: Int!, $skip: Int!) {
  telegramUser(userId: $userId) {
    id
    first_name
    username
    dialogs(take: $take, skip: $skip) {
      id
      inputMessage
      startTime
      answers {
        id
        answerTime
        text
        extra
      }
    }
  }
}
    `;
export const DeleteProxy = gql`
    mutation deleteProxy($Id: Int!) {
  deleteProxy(id: $Id)
}
    `;

export const GetProxiesPageDocument = gql`
    query getProxiesPage($page: Int!, $rowsPerPage: Int!, $sortBy: ProxyQuerySortEnum, $descending: Boolean, $hasNoTests: Boolean, $hasSuccessTests: Boolean, $proxyTestsHoursAgo: Int) {
  proxiesPage(
    page: $page
    rowsPerPage: $rowsPerPage
    sortBy: $sortBy
    descending: $descending
    hasNoTests: $hasNoTests
    hasSuccessTests: $hasSuccessTests
    proxyTestsHoursAgo: $proxyTestsHoursAgo
  ) {
    pagination {
      page
      rowsPerPage
      rowsNumber
    }
    rows {
      id
      host
      port
      lastSeenOnSourcesHoursAgo
      testsCount
      successTestsCount
      successTestRate
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
 *   sortBy: // value for 'sortBy'
 *   descending: // value for 'descending'
 *   hasNoTests: // value for 'hasNoTests'
 *   hasSuccessTests: // value for 'hasSuccessTests'
 *   proxyTestsHoursAgo: // value for 'proxyTestsHoursAgo'
 * });
 */
export function useGetProxiesPageQuery(variables: GetProxiesPageQueryVariables | VueCompositionApi.Ref<GetProxiesPageQueryVariables> | ReactiveFunction<GetProxiesPageQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetProxiesPageQuery, GetProxiesPageQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetProxiesPageQuery, GetProxiesPageQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetProxiesPageQuery, GetProxiesPageQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<GetProxiesPageQuery, GetProxiesPageQueryVariables>(GetProxiesPageDocument, variables, options);
}
export function useGetProxiesPageLazyQuery(variables: GetProxiesPageQueryVariables | VueCompositionApi.Ref<GetProxiesPageQueryVariables> | ReactiveFunction<GetProxiesPageQueryVariables>, options: VueApolloComposable.UseQueryOptions<GetProxiesPageQuery, GetProxiesPageQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<GetProxiesPageQuery, GetProxiesPageQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<GetProxiesPageQuery, GetProxiesPageQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<GetProxiesPageQuery, GetProxiesPageQueryVariables>(GetProxiesPageDocument, variables, options);
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
export function useKnownHostsLazyQuery(options: VueApolloComposable.UseQueryOptions<KnownHostsQuery, KnownHostsQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<KnownHostsQuery, KnownHostsQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<KnownHostsQuery, KnownHostsQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<KnownHostsQuery, KnownHostsQueryVariables>(KnownHostsDocument, {}, options);
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
export function useProxyTesterWorkerStateLazyQuery(options: VueApolloComposable.UseQueryOptions<ProxyTesterWorkerStateQuery, ProxyTesterWorkerStateQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<ProxyTesterWorkerStateQuery, ProxyTesterWorkerStateQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<ProxyTesterWorkerStateQuery, ProxyTesterWorkerStateQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<ProxyTesterWorkerStateQuery, ProxyTesterWorkerStateQueryVariables>(ProxyTesterWorkerStateDocument, {}, options);
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
export const ProxyListSourcesWithLastUpdateDocument = gql`
    query ProxyListSourcesWithLastUpdate {
  proxyListSources {
    id
    name
    updateInterval
    lastUpdate {
      updateTime
      newProxiesCount
      error
      newProxies {
        id
        host
        port
      }
    }
  }
}
    `;

/**
 * __useProxyListSourcesWithLastUpdateQuery__
 *
 * To run a query within a Vue component, call `useProxyListSourcesWithLastUpdateQuery` and pass it any options that fit your needs.
 * When your component renders, `useProxyListSourcesWithLastUpdateQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useProxyListSourcesWithLastUpdateQuery();
 */
export function useProxyListSourcesWithLastUpdateQuery(options: VueApolloComposable.UseQueryOptions<ProxyListSourcesWithLastUpdateQuery, ProxyListSourcesWithLastUpdateQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<ProxyListSourcesWithLastUpdateQuery, ProxyListSourcesWithLastUpdateQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<ProxyListSourcesWithLastUpdateQuery, ProxyListSourcesWithLastUpdateQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<ProxyListSourcesWithLastUpdateQuery, ProxyListSourcesWithLastUpdateQueryVariables>(ProxyListSourcesWithLastUpdateDocument, {}, options);
}
export function useProxyListSourcesWithLastUpdateLazyQuery(options: VueApolloComposable.UseQueryOptions<ProxyListSourcesWithLastUpdateQuery, ProxyListSourcesWithLastUpdateQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<ProxyListSourcesWithLastUpdateQuery, ProxyListSourcesWithLastUpdateQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<ProxyListSourcesWithLastUpdateQuery, ProxyListSourcesWithLastUpdateQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<ProxyListSourcesWithLastUpdateQuery, ProxyListSourcesWithLastUpdateQueryVariables>(ProxyListSourcesWithLastUpdateDocument, {}, options);
}
export type ProxyListSourcesWithLastUpdateQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<ProxyListSourcesWithLastUpdateQuery, ProxyListSourcesWithLastUpdateQueryVariables>;
export const TelegramUsersDocument = gql`
    query telegramUsers {
  telegramUsers {
    id
    first_name
    username
  }
}
    `;

/**
 * __useTelegramUsersQuery__
 *
 * To run a query within a Vue component, call `useTelegramUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useTelegramUsersQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useTelegramUsersQuery();
 */
export function useTelegramUsersQuery(options: VueApolloComposable.UseQueryOptions<TelegramUsersQuery, TelegramUsersQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<TelegramUsersQuery, TelegramUsersQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<TelegramUsersQuery, TelegramUsersQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<TelegramUsersQuery, TelegramUsersQueryVariables>(TelegramUsersDocument, {}, options);
}
export function useTelegramUsersLazyQuery(options: VueApolloComposable.UseQueryOptions<TelegramUsersQuery, TelegramUsersQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<TelegramUsersQuery, TelegramUsersQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<TelegramUsersQuery, TelegramUsersQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<TelegramUsersQuery, TelegramUsersQueryVariables>(TelegramUsersDocument, {}, options);
}
export type TelegramUsersQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<TelegramUsersQuery, TelegramUsersQueryVariables>;
export const TelegramUserDocument = gql`
    query TelegramUser($userId: Int!, $take: Int!, $skip: Int!) {
  telegramUser(userId: $userId) {
    id
    first_name
    username
    dialogs(take: $take, skip: $skip) {
      id
      inputMessage
      startTime
      answers {
        id
        answerTime
        text
        extra
      }
    }
  }
}
    `;

/**
 * __useTelegramUserQuery__
 *
 * To run a query within a Vue component, call `useTelegramUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useTelegramUserQuery` returns an object from Apollo Client that contains result, loading and error properties
 * you can use to render your UI.
 *
 * @param variables that will be passed into the query
 * @param options that will be passed into the query, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/query.html#options;
 *
 * @example
 * const { result, loading, error } = useTelegramUserQuery({
 *   userId: // value for 'userId'
 *   take: // value for 'take'
 *   skip: // value for 'skip'
 * });
 */
export function useTelegramUserQuery(variables: TelegramUserQueryVariables | VueCompositionApi.Ref<TelegramUserQueryVariables> | ReactiveFunction<TelegramUserQueryVariables>, options: VueApolloComposable.UseQueryOptions<TelegramUserQuery, TelegramUserQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<TelegramUserQuery, TelegramUserQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<TelegramUserQuery, TelegramUserQueryVariables>> = {}) {
  return VueApolloComposable.useQuery<TelegramUserQuery, TelegramUserQueryVariables>(TelegramUserDocument, variables, options);
}
export function useTelegramUserLazyQuery(variables: TelegramUserQueryVariables | VueCompositionApi.Ref<TelegramUserQueryVariables> | ReactiveFunction<TelegramUserQueryVariables>, options: VueApolloComposable.UseQueryOptions<TelegramUserQuery, TelegramUserQueryVariables> | VueCompositionApi.Ref<VueApolloComposable.UseQueryOptions<TelegramUserQuery, TelegramUserQueryVariables>> | ReactiveFunction<VueApolloComposable.UseQueryOptions<TelegramUserQuery, TelegramUserQueryVariables>> = {}) {
  return VueApolloComposable.useLazyQuery<TelegramUserQuery, TelegramUserQueryVariables>(TelegramUserDocument, variables, options);
}
export type TelegramUserQueryCompositionFunctionResult = VueApolloComposable.UseQueryReturn<TelegramUserQuery, TelegramUserQueryVariables>;
export const DeleteProxyDocument = gql`
    mutation deleteProxy($Id: Int!) {
  deleteProxy(id: $Id)
}
    `;

/**
 * __useDeleteProxyMutation__
 *
 * To run a mutation, you first call `useDeleteProxyMutation` within a Vue component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProxyMutation` returns an object that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - Several other properties: https://v4.apollo.vuejs.org/api/use-mutation.html#return
 *
 * @param options that will be passed into the mutation, supported options are listed on: https://v4.apollo.vuejs.org/guide-composable/mutation.html#options;
 *
 * @example
 * const { mutate, loading, error, onDone } = useDeleteProxyMutation({
 *   variables: {
 *     Id: // value for 'Id'
 *   },
 * });
 */
export function useDeleteProxyMutation(options: VueApolloComposable.UseMutationOptions<DeleteProxyMutation, DeleteProxyMutationVariables> | ReactiveFunction<VueApolloComposable.UseMutationOptions<DeleteProxyMutation, DeleteProxyMutationVariables>> = {}) {
  return VueApolloComposable.useMutation<DeleteProxyMutation, DeleteProxyMutationVariables>(DeleteProxyDocument, options);
}
export type DeleteProxyMutationCompositionFunctionResult = VueApolloComposable.UseMutationReturn<DeleteProxyMutation, DeleteProxyMutationVariables>;