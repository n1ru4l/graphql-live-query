/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type TodoApplication_TodoToggleIsCompletedMutationVariables = {
    id: string;
};
export type TodoApplication_TodoToggleIsCompletedMutationResponse = {
    readonly todoToggleIsCompleted: {
        readonly __typename: string;
    };
};
export type TodoApplication_TodoToggleIsCompletedMutation = {
    readonly response: TodoApplication_TodoToggleIsCompletedMutationResponse;
    readonly variables: TodoApplication_TodoToggleIsCompletedMutationVariables;
};



/*
mutation TodoApplication_TodoToggleIsCompletedMutation(
  $id: ID!
) {
  todoToggleIsCompleted(id: $id) {
    __typename
  }
}
*/

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "TodoToggleIsCompletedResult",
    "kind": "LinkedField",
    "name": "todoToggleIsCompleted",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TodoApplication_TodoToggleIsCompletedMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TodoApplication_TodoToggleIsCompletedMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "63dbe667331613cd11ae75c81ba1a047",
    "id": null,
    "metadata": {},
    "name": "TodoApplication_TodoToggleIsCompletedMutation",
    "operationKind": "mutation",
    "text": "mutation TodoApplication_TodoToggleIsCompletedMutation(\n  $id: ID!\n) {\n  todoToggleIsCompleted(id: $id) {\n    __typename\n  }\n}\n"
  }
};
})();
(node as any).hash = '870d3a9b9731d8f2ff2aaefdf1c631b7';
export default node;
