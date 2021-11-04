import {
  execute as defaultExecute,
  subscribe as defaultSubscribe,
  validateSchema as defaultValidateSchema,
  validate as defaultValidate,
  parse as defaultParse,
  GraphQLSchema,
  ExecutionResult,
  ExecutionArgs,
  DocumentNode,
  GraphQLError,
  specifiedRules as defaultValidationRules,
  ValidationRule,
  getOperationAST,
  OperationDefinitionNode,
} from "graphql";
import { isAsyncIterableIterator } from "./isAsyncIterableIterator";
import type { Server as IOServer, Socket as IOSocket } from "socket.io";

export type PromiseOrPlain<T> = T | Promise<T>;

type DocumentSourceString = string;
type MaybeDocumentNode = Record<string, unknown> | DocumentNode;

const isDocumentNode = (input: MaybeDocumentNode): input is DocumentNode => {
  return input["kind"] === "Document" && Array.isArray(input["definitions"]);
};

type PromiseOrValue<T> = T | Promise<T>;

export type ExecuteFunction = (
  args: ExecutionArgs
) => PromiseOrPlain<AsyncIterableIterator<ExecutionResult> | ExecutionResult>;

export type GetParameterFunctionParameter = {
  /* The socket that sends the operation */
  socket: IOSocket;
  /* The GraphQL payload that is sent by the socket. */
  graphQLPayload: {
    /* The source document. Can be a string or object. */
    source: DocumentSourceString | MaybeDocumentNode;
    /* The variables for the source document. */
    variableValues: { [key: string]: any } | null;
    /* The name of the operation that should be executed. */
    operationName: string | null;
    /** Additional extensions that can be used for authentication tokens etc. */
    extensions: { [key: string]: any } | null;
  };
};

/* Function which is invoked for each incoming operation */
export type GetParameterFunction = (
  parameter: GetParameterFunctionParameter
) => PromiseOrPlain<{
  /* The parameters that will be used for executing/subscribing to the operation. */
  graphQLExecutionParameter: {
    /* Executable GraphQL schema (required)*/
    schema: GraphQLSchema;
    /* Execution context that is injected into each resolver. */
    contextValue?: unknown;
    /* Root value that is injected into the root object types. */
    rootValue?: unknown;
    /* Source document. Will overwrite the value sent from the client. */
    source?: DocumentSourceString | DocumentNode;
    /* Variables for the source document. Will overwrite the value sent from the client. */
    variableValues?: { [key: string]: any } | null;
    /* Name of the operation that should be executed. Will overwrite the value sent from the client. */
    operationName?: string;
  };
  /* Function for executing mutation and query operations. Uses `execute` exported from graphql by default. */
  execute?: ExecuteFunction;
  /* Function for executing subscription operations. Uses `subscribe` exported from graphql by default. */
  subscribe?: typeof defaultSubscribe;

  /* Function for parsing GraphQL source documents. Uses `parse` exported from graphql by default. */
  parse?: typeof defaultParse;
  /* Function for validating the GraphQL schema. Uses `validateSchema` exported from graphql by default. */
  validateSchema?: typeof defaultValidateSchema;
  /* Function for validating the GraphQL documents. Uses `validate` exported from graphql by default. */
  validate?: typeof defaultValidate;
  /* Array of validation rules. Uses the `specifiedRules` exported from graphql by default */
  validationRules?: ValidationRule[];
}>;

const isSubscriptionOperation = (def: OperationDefinitionNode) =>
  def.operation === "subscription";

type MessagePayload = {
  id: number;
  operation: DocumentSourceString | MaybeDocumentNode;
  variables: { [key: string]: any } | null;
  operationName: string | null;
  extensions: { [key: string]: any } | null;
};

