import puppeteer from "puppeteer";
import fastify from "fastify";
import fastifyStatic from "fastify-static";
import { createServer as createSocketIOServer } from "../server-socket-io/src/index.js";
import { createServer as createHTTPServer } from "../server-helix/src/main.js";
import { createServer as createYogaServer } from "../server-yoga/src/main.js";
import { createServer as createWSServer } from "../server-ws/src/main.js";

import * as path from "path";

describe.each([
  // prettier-ignore
  "client-relay",
  "client-apollo",
  "client-urql",
])(`end2end %s`, (name) => {
  describe.each([
    ["GraphQL over Socket.io", "socket.io", createSocketIOServer],
    ["GraphQL over SSE (Helix)", "sse", createHTTPServer],
    ["GraphQL over SSE (Yoga)", "sse", createYogaServer],
    ["GraphQL over WebSocket (graphql-ws)", "ws", createWSServer],
  ])("%s", (_, protocol, createServer) => {
    const apiPort = 6167;
    const apiAddress =
      protocol !== "ws"
        ? `http://localhost:${apiPort}`
        : `ws://localhost:${apiPort}`;
    const staticPort = 6168;

    const testPage = `http://localhost:${staticPort}?${protocol}=true&host=${encodeURIComponent(
      apiAddress
    )}`;

    let disposeAPIServer: () => Promise<void>;
    let disposeStaticServer: () => Promise<void>;

    let browser: puppeteer.Browser;
    let page: puppeteer.Page | undefined;

    beforeAll(async () => {
      browser = await puppeteer.launch({
        // If you wanna run tests with open browser
        // set your PUPPETEER_HEADLESS env to "false"
        headless: process.env.PUPPETEER_HEADLESS !== "false",
      });

      const staticServer = fastify();
      staticServer.register(fastifyStatic, {
        root: path.resolve(__dirname, "..", name, "dist"),
      });
      await new Promise<void>((resolve, reject) => {
        staticServer.listen(staticPort, (err) => {
          if (err) return reject(err);
          resolve();
          disposeStaticServer = () => staticServer.close();
        });
      });
    });
    beforeEach(async () => {
      if (page !== undefined) {
        await page.close();
        page = undefined;
      }
      if (disposeAPIServer) {
        await disposeAPIServer();
      }
      disposeAPIServer = await createServer({ port: apiPort });
    });
    afterAll(async () => {
      await browser.close();
      await disposeAPIServer();
      await disposeStaticServer();
    });

    it("can visit the application", async () => {
      page = await browser.newPage();
      await page.goto(testPage);
      await page.waitForSelector(".todo-list label");
      const contents = await page.$eval(
        ".todo-list label",
        (element) => (element as any).innerHTML
      );
      expect(contents).toEqual("foo");
    });

    it("can create a new todo", async () => {
      page = await browser.newPage();
      await page.goto(testPage);
      await page.waitForSelector(".new-todo");
      await page.type(".new-todo", "Do the laundry");
      await page.keyboard.press("\n");
      // wait until there are two elements in the list
      await page.waitForSelector(".todo-list li:nth-child(2)");
      const todos = await page.evaluate(() => {
        return Array.from(
          // @ts-ignore
          window.document.querySelectorAll(".todo-list label")
        ).map((element: any) => element.innerHTML);
      });
      expect(todos).toEqual(["foo", "Do the laundry"]);
    }, 100_000);

    it("can complete a todo", async () => {
      page = await browser.newPage();
      await page.goto(testPage);
      await page.waitForSelector(".todo-list label");

      await page.click(".toggle");
      await page.waitForFunction(
        // @ts-ignore
        () => window.document.querySelector(".toggle").checked === true
      );

      let isChecked = await page.evaluate(() => {
        // @ts-ignore
        return window.document.querySelector(".toggle").checked;
      });
      expect(isChecked).toEqual(true);

      await page.click(".toggle");
      isChecked = await page.evaluate(() => {
        // @ts-ignore
        return window.document.querySelector(".toggle").checked;
      });
      expect(isChecked).toEqual(false);
    });

    it("can delete a todo", async () => {
      page = await browser.newPage();
      await page.goto(testPage);
      await page.waitForSelector(".todo-list label");
      await page.hover(".view");
      await page.waitForSelector(".destroy");
      await page.click(".destroy");
      await page.waitForFunction(
        // @ts-ignore
        () => !window.document.querySelector(".todo-list label")
      );
    });
  });
});
