// 결과 콜백 수신 엔드포인트
// OCR 서버(또는 연동 서버)가 이 URL로 결과를 POST하면 함수 로그에 남긴다.
// 수신 내역은 Vercel 대시보드 > 프로젝트 > Logs (또는 `vercel logs`)에서 확인.
export default async function handler(req, res) {
  const at = new Date().toISOString();
  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});

  console.log(`━━━━━━ [CALLBACK ${at}] ${req.method} ━━━━━━`);
  console.log("headers:", JSON.stringify(req.headers));
  console.log("body:", body);

  // 콜백은 단방향 통지 — 응답 본문은 무시되지만, 2xx면 성공 판정된다.
  return res.status(200).json({ received: true, at });
}
