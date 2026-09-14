// OCR 외부 연동 API 프록시
// 브라우저 → /api/proxy?target=/v1/... → (토큰 주입) → OCR 서버
// 토큰·Base URL은 Vercel 환경변수로만 존재하며 클라이언트에 노출되지 않는다.
export default async function handler(req, res) {
  const base = process.env.OCR_BASE_URL;
  const token = process.env.OCR_API_TOKEN;

  if (!base) {
    return res.status(500).json({
      error: { code: "NO_BASE_URL", message: "OCR_BASE_URL 환경변수가 설정되지 않았습니다." },
    });
  }

  const target = req.query.target;
  if (!target || !target.startsWith("/v1/")) {
    return res.status(400).json({
      error: { code: "BAD_TARGET", message: "target 쿼리는 /v1/ 로 시작해야 합니다." },
    });
  }

  const url = base.replace(/\/$/, "") + target;
  const headers = {};
  if (token) headers["Authorization"] = "Bearer " + token;

  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    headers["Content-Type"] = "application/json";
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
  }

  try {
    const upstream = await fetch(url, { method: req.method, headers, body });
    const text = await upstream.text();

    // 상태 코드·본문 그대로 전달 + 주요 응답 헤더 노출
    const loc = upstream.headers.get("location");
    const wa = upstream.headers.get("www-authenticate");
    if (loc) res.setHeader("X-Upstream-Location", loc);
    if (wa) res.setHeader("X-Upstream-WWW-Authenticate", wa);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.status(upstream.status).send(text);
  } catch (e) {
    return res.status(502).json({
      error: { code: "UPSTREAM_ERROR", message: e.message },
    });
  }
}
