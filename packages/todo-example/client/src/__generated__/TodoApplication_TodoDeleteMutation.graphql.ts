/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type TodoApplication_TodoDeleteMutationVariables = {
    id: string;
};
export type TodoApplication_TodoDeleteMutationResponse = {
    readonly todoDelete: {
        readonly __typename: string;
    };
};
export type TodoApplication_TodoDeleteMutation = {
    readonly response: TodoApplication_TodoDeleteMutationResponse;
    readonly variables: TodoApplication_TodoDeleteMutationVariables;
};



/*
mutation TodoApplication_TodoDeleteMutation(
  $id: ID!
) {
  todoDelete(id: $id) {
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
    "concreteType": "TodoRemoveResult",
    "kind": "LinkedField",
    "name": "todoDelete",
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
    "name": "TodoApplication_TodoDeleteMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TodoApplication_TodoDeleteMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "35b50d1fc2241a5a74942415b7baef59",
    "id": null,
    "metadata": {},
    "name": "TodoApplication_TodoDeleteMutation",
    "operationKind": "mutation",
    "text": "mutation TodoApplication_TodoDeleteMutation(\n  $id: ID!\n) {\n  todoDelete(id: $id) {\n    __typename\n  }\n}\n"
  }
};
})();
(node as any).hash = 'af3144c3504167c2a42f1205699e1d98';
export default node;
