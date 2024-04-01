import { User } from "@prisma/client";
import { createYoga } from "graphql-yoga";
import { explorer } from "./explorer";
import { parse, serialize } from "cookie";
import { jwtVerify } from "jose";
import { schema } from "./libs/server/schema";
import { Context, getPrisma } from "./libs/server/context";

/**
 * @type {Env}
 * @description Cloudflare Environment variables
 */
type Env = {
  DB: D1Database;
  SECRET_KEY: string;
};

const yoga = createYoga<Context<Env>>({
  schema,
  fetchAPI: { Response },
});

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/graphql":
        if (request.method === "GET") {
          return new Response(explorer(await schema({ env })), {
            headers: { "content-type": "text/html" },
          });
        }
        // Get the user from the token
        const cookies = parse(request.headers.get("Cookie") || "");
        const token = cookies["auth-token"];
        const secret = env.SECRET_KEY;
        const user = await jwtVerify(token, new TextEncoder().encode(secret))
          .then((data) => data.payload.user as User & { roles: string[] })
          .catch(() => undefined);

        // For cookie setting
        const responseCookies: string[] = [];
        const setCookie: typeof serialize = (name, value, options) => {
          const result = serialize(name, value, options);
          responseCookies.push(result);
          return result;
        };
        // Executing GraphQL queries
        const response = await yoga.handleRequest(request, {
          env,
          req: request,
          setCookie,
          cookies: {},
          user,
          prisma: getPrisma(env.DB),
        });
        // Set the cookies
        responseCookies.forEach((v) => {
          response.headers.append("set-cookie", v);
        });
        return new Response(response.body, response);
    }
    return new Response("Not Found", { status: 404 });
  },
};
