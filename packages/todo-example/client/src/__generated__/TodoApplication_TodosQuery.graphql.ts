/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type TodoApplication_TodosQueryVariables = {};
export type TodoApplication_TodosQueryResponse = {
    readonly " $fragmentRefs": FragmentRefs<"TodoApplication_data">;
};
export type TodoApplication_TodosQuery = {
    readonly response: TodoApplication_TodosQueryResponse;
    readonly variables: TodoApplication_TodosQueryVariables;
};



/*
query TodoApplication_TodosQuery @live {
  ...TodoApplication_data
}

fragment TodoApplication_data on Query {
  todos {
    id
    ...TodoApplication_todo
  }
}

fragment TodoApplication_todo on Todo {
  id
  content
  isCompleted
}
*/

const node: ConcreteRequest = {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "TodoApplication_TodosQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "TodoApplication_data"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "TodoApplication_TodosQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Todo",
        "kind": "LinkedField",
        "name": "todos",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "content",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isCompleted",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "57796fe900f74640fafc90793f173838",
    "id": null,
    "metadata": {},
    "name": "TodoApplication_TodosQuery",
    "operationKind": "query",
    "text": "query TodoApplication_TodosQuery @live {\n  ...TodoApplication_data\n}\n\nfragment TodoApplication_data on Query {\n  todos {\n    id\n    ...TodoApplication_todo\n  }\n}\n\nfragment TodoApplication_todo on Todo {\n  id\n  content\n  isCompleted\n}\n"
  }
};
(node as any).hash = 'c06af8ea83b8c2fe568233f5e290b95a';
export default node;
