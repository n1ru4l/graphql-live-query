import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import {
  Environment,
  Network,
  RecordSource,
  Store,
  FetchFunction,
  SubscribeFunction,
  Observable,
} from "relay-runtime";

export const createRelayEnvironment = (
  networkInterface: SocketIOGraphQLClient
) => {
  const fetchQuery: FetchFunction = (request, variables) => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;

    return Observable.create((sink) => {
      const observable = networkInterface.execute({
        operation,
        variables,
        operationName: name,
      });

      const subscription = observable.subscribe(sink);

      return () => {
        subscription.unsubscribe();
      };
    });
  };

  const setupSubscription: SubscribeFunction = (request, variables) => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;

    return Observable.create((sink) => {
      const observable = networkInterface.execute({
        operation,
        variables: variables,
        operationName: name,
      });

      const subscription = observable.subscribe(sink);

      return () => {
        subscription.unsubscribe();
      };
    });
  };

  const store = new Store(new RecordSource());

  // setInterval(() => {
  //   console.log(Object.entries(store.getSource().toJSON()));
  // }, 1000);

  const environment = new Environment({
    network: Network.create(fetchQuery, setupSubscription),
    store: store,
  });

  return environment;
};
