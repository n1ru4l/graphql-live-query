/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type TodoApplication_TodoChangeContentMutationVariables = {
    id: string;
    content: string;
};
export type TodoApplication_TodoChangeContentMutationResponse = {
    readonly todoChangeContent: {
        readonly __typename: string;
    };
};
export type TodoApplication_TodoChangeContentMutation = {
    readonly response: TodoApplication_TodoChangeContentMutationResponse;
    readonly variables: TodoApplication_TodoChangeContentMutationVariables;
};



/*
mutation TodoApplication_TodoChangeContentMutation(
  $id: ID!
  $content: String!
) {
  todoChangeContent(id: $id, content: $content) {
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
    "concreteType": "TodoChangeContentResult",
    "kind": "LinkedField",
    "name": "todoChangeContent",
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
    "name": "TodoApplication_TodoChangeContentMutation",
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
    "name": "TodoApplication_TodoChangeContentMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "d210187ae05c6dcbab894e465d523b8f",
    "id": null,
    "metadata": {},
    "name": "TodoApplication_TodoChangeContentMutation",
    "operationKind": "mutation",
    "text": "mutation TodoApplication_TodoChangeContentMutation(\n  $id: ID!\n  $content: String!\n) {\n  todoChangeContent(id: $id, content: $content) {\n    __typename\n  }\n}\n"
  }
};
})();
(node as any).hash = '2d46d8a65fe8ca2b92ae7d90ef35e0f9';
export default node;
