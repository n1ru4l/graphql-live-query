import {
  DocumentNode,
  GraphQLSchema,
  visit,
  isObjectType,
  isInterfaceType,
  GraphQLInterfaceType,
  SelectionSetNode,
  parse,
  FieldNode,
  GraphQLObjectType,
  visitWithTypeInfo,
  TypeInfo,
  GraphQLType,
  isListType,
  isNonNullType,
} from "graphql";
import { isNone } from "./Maybe";

const getNodeInterfaceTypeFromSchema = (schema: GraphQLSchema) => {
  const nodeInterfaceType = schema.getType("Node");
  if (isNone(nodeInterfaceType)) {
    throw new Error("Schema does not implement the Node interface.");
  }
  if (isInterfaceType(nodeInterfaceType) === false) {
    throw new Error("Schema does not implement the Node interface.");
  }

  return nodeInterfaceType as GraphQLInterfaceType;
};

const getWrappedType = (graphQLType: GraphQLType): GraphQLType => {
  if (isListType(graphQLType) || isNonNullType(graphQLType)) {
    return getWrappedType(graphQLType.ofType);
  }
  return graphQLType;
};

const getOperationBase = () =>
  parse(/* GraphQL */ `
    query liveNode($id: ID!) {
      node(id: $id) {
        __typename
      }
    }
  `);

const buildNodeInterfaceQuery = (
  typeName: string,
  selectionSet: SelectionSetNode
) =>
  visit(getOperationBase(), {
    Field(fieldNode) {
      if (fieldNode.name.value === "node") {
        const field: FieldNode = {
          ...fieldNode,
          selectionSet: {
            kind: "SelectionSet",
            selections: [
              {
                kind: "InlineFragment",
                typeCondition: {
                  kind: "NamedType",
                  name: {
                    kind: "Name",
                    value: typeName,
                  },
                },
                selectionSet,
              },
            ],
          },
        };

        return field;
      }
    },
  });

/**
 * Extract documents from a graphql query operation that can be executed on the `Query.node` field.
 * See `buildNodeInterfaceRefetchQueryDocuments.spec.ts` an overview of the API.
 * This function assumes that both the schema and the operation have passed GraphQL validation and implement the interface Node type and Query.node(id:) field.
 */
export const buildNodeInterfaceRefetchQueryDocuments = (
  schema: GraphQLSchema,
  operationAST: DocumentNode,
  operationName?: string
): Map<string, DocumentNode> => {
  const queryDocuments = new Map<string, DocumentNode>();

  const nodeInterfaceType = getNodeInterfaceTypeFromSchema(schema);

  const typeInfo = new TypeInfo(schema);

  const isObjectTypeThatImplementsNodeInterface = (
    graphQLType: GraphQLType
  ): graphQLType is GraphQLObjectType =>
    isObjectType(graphQLType) &&
    graphQLType.getInterfaces().includes(nodeInterfaceType);

  const stack: Array<string> = [];
  visit(
    operationAST,
    visitWithTypeInfo(typeInfo, {
      OperationDefinition(node) {
        if (node.operation !== "query" || node.name !== operationName) {
          return false;
        }
      },
      Field: {
        enter(node) {
          const fieldInfo = typeInfo.getFieldDef();
          stack.push(node.name.value);
          const fieldType = getWrappedType(fieldInfo.type);

          if (isObjectTypeThatImplementsNodeInterface(fieldType)) {
            const newNode = visit(
              node.selectionSet!,
              visitWithTypeInfo(typeInfo, {
                Field() {
                  const fieldInfo = typeInfo.getFieldDef();
                  const fieldType = getWrappedType(fieldInfo.type);
                  if (isObjectTypeThatImplementsNodeInterface(fieldType)) {
                    return null;
                  }
                },
              })
            );
            queryDocuments.set(
              stack.join("."),
              buildNodeInterfaceQuery(fieldType.name, newNode)
            );
          }
        },
        leave() {
          stack.pop();
        },
      },
    })
  );

  return queryDocuments;
};
