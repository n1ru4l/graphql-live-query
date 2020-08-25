import type { LiveQueryStore } from "@n1ru4l/graphql-live-query";
import { deflateGraphQLExecutionResult } from "@n1ru4l/graphql-result-normalizer";

import { compare } from "fast-json-patch";
import type { ExecutionResult } from "graphql";

export const applyTransportOptimizerTrait = (
  store: LiveQueryStore
): LiveQueryStore => {
  const originalRegisterProperty: typeof store.register = store.register.bind(
    store
  );

  const newRegisterProperty: typeof store.register = (
    operationDocument,
    operationVariables,
    executeQuery,
    publishUpdate
  ) => {
    let lastState: any = null;

    const newPublishUpdate = (executionResult: ExecutionResult) => {
      const data = deflateGraphQLExecutionResult(executionResult);

      if (lastState) {
        const patch = compare(lastState, data);

        publishUpdate(executionResult, {
          __type: "patch",
          patch,
        });
      } else {
        publishUpdate(executionResult, {
          __type: "initial",
          data,
        });
      }

      lastState = data;
    };

    return originalRegisterProperty(
      operationDocument,
      operationVariables,
      executeQuery,
      newPublishUpdate
    );
  };

  store.register = newRegisterProperty;

  return store;
};
