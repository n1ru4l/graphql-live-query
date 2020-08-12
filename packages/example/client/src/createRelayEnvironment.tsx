import { SocketIONetworkInterface } from "@n1ru4l/socket-io-graphql-network-interface";
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
  networkInterface: SocketIONetworkInterface
) => {
  const fetchQuery: FetchFunction = (request, variables) => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;

    return Observable.create((sink) => {
      const observable = networkInterface({
        query: operation,
        variables: variables,
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
      const observable = networkInterface({
        query: operation,
        variables: variables,
        operationName: name,
      });

      const subscription = observable.subscribe(sink);

      return () => {
        subscription.unsubscribe();
      };
    });
  };

  const environment = new Environment({
    network: Network.create(fetchQuery, setupSubscription),
    store: new Store(new RecordSource()),
  });

  return environment;
};
