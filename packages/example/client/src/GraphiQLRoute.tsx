import * as React from "react";
import GraphiQL from "graphiql";
import { Global, css } from "@emotion/react";
import "graphiql/graphiql.css";

export const GraphiQLRoute: React.FunctionComponent<{ fetcher: any }> = (
  props
) => {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Global
        styles={css`
          .graphiql-container * {
            box-sizing: content-box;
          }
        `}
      />
      <GraphiQL fetcher={props.fetcher} />
    </div>
  );
};
