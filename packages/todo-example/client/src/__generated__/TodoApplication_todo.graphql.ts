/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type TodoApplication_todo = {
    readonly id: string;
    readonly content: string;
    readonly isCompleted: boolean;
    readonly " $refType": "TodoApplication_todo";
};
export type TodoApplication_todo$data = TodoApplication_todo;
export type TodoApplication_todo$key = {
    readonly " $data"?: TodoApplication_todo$data;
    readonly " $fragmentRefs": FragmentRefs<"TodoApplication_todo">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TodoApplication_todo",
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
  "type": "Todo",
  "abstractKey": null
};
(node as any).hash = 'c437b1ec15cb1ac2cfee7c9bdf9d5395';
export default node;
