export const siteContent = /* HTML */ `
  <!--
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
-->
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          height: 100%;
          margin: 0;
          width: 100%;
          overflow: hidden;
        }

        #graphiql {
          height: 100vh;
        }
      </style>

      <!--
      This GraphiQL example depends on Promise and fetch, which are available in
      modern browsers, but can be "polyfilled" for older browsers.
      GraphiQL itself depends on React DOM.
      If you do not want to rely on a CDN, you can host these files locally or
      include them directly in your favored resource bunder.
    -->
      <script
        crossorigin
        src="https://unpkg.com/react@16/umd/react.development.js"
      ></script>
      <script
        crossorigin
        src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"
      ></script>
      <script
        crossorigin
        src="https://unpkg.com/graphiql/graphiql.min.js"
      ></script>
      <script
        crossorigin
        src="https://unpkg.com/socket.io-client/dist/socket.io.dev.js"
      ></script>
      <!--
      These two files can be found in the npm module, however you may wish to
      copy them directly into your environment, or perhaps include them in your
      favored resource bundler.
     -->
      <link
        rel="stylesheet"
        href="https://unpkg.com/graphiql/graphiql.min.css"
      />
    </head>

    <body>
      <div id="graphiql">Loading...</div>

      <script>
        // Simple transport layer that uses WebSockets
        const socket = io();
        const responseHandlers = new Map();

        let currentOperationId = 0;

        socket.on("graphql/result", ({ id, ...result }) => {
          const handler = responseHandlers.get(id);
          handler?.(result);
        });

        const graphQLFetcher = ({ query: operation, variables, ...rest }) => {
          const operationId = currentOperationId;
          currentOperationId = currentOperationId + 1;

          return {
            subscribe: (next, error, complete) => {
              // for the introspection query we get a object with next, error, complete on it instead
              // is this a bug?
              if (typeof next === "function") {
                responseHandlers.set(operationId, next);
              } else {
                responseHandlers.set(operationId, next.next);
              }

              socket.emit("graphql/execute", {
                id: operationId,
                operation,
                variables,
              });

              return {
                unsubscribe: () => {
                  responseHandlers.delete(operationId);
                },
              };
            },
          };
        };

        ReactDOM.render(
          React.createElement(GraphiQL, {
            fetcher: graphQLFetcher,
            defaultVariableEditorOpen: true,
            query: \`query users @live {
  latestUsers: users(limit: 10) {
    id
    name
  }
}\`,
          }),
          document.getElementById("graphiql")
        );
      </script>
    </body>
  </html>
`;
