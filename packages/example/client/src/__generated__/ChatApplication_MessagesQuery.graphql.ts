/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ChatApplication_MessagesQueryVariables = {};
export type ChatApplication_MessagesQueryResponse = {
    readonly messages: ReadonlyArray<{
        readonly id: string;
        readonly " $fragmentRefs": FragmentRefs<"ChatApplication_message">;
    }>;
};
export type ChatApplication_MessagesQuery = {
    readonly response: ChatApplication_MessagesQueryResponse;
    readonly variables: ChatApplication_MessagesQueryVariables;
};



/*
query ChatApplication_MessagesQuery @live {
  messages(limit: 10) {
    id
    ...ChatApplication_message
  }
}

fragment ChatApplication_message on Message {
  id
  content
  author {
    id
    name
  }
}
*/

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "kind": "Literal",
    "name": "limit",
    "value": 10
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "ChatApplication_MessagesQuery",
    "selections": [
      {
        "alias": null,
        "args": (v0/*: any*/),
        "concreteType": "Message",
        "kind": "LinkedField",
        "name": "messages",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "ChatApplication_message"
          }
        ],
        "storageKey": "messages(limit:10)"
      }
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "ChatApplication_MessagesQuery",
    "selections": [
      {
        "alias": null,
        "args": (v0/*: any*/),
        "concreteType": "Message",
        "kind": "LinkedField",
        "name": "messages",
        "plural": true,
        "selections": [
          (v1/*: any*/),
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
            "concreteType": "User",
            "kind": "LinkedField",
            "name": "author",
            "plural": false,
            "selections": [
              (v1/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "name",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": "messages(limit:10)"
      }
    ]
  },
  "params": {
    "cacheID": "5bc496627ce8a3eb585ac936bd5463f6",
    "id": null,
    "metadata": {},
    "name": "ChatApplication_MessagesQuery",
    "operationKind": "query",
    "text": "query ChatApplication_MessagesQuery @live {\n  messages(limit: 10) {\n    id\n    ...ChatApplication_message\n  }\n}\n\nfragment ChatApplication_message on Message {\n  id\n  content\n  author {\n    id\n    name\n  }\n}\n"
  }
};
})();
(node as any).hash = 'e6d813196675afde31f7ddb4f92377c5';
export default node;
