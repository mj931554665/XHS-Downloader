import { Container, getContainer } from "@cloudflare/containers";

const CONTAINER_INSTANCE = "api-20260616";

export class XHSDownloaderContainer extends Container {
  defaultPort = 5556;
  pingEndpoint = "localhost/openapi.json";
  sleepAfter = "10m";

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    url.protocol = "http:";
    return this.containerFetch(new Request(url.toString(), request));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const container = getContainer(env.XHS_DOWNLOADER, CONTAINER_INSTANCE);

    if (url.pathname === "/healthz") {
      return handleHealthCheck(request, container, url);
    }

    return container.fetch(request);
  },
};

interface Env {
  XHS_DOWNLOADER: DurableObjectNamespace<XHSDownloaderContainer>;
}

async function handleHealthCheck(
  request: Request,
  container: ReturnType<typeof getContainer<Env["XHS_DOWNLOADER"]>>,
  url: URL,
): Promise<Response> {
  const probeRequest = new Request(new URL("/openapi.json", url).toString(), {
    method: "GET",
    headers: request.headers,
  });

  try {
    const probeResponse = await container.fetch(probeRequest);
    const ok = probeResponse.ok;

    if (request.method === "HEAD") {
      return new Response(null, { status: ok ? 200 : 503 });
    }

    return Response.json(
      {
        ok,
        service: "xhs-downloader",
        backend: "container",
        status: ok ? "healthy" : "unhealthy",
        probe: "/openapi.json",
        upstreamStatus: probeResponse.status,
      },
      { status: ok ? 200 : 503 },
    );
  } catch (error) {
    if (request.method === "HEAD") {
      return new Response(null, { status: 503 });
    }

    return Response.json(
      {
        ok: false,
        service: "xhs-downloader",
        backend: "container",
        status: "unhealthy",
        probe: "/openapi.json",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}
