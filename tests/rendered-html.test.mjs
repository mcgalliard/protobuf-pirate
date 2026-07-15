import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete Proto Pirate journey", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Proto Pirate — Learn Protocol Buffers Visually<\/title>/i);
  assert.match(html, /Learn Protobuf/);
  assert.match(html, /Pack light/);

  for (const chapter of ["map", "schema", "wire", "evolve", "challenge"]) {
    assert.match(html, new RegExp(`id=["']${chapter}["']`));
  }

  assert.match(html, /Compare message formats/);
  assert.match(html, /PICK A FIELD TO X-RAY/);
  assert.match(html, /FINAL CHECKPOINT/);
});

test("renders the core Protobuf lessons and interactive controls", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /string name = 1/);
  assert.match(html, /int32 id = 2/);
  assert.match(html, /bool active = 3/);
  assert.match(html, /Unknown field\? Skip it/);
  assert.match(html, /Add new fields with new numbers/);
  assert.match(html, /Never reuse a retired one/);

  const buttons = html.match(/<button\b/g) ?? [];
  assert.ok(buttons.length >= 10, `expected interactive controls, found ${buttons.length}`);
});
