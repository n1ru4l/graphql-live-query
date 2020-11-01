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
} from "graphql";
import { isAsyncIterable } from "./isAsyncIterable";

export type PromiseOrPlain<T> = T | Promise<T>;

type DocumentSourceString = string;
type MaybeDocumentNode = Record<string, unknown> | DocumentNode;

const isDocumentNode = (input: MaybeDocumentNode): input is DocumentNode => {
  return input["kind"] === "Document" && Array.isArray(input["definitions"]);
};

export type ExecuteFunction = (
  args: ExecutionArgs
) => PromiseOrPlain<AsyncIterableIterator<ExecutionResult> | ExecutionResult>;

export type GetParameterFunctionParameter = {
  socket: SocketIO.Socket;
  graphQLPayload: {
    source: DocumentSourceString | MaybeDocumentNode;
    variableValues: { [key: string]: any } | null;
    operationName: string | null;
  };
};

export type GetParameterFunction = (
  parameter: GetParameterFunctionParameter
) => PromiseOrPlain<{
  graphQLExecutionParameter: {
    schema: GraphQLSchema;
    contextValue?: unknown;
    rootValue?: unknown;
    // These will be overwritten if provided; Useful for persisted queries etc.
    operationName?: string;
    source?: string | DocumentNode;
    variableValues?: { [key: string]: any } | null;
  };
  execute?: ExecuteFunction;
  subscribe?: typeof defaultSubscribe;

  parse?: typeof defaultParse;
  validateSchema?: typeof defaultValidateSchema;
  validate?: typeof defaultValidate;
}>;

const isSubscriptionOperation = (ast: DocumentNode) =>
  !!ast.definitions.find(
    (def) =>
      def.kind === "OperationDefinition" && def.operation === "subscription"
  );

type MessagePayload = {
  id: number;
  operation: DocumentSourceString | MaybeDocumentNode;
  variables: { [key: string]: any } | null;
  operationName: string | null;
};

const decodeMessage = (message: unknown): MessagePayload | Error => {
  let id: number;
  let operation: DocumentSourceString | MaybeDocumentNode | null = null;
  let variables: { [key: string]: any } | null = null;
  let operationName: string | null = null;

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

    return {
      id,
      operation,
      variables,
      operationName,
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
  socketServer: SocketIO.Server;
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
  registerSocket: (socket: SocketIO.Socket) => UnsubscribeHandler;
  /* dispose a single socket */
  disposeSocket: (socket: SocketIO.Socket) => void;
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
  const disposeHandlers = new Map<SocketIO.Socket, UnsubscribeHandler>();
  const registerSocket = (socket: SocketIO.Socket) => {
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
      } = message;

      const {
        graphQLExecutionParameter,
        subscribe = defaultSubscribe,
        execute = defaultExecute,
        parse = defaultParse,
        validateSchema = defaultValidateSchema,
        validate = defaultValidate,
      } = await getParameter({
        socket,
        graphQLPayload: {
          source,
          variableValues,
          operationName,
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
        documentAst
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
        if (isAsyncIterable(result)) {
          subscriptions.set(id, () => result.return?.(null));
          for await (const subscriptionResult of result) {
            socket.emit("@graphql/result", { ...subscriptionResult, id });
          }
        } else {
          emitFinalResult(result);
        }
      };

      let executionResult: PromiseOrPlain<
        ExecutionResult | AsyncIterableIterator<ExecutionResult>
      >;

      try {
        if (isSubscriptionOperation(documentAst)) {
          executionResult = await subscribe({
            ...executionParameter,
            document: documentAst,
          });
        } else {
          executionResult = execute(executionParameter);
        }
      } catch (contextError) {
        executionResult = {
          errors: [contextError],
        };
      }

      Promise.resolve(executionResult)
        .then((result) => {
          if (isAsyncIterable(result)) {
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
    registerSocket: (socket: SocketIO.Socket) =>
      disposeHandlers.get(socket) ?? registerSocket(socket),
    disposeSocket: (socket: SocketIO.Socket) => disposeHandlers.get(socket)?.(),
    destroy: () => {
      socketServer.off("connection", registerSocket);
      for (const dispose of disposeHandlers.values()) {
        dispose();
      }
    },
  };
};
