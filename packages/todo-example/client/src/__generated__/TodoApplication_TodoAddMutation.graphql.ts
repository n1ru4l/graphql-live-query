/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type TodoApplication_TodoAddMutationVariables = {
    id: string;
    content: string;
};
export type TodoApplication_TodoAddMutationResponse = {
    readonly todoAdd: {
        readonly __typename: string;
    };
};
export type TodoApplication_TodoAddMutation = {
    readonly response: TodoApplication_TodoAddMutationResponse;
    readonly variables: TodoApplication_TodoAddMutationVariables;
};



/*
mutation TodoApplication_TodoAddMutation(
  $id: ID!
  $content: String!
) {
  todoAdd(id: $id, content: $content) {
    __typename
  }
}
*/

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "content"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "content",
        "variableName": "content"
      },
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "TodoAddResult",
    "kind": "LinkedField",
    "name": "todoAdd",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "__typename",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "TodoApplication_TodoAddMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "TodoApplication_TodoAddMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "9068322e656c6da971e8619ed30c8f6a",
    "id": null,
    "metadata": {},
    "name": "TodoApplication_TodoAddMutation",
    "operationKind": "mutation",
    "text": "mutation TodoApplication_TodoAddMutation(\n  $id: ID!\n  $content: String!\n) {\n  todoAdd(id: $id, content: $content) {\n    __typename\n  }\n}\n"
  }
};
})();
(node as any).hash = '9568121754934bfef1af0d892371ee68';
export default node;
