import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const port = Number(process.env.LOCAL_PREVIEW_PORT || 3002);
const upstream = new URL(process.env.LOCAL_PREVIEW_UPSTREAM || "http://127.0.0.1:3001");
const clientRoot = resolve("dist/client");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function unwrapChunkedBody(body) {
  const chunks = [];
  let offset = 0;

  while (offset < body.length) {
    const lineEnd = body.indexOf("\r\n", offset);
    if (lineEnd === -1) return body;
    const sizeText = body.subarray(offset, lineEnd).toString("ascii").split(";", 1)[0];
    if (!/^[0-9a-f]+$/i.test(sizeText)) return body;
    const size = Number.parseInt(sizeText, 16);
    offset = lineEnd + 2;
    if (size === 0) return Buffer.concat(chunks);
    if (offset + size + 2 > body.length) return body;
    chunks.push(body.subarray(offset, offset + size));
    offset += size;
    if (body.subarray(offset, offset + 2).toString("ascii") !== "\r\n") return body;
    offset += 2;
  }

  return body;
}

async function serveAsset(pathname, response) {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, "");
  const file = resolve(join(clientRoot, relative));
  if (file !== clientRoot && !file.startsWith(clientRoot + sep)) return false;

  try {
    const details = await stat(file);
    if (!details.isFile()) return false;
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": details.size,
      "Cache-Control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    });
    createReadStream(file).pipe(response);
    return true;
  } catch {
    return false;
  }
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", upstream);
  if (await serveAsset(requestUrl.pathname, response)) return;

  try {
    const headers = {
      ...request.headers,
      host: upstream.host,
      // Keep the upstream body uncompressed. Node's fetch transparently
      // decodes compressed responses, so forwarding the original encoding
      // headers would make browsers try to decode the body a second time.
      "accept-encoding": "identity",
      connection: "close",
    };
    const upstreamResponse = await fetch(new URL(requestUrl.pathname + requestUrl.search, upstream), {
      method: request.method,
      headers,
      redirect: "manual",
    });
    const outputHeaders = Object.fromEntries(upstreamResponse.headers.entries());
    delete outputHeaders["content-encoding"];
    delete outputHeaders["content-length"];
    delete outputHeaders["transfer-encoding"];
    delete outputHeaders.connection;
    const body = unwrapChunkedBody(Buffer.from(await upstreamResponse.arrayBuffer()));
    outputHeaders["content-length"] = String(body.length);
    response.writeHead(upstreamResponse.status, outputHeaders);
    response.end(body);
  } catch (error) {
    response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`Local preview unavailable: ${error.message}`);
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Proto Pirate local preview: http://127.0.0.1:${port}`);
});
