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
    return getContainer(env.XHS_DOWNLOADER, CONTAINER_INSTANCE).fetch(request);
  },
};

interface Env {
  XHS_DOWNLOADER: DurableObjectNamespace<XHSDownloaderContainer>;
}