const decodeMessage = (message: unknown): MessagePayload | Error => {
  let id: number;
  let operation: DocumentSourceString | MaybeDocumentNode | null = null;
  let variables: { [key: string]: any } | null = null;
  let operationName: string | null = null;
  let extensions: { [key: string]: any } | null = null;

  if (typeof message === "object" && message !== null) {
    const maybeId: unknown = (message as any).id;
    if (typeof maybeId === "number") {
      id = maybeId;
    } else {
      return new Error("Invalid message format. Field 'id' is invalid.");
    }
    const maybeOperation: unknown = (message as any).operation;
    if (
      typeof maybeOperation === "string" ||
      (typeof maybeOperation === "object" && maybeOperation !== null)
    ) {
      operation = maybeOperation as DocumentSourceString | MaybeDocumentNode;
    } else {
      return new Error(
        "Invalid message format. Field 'operation' is invalid. Must be DocumentSourceString or DocumentNode."
      );
    }
    const maybeVariables: unknown = (message as any).variables ?? null;
    if (typeof maybeVariables === "object") {
      variables = maybeVariables;
    } else {
      return new Error(
        "Invalid message format. Field 'variableValues' is invalid."
      );
    }
    const maybeOperationName: unknown = (message as any).operationName ?? null;
    if (maybeOperationName === null || typeof maybeOperationName === "string") {
      operationName = maybeOperationName;
    } else {
      return new Error(
        "Invalid message format. Field 'operationName' is invalid."
      );
    }

    const maybeExtensions: unknown = (message as any).extensions ?? null;
    if (typeof maybeExtensions === "object") {
      extensions = maybeExtensions;
    } else {
      return new Error(
        "Invalid message format. Field 'extensions' is invalid."
      );
    }

    return {
      id,
      operation,
      variables,
      operationName,
      extensions,
    };
  }

  return new Error("Invalid message format. Sent message is not an object.");
};

const decodeUnsubscribeMessage = (message: unknown): { id: number } | Error => {
  if (typeof message === "object" && message !== null) {
    const maybeId: unknown = (message as any).id;
    if (typeof maybeId === "number") {
      return { id: maybeId };
    } else {
      return new Error("Invalid message format. Field 'id' is invalid.");
    }
  }

  return new Error("Invalid message format. Sent message is not an object.");
};

export type DecodeErrorHandler = (error: Error) => void;

export type RegisterSocketIOGraphQLServerParameter = {
  socketServer: IOServer;
  /* get the parameters for a incoming GraphQL operation */
  getParameter: GetParameterFunction;
  /* error handler for failed message decoding attempts */
  onMessageDecodeError?: DecodeErrorHandler;
  /* whether the GraphQL layer has to be enabled for each socket explicitly */
  isLazy?: boolean;
};

export type UnsubscribeHandler = () => void;

export type SocketIOGraphQLServer = {
  /* register a single socket */
  registerSocket: (socket: IOSocket) => UnsubscribeHandler;
  /* dispose a single socket */
  disposeSocket: (socket: IOSocket) => void;
  /* dispose all connections and remove all listeners on the socketServer. */
  destroy: () => void;
};

