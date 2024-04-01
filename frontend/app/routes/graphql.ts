import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function action({ request, context }: ActionFunctionArgs) {
  const server = context.cloudflare.env.SERVER;
  if (server) {
    return server.fetch(request);
  }
  return fetch("http://localhost:3001/graphql", request);
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const server = context.cloudflare.env.SERVER;
  if (server) {
    return server.fetch(request);
  }
  return fetch("http://localhost:3001/graphql", request);
}
