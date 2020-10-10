import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import {
  createClient,
  Exchange,
  makeErrorResult,
  OperationResult,
  Operation,
  makeResult,
} from "urql";
import { pipe, make, mergeMap, share, filter, takeUntil, Source } from "wonka";
import { print } from "graphql";

export const createUrqlClient = (networkInterface: SocketIOGraphQLClient) => {
  const socketIOGraphQLUrglExchange: Exchange = ({ client }) => {
    const createSubscriptionSource = (
      operation: Operation
    ): Source<OperationResult> => {
      const observableish = networkInterface.execute({
        operation: print(operation.query),
        variables: operation.variables,
      });

      return make<OperationResult>(({ next, complete }) => {
        let isComplete = false;
        let sub: null | { unsubscribe: () => void } = null;

        sub = observableish.subscribe({
          next: (result) => next(makeResult(operation, result)),
          error: (err) => next(makeErrorResult(operation, err)),
          complete: () => {
            if (!isComplete) {
              isComplete = true;
              if (operation.operationName === "subscription") {
                client.reexecuteOperation({
                  ...operation,
                  operationName: "teardown",
                });
              }

              complete();
            }
          },
        });

        return () => {
          isComplete = true;
          if (sub) sub.unsubscribe();
        };
      });
    };

    return (operations$) => {
      const sharedOps$ = share(operations$);
      return pipe(
        sharedOps$,
        mergeMap((operation) => {
          console.log(
            "Why is this called a lot, with 'teardown' and 'query'?",
            operation
          );

          const { key } = operation;
          const teardown$ = pipe(
            sharedOps$,
            filter((op) => op.operationName === "teardown" && op.key === key)
          );

          return pipe(
            createSubscriptionSource(operation),
            takeUntil(teardown$)
          );
        })
      );
    };
  };

  return createClient({
    url: "noop",
    exchanges: [socketIOGraphQLUrglExchange],
  });
};
