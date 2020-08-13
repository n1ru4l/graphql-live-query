/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ChatApplication_message = {
    readonly id: string;
    readonly content: string;
    readonly author: {
        readonly id: string;
        readonly name: string;
    };
    readonly " $refType": "ChatApplication_message";
};
export type ChatApplication_message$data = ChatApplication_message;
export type ChatApplication_message$key = {
    readonly " $data"?: ChatApplication_message$data;
    readonly " $fragmentRefs": FragmentRefs<"ChatApplication_message">;
};



const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ChatApplication_message",
  "selections": [
    (v0/*: any*/),
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
        (v0/*: any*/),
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
  "type": "Message",
  "abstractKey": null
};
})();
(node as any).hash = 'fb572e6731ae8c212864f61d34b4e1b5';
export default node;