export const registerSocketIOGraphQLServer = ({
  socketServer,
  getParameter,
  onMessageDecodeError = console.error,
  isLazy = false,
}: RegisterSocketIOGraphQLServerParameter): SocketIOGraphQLServer => {
  let acceptNewConnections = true;
  const disposeHandlers = new Map<IOSocket, UnsubscribeHandler>();
  const registerSocket = (socket: IOSocket) => {
    // In case the socket is already registered :)
    const dispose = disposeHandlers.get(socket);
    if (dispose) {
      return dispose;
    }

    const subscriptions = new Map<number, () => void>();

    const executeHandler = async (rawMessage: unknown) => {
      const message = decodeMessage(rawMessage);

      if (message instanceof Error) {
        // TODO: Unify what we should do with this.
        onMessageDecodeError(message);
        return;
      }

      const emitFinalResult = (executionResult: ExecutionResult) =>
        socket.emit("@graphql/result", {
          ...executionResult,
          id,
          isFinal: true,
        });

      const {
        id,
        operation: source,
        variables: variableValues,
        operationName,
        extensions,
      } = message;

      const {
        graphQLExecutionParameter,
        subscribe = defaultSubscribe,
        execute = defaultExecute,
        parse = defaultParse,
        validateSchema = defaultValidateSchema,
        validate = defaultValidate,
        validationRules = defaultValidationRules,
      } = await getParameter({
        socket,
        graphQLPayload: {
          source,
          variableValues,
          operationName,
          extensions,
        },
      });

      // Validate Schema
      const schemaValidationErrors = validateSchema(
        graphQLExecutionParameter.schema
      );
      if (schemaValidationErrors.length > 0) {
        emitFinalResult({ errors: schemaValidationErrors });
        return;
      }

      let documentAst: DocumentNode;

      if (typeof source === "string") {
        // Parse
        try {
          documentAst = parse(source);
        } catch (syntaxError: unknown) {
          emitFinalResult({ errors: [syntaxError as GraphQLError] });
          return;
        }
      } else if (isDocumentNode(source)) {
        documentAst = source;
      } else {
        emitFinalResult({
          errors: [
            new GraphQLError(
              "Invalid DocumentNode. The provided document AST node is invalid."
            ),
          ],
        });
        return;
      }

      // Validate
      const validationErrors = validate(
        graphQLExecutionParameter.schema,
        documentAst,
        validationRules
      );
      if (validationErrors.length > 0) {
        emitFinalResult({
          errors: validationErrors,
        });
        return;
      }

      const executionParameter = {
        document: documentAst,
        operationName,
        source,
        variableValues,
        ...graphQLExecutionParameter,
      };

      const asyncIteratorHandler = async (
        result: AsyncIterableIterator<ExecutionResult> | ExecutionResult
      ) => {
        if (isAsyncIterableIterator(result)) {
          subscriptions.set(id, () => result.return?.());
          for await (const subscriptionResult of result) {
            socket.emit("@graphql/result", { ...subscriptionResult, id });
          }
        } else {
          emitFinalResult(result);
        }
      };

      // TODO: change AsyncIterableIterator to AsyncGenerator once we drop support for GraphQL.js 15
      let executionResult: PromiseOrPlain<
        ExecutionResult | AsyncIterableIterator<any>
      >;

      const mainOperation = getOperationAST(documentAst, operationName);

      if (!mainOperation) {
        executionResult = {
          errors: [new GraphQLError("No executable operation sent.")],
        };
      } else {
        try {
          if (isSubscriptionOperation(mainOperation)) {
            executionResult = await subscribe({
              ...executionParameter,
              document: documentAst,
            });
          } else {
            // TODO: remove type-cast once we drop support for GraphQL.js 15
            executionResult = execute(executionParameter) as PromiseOrValue<
              ExecutionResult | AsyncIterableIterator<ExecutionResult>
            >;
          }
        } catch (contextError) {
          console.error("Unexpected error occurred.", contextError);
          executionResult = {
            errors: [new GraphQLError("A unexpected error occurred.")],
          };
        }
      }

      Promise.resolve(executionResult)
        .then((result) => {
          if (isAsyncIterableIterator(result)) {
            return asyncIteratorHandler(result);
          } else {
            emitFinalResult(result);
          }
        })
        .catch((err) => {
          emitFinalResult({
            errors: [err],
          });
        });
    };

    socket.on("@graphql/execute", executeHandler);

    const unsubscribeHandler = (rawMessage: unknown) => {
      const message = decodeUnsubscribeMessage(rawMessage);
      if (message instanceof Error) {
        // TODO: Unify what we should do with this.
        onMessageDecodeError(message);
        return;
      }
      const id = message.id;
      const subscription = subscriptions.get(id);
      subscription?.();
      subscriptions.delete(id);
    };

    socket.on("@graphql/unsubscribe", unsubscribeHandler);

    const disconnectHandler = () => {
      // Unsubscribe all pending GraphQL Live Queries and Subscriptions
      subscriptions.forEach((unsubscribe) => unsubscribe());
      disposeHandlers.delete(socket);
    };

    socket.once("disconnect", disconnectHandler);

    const disposeHandler = () => {
      socket.off("@graphql/execute", executeHandler);
      socket.off("@graphql/unsubscribe", unsubscribeHandler);
      socket.off("disconnect", disconnectHandler);
      disconnectHandler();
    };

    disposeHandlers.set(socket, disposeHandler);
    return disposeHandler;
  };

  if (isLazy === false && acceptNewConnections === true) {
    socketServer.on("connection", registerSocket);
  }

  return {
    registerSocket: (socket: IOSocket) =>
      disposeHandlers.get(socket) ?? registerSocket(socket),
    disposeSocket: (socket: IOSocket) => disposeHandlers.get(socket)?.(),
    destroy: () => {
      socketServer.off("connection", registerSocket);
      for (const dispose of disposeHandlers.values()) {
        dispose();
      }
    },
  };
};
