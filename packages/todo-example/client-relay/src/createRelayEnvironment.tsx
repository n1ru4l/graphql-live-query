import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
// import { createApplyLiveQueryPatch } from "@n1ru4l/graphql-live-query-patch";
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
  GraphQLSingularResponse,
} from "relay-runtime";
import { dset } from "dset/merge";

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

/**
 * This is a experimental middleware that tries to apply executiob results
 * that have a `isLive` and `path` property to the existing execution result using `dset/merge`.
 *
 * experimental_isNodeInterfaceMode: true does currrently not work with the json-patch middleware
 */
const middleware = async function* (
  asyncIterable: AsyncIterableIterator<GraphQLSingularResponse>
) {
  let latestValue: GraphQLSingularResponse | null = null;
  for await (const result of asyncIterable) {
    // in case no result is live any other result wont be live either and we can forward everything
    if (!(result as any)["isLive"]) {
      yield result;
      yield* asyncIterable;
      return;
    }

    if (!latestValue) {
      latestValue = result;
    } else if ("path" in result) {
      // if we get a path property we apply the patch at a given path to our latest execution result
      dset(latestValue.data!, result["path"]!, result.data);
    } else {
      latestValue = result;
    }

    yield latestValue;
  }
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
  networkInterface: SocketIOGraphQLClient<GraphQLSingularResponse>
) => {
  const execute = (request: RequestParameters, variables: Variables) => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;
    // const applyLiveQueryPatch = createApplyLiveQueryPatch();

    return Observable.create<GraphQLResponse>((sink) =>
      applyAsyncIterableIteratorToSink(
        // applyLiveQueryPatch(
        middleware(
          networkInterface.execute({
            operation,
            variables,
            operationName: name,
          })
        ),
        // ),
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
