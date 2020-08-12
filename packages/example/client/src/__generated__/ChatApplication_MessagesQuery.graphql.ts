/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ChatApplication_MessagesQueryVariables = {};
export type ChatApplication_MessagesQueryResponse = {
    readonly messages: ReadonlyArray<{
        readonly id: string;
        readonly " $fragmentRefs": FragmentRefs<"ChatApplication_ChatMessageFragment">;
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
    ...ChatApplication_ChatMessageFragment
  }
}

fragment ChatApplication_ChatMessageFragment on Message {
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
            "name": "ChatApplication_ChatMessageFragment"
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
    "cacheID": "ed15e79d40a20f7e984ad778f6a8d816",
    "id": null,
    "metadata": {},
    "name": "ChatApplication_MessagesQuery",
    "operationKind": "query",
    "text": "query ChatApplication_MessagesQuery @live {\n  messages(limit: 10) {\n    id\n    ...ChatApplication_ChatMessageFragment\n  }\n}\n\nfragment ChatApplication_ChatMessageFragment on Message {\n  id\n  content\n  author {\n    id\n    name\n  }\n}\n"
  }
};
})();
(node as any).hash = '94276488f026c4bf64230eb1ef57d861';
export default node;
