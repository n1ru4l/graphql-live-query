/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type TodoApplication_data = {
    readonly todos: ReadonlyArray<{
        readonly id: string;
        readonly " $fragmentRefs": FragmentRefs<"TodoApplication_todo">;
    }>;
    readonly " $refType": "TodoApplication_data";
};
export type TodoApplication_data$data = TodoApplication_data;
export type TodoApplication_data$key = {
    readonly " $data"?: TodoApplication_data$data;
    readonly " $fragmentRefs": FragmentRefs<"TodoApplication_data">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TodoApplication_data",
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
          "args": null,
          "kind": "FragmentSpread",
          "name": "TodoApplication_todo"
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Query",
  "abstractKey": null
};
(node as any).hash = 'f2f6f8622723227b2ad2f7dfbbe7d5d9';
export default node;
