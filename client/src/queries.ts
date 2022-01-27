import gql from 'graphql-tag';

export const proxiesPageQuery = gql`
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
