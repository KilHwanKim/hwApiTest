// Vercel 없이 로컬 실행용 서버. public/ 정적 서빙 + api/*.js 함수 재사용.
// 실행: node server.js  (환경변수는 .env 자동 로드)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 3000;

// .env 로드 (Node 20.6+ 없이도 동작하도록 간단 파서)
try {
  const env = await readFile(join(root, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const proxy = (await import("./api/proxy.js")).default;
const callback = (await import("./api/callback.js")).default;
const config = (await import("./api/config.js")).default;

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

// Vercel 함수용 req/res 어댑터
function adapt(req, res, query, body) {
  req.query = query;
  req.body = body;
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); return res; };
  res.send = (t) => { res.end(t); return res; };
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const query = Object.fromEntries(url.searchParams);

  // 본문 읽기
  let body = "";
  if (!["GET", "HEAD"].includes(req.method)) {
    for await (const chunk of req) body += chunk;
  }

  if (url.pathname === "/api/proxy") { adapt(req, res, query, body); return proxy(req, res); }
  if (url.pathname === "/api/callback") { adapt(req, res, query, body); return callback(req, res); }
  if (url.pathname === "/api/config") { adapt(req, res, query, body); return config(req, res); }

  // 정적 파일 (public/)
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const data = await readFile(join(root, "public", path));
    res.setHeader("Content-Type", MIME[extname(path)] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404; res.end("Not found");
  }
}).listen(PORT, () => console.log(`▶ http://localhost:${PORT}  (base=${process.env.OCR_BASE_URL || "미설정"})`));
