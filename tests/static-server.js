import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

export function startStaticServer(port = 0) {
  const server = createServer(async (req, res) => {
    const path = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    try {
      const body = await readFile(join(ROOT, path));
      res.writeHead(200, { "Content-Type": MIME[extname(path)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const { port: actualPort } = server.address();
      resolve({ server, url: `http://127.0.0.1:${actualPort}` });
    });
  });
}
