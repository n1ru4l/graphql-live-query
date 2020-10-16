import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLSchema,
  GraphQLList,
} from "graphql";
import { GraphQLLiveDirective } from "@n1ru4l/graphql-live-query";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";

type Todo = {
  id: string;
  content: string;
  isCompleted: boolean;
};

type Root = {
  todos: Map<string, Todo>;
};

type Context = {
  liveQueryStore: InMemoryLiveQueryStore;
};

const GraphQLTodoType = new GraphQLObjectType<Todo>({
  name: "Todo",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: (todo) => todo.id,
    },
    content: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (todo) => todo.content,
    },
    isCompleted: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (todo) => todo.isCompleted,
    },
  },
});

const GraphQLQueryType = new GraphQLObjectType<Root>({
  name: "Query",
  fields: {
    todos: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLTodoType))
      ),
      resolve: (root, args, context) => Array.from(root.todos.values()),
    },
  },
});

const GraphQLTodoAddResultType = new GraphQLObjectType({
  name: "TodoAddResult",
  fields: {
    addedTodo: {
      type: new GraphQLNonNull(GraphQLTodoType),
    },
  },
});

const GraphQLTodoRemoveResultType = new GraphQLObjectType({
  name: "TodoRemoveResult",
  fields: {
    removedTodoId: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
});

const GraphQLTodoToggleIsCompletedResultType = new GraphQLObjectType({
  name: "TodoToggleIsCompletedResult",
  fields: {
    toggledTodo: {
      type: new GraphQLNonNull(GraphQLTodoType),
    },
  },
});

const GraphQLTodoChangeContentResultType = new GraphQLObjectType({
  name: "TodoChangeContentResult",
  fields: {
    changedTodo: {
      type: new GraphQLNonNull(GraphQLTodoType),
    },
  },
});

const GraphQLMutationType = new GraphQLObjectType<Root, Context>({
  name: "Mutation",
  fields: {
    todoAdd: {
      type: new GraphQLNonNull(GraphQLTodoAddResultType),
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        content: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: (root, args, context) => {
        // Skip if it has already been added by another person.
        if (root.todos.has(args.id)) {
          throw new Error("Todo does already exist.");
        }
        const addedTodo = {
          id: args.id,
          content: args.content,
          isCompleted: false,
        };
        root.todos.set(args.id, addedTodo);
        context.liveQueryStore.invalidate(`Query.todos`);
        return {
          addedTodo,
        };
      },
    },
    todoDelete: {
      type: new GraphQLNonNull(GraphQLTodoRemoveResultType),
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
      },
      resolve: (root, args, context) => {
        root.todos.delete(args.id);
        context.liveQueryStore.invalidate(`Query.todos`);
        return {
          removedTodoId: args.id,
        };
      },
    },
    todoToggleIsCompleted: {
      type: new GraphQLNonNull(GraphQLTodoToggleIsCompletedResultType),
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
      },
      resolve: (root, args, context) => {
        const todo = root.todos.get(args.id);
        if (!todo) {
          throw new Error(`Todo with id '${args.id}' does not exist.`);
        }
        todo.isCompleted = !todo.isCompleted;
        context.liveQueryStore.invalidate(`Todo:${args.id}`);
        return {
          toggledTodo: todo,
        };
      },
    },
    todoChangeContent: {
      type: new GraphQLNonNull(GraphQLTodoChangeContentResultType),
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        content: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: (root, args, context) => {
        const todo = root.todos.get(args.id);
        if (!todo) {
          throw new Error(`Todo with id '${args.id}' does not exist.`);
        }
        todo.content = args.content;
        context.liveQueryStore.invalidate(`Todo:${args.id}`);
        return {
          changedTodo: todo,
        };
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: GraphQLQueryType,
  mutation: GraphQLMutationType,
  directives: [GraphQLLiveDirective],
});
