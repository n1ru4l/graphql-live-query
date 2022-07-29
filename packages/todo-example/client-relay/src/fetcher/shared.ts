import { applyLiveQueryJSONDiffPatch } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import {
  applyAsyncIterableIteratorToSink,
  Sink,
} from "@n1ru4l/push-pull-async-iterable-iterator";

export function applySourceToSink(
  source: AsyncIterableIterator<any>,
  sink: Sink<any, any>
): () => void {
  return applyAsyncIterableIteratorToSink(
    applyLiveQueryJSONDiffPatch(source),
    sink
  );
}
