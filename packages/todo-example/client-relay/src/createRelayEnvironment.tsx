import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { createApplyLiveQueryPatch } from "@n1ru4l/graphql-live-query-patch";
import { applyAsyncIterableIteratorToSink } from "@n1ru4l/push-pull-async-iterable-iterator";
import {
  Environment,
  Network,
  RecordSource,
  Store,
  Observable,
  GraphQLResponse,
  RequestParameters,
  Variables,
} from "relay-runtime";

const throttle = <T extends Array<any>>(
  fn: (...args: T) => unknown,
  wait: number
) => {
  let isCalled = false;

  return (...args: T) => {
    if (!isCalled) {
      fn(...args);
      isCalled = true;
      setTimeout(function () {
        isCalled = false;
      }, wait);
    }
  };
};

// by default relay is only scheduling cache garbage collection once a query is retained
// as our queries are long living and update more often, garbage collection should be scheduled more often.
// see https://github.com/facebook/relay/issues/3165
const attachNotifyGarbageCollectionBehaviourToStore = (store: Store): Store => {
  const notify = store.notify.bind(store);

  const scheduleGarbageCollection = throttle(
    store.scheduleGC.bind(store),
    5000
  );

  const newNotify: Store["notify"] = (...args) => {
    scheduleGarbageCollection();

    return notify(...args);
  };

  store.notify = newNotify;

  return store;
};

export const createRelayEnvironment = (
  networkInterface: SocketIOGraphQLClient<GraphQLResponse>
) => {
  const execute = (request: RequestParameters, variables: Variables) => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;
    const applyLiveQueryPatch = createApplyLiveQueryPatch();

    return Observable.create<GraphQLResponse>((sink) =>
      applyAsyncIterableIteratorToSink(
        applyLiveQueryPatch(
          networkInterface.execute({
            operation,
            variables,
            operationName: name,
          })
        ),
        sink
      )
    );
  };

  const network = Network.create(execute, execute);
  const store = attachNotifyGarbageCollectionBehaviourToStore(
    new Store(new RecordSource())
  );

  return new Environment({
    network,
    store,
  });
};
