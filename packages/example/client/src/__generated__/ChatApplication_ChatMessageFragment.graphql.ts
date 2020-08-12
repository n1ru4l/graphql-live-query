/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ChatApplication_ChatMessageFragment = {
    readonly id: string;
    readonly content: string;
    readonly author: {
        readonly id: string;
        readonly name: string;
    };
    readonly " $refType": "ChatApplication_ChatMessageFragment";
};
export type ChatApplication_ChatMessageFragment$data = ChatApplication_ChatMessageFragment;
export type ChatApplication_ChatMessageFragment$key = {
    readonly " $data"?: ChatApplication_ChatMessageFragment$data;
    readonly " $fragmentRefs": FragmentRefs<"ChatApplication_ChatMessageFragment">;
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
  "name": "ChatApplication_ChatMessageFragment",
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
(node as any).hash = 'ce893fd2b5a48bbbc2b37a2a4cb93b59';
export default node;
