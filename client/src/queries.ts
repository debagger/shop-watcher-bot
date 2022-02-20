import gql from 'graphql-tag';

export const proxiesPageQuery = gql`
  query getProxiesPage(
      $page: Int!, 
      $rowsPerPage: Int!, 
      $sortBy: ProxyQuerySortEnum, 
      $descending: Boolean, 
      $hasNoTests:Boolean, 
      $hasSuccessTests:Boolean,
      $proxyTestsHoursAgo:Int
    ) {
    proxiesPage(
        page: $page, 
        rowsPerPage: $rowsPerPage, 
        sortBy: $sortBy, 
        descending: $descending, 
        hasNoTests:$hasNoTests, 
        hasSuccessTests:$hasSuccessTests,
        proxyTestsHoursAgo:$proxyTestsHoursAgo
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

export const knownHostsQuery = gql`
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

export const proxyTesterWorkerState = gql`
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

export const workerTaskFinish = gql`
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

export const proxyListSourcesWithLastUpdate = gql`
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
export const telegramUsers = gql`
  query telegramUsers {
    telegramUsers {
      id
      first_name
      username
    }
  }
`;

export const telegramUser = gql`
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

export const deleteProxy = gql`
mutation deleteProxy($Id:Int!) {
  deleteProxy(id:$Id)
}
`