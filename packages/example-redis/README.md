# Redis Live Query Example

This example shows how you can distribute live query invalidation events across multiple live query store servers.

## Instructions

### Start Redis Container

```
docker run -p "6379:6379" redis:7.0.2
```

### Start GraphQL HTTP Server Instance 1

```
npx cross-env PORT=3000 yarn start
```

### Start GraphQL HTTP Server Instance 2

```
npx cross-env PORT=3001 yarn start
```

## Demo

Open the following links and execute the live query:

1. http://127.0.0.1:3001/graphql?query=query+%40live+%7B%0A++counter%0A%7D%0A

2. http://127.0.0.1:3000/graphql?query=query+%40live+%7B%0A++counter%0A%7D%0A

**Note:** Each of the live queries is executed on a different HTTP server (see the port)

Open http://127.0.0.1:3001/graphql?query=mutation+%7B%0A++increment%0A%7D

Execute the mutation operation.

See how all the live query results are updated automatically

**Bonus:**

1. Get the container id

```bash
% docker ps
CONTAINER ID   IMAGE         COMMAND                  CREATED          STATUS          PORTS                    NAMES
06239a997e72   redis:7.0.2   "docker-entrypoint.s…"   12 minutes ago   Up 12 minutes   0.0.0.0:6379->6379/tcp   gallant_mirzakhani
```

2. Monitor the redis commands being executed

```bash
% docker exec -ti 06239a997e72 redis-cli MONITOR
OK
```

3. Execute the mutation and observer the redis-cli output

```
% docker exec -ti 06239a997e72 redis-cli MONITOR
OK
1663236183.245626 [0 172.17.0.1:62562] "incr" "counter"
1663236183.247329 [0 172.17.0.1:62562] "publish" "live-query-invalidations" "Query.counter"
1663236183.249530 [0 172.17.0.1:62562] "get" "counter"
1663236183.249542 [0 172.17.0.1:62560] "get" "counter"
```
