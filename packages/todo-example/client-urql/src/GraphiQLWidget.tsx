import * as React from "react";
import GraphiQL, { Fetcher } from "graphiql";
import "graphiql/graphiql.css";
import "./GraphiQLWidget.css";

type GraphiQLWidgetState = "show" | "hidden";

export const GraphiQLWidget: React.FunctionComponent<{ fetcher: Fetcher }> = (
  props
) => {
  const [widgetState, setWidgetState] =
    React.useState<GraphiQLWidgetState>("hidden");

  if (widgetState === "hidden") {
    return (
      <button
        style={{ position: "absolute", top: 5, right: 5 }}
        onClick={() => setWidgetState("show")}
      >
        Show
      </button>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      }}
    >
      <GraphiQL
        fetcher={props.fetcher}
        toolbar={{
          additionalContent: (
            <GraphiQL.Button
              title="Hide GraphiQL"
              label="Hide GraphiQL"
              onClick={() => setWidgetState("hidden")}
            />
          ),
        }}
      />
    </div>
  );
};
