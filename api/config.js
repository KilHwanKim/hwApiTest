// 프론트 프리필용: 서버 .env 의 Base URL / API 키를 노출 (목·테스트 전용).
// 운영 프록시(api/proxy.js)와 달리 여기선 키를 클라이언트에 그대로 내려준다.
export default function handler(req, res) {
  res.status(200).json({
    base: process.env.OCR_BASE_URL || "",
    key: process.env.OCR_API_TOKEN || process.env.OCR_API_KEY || "",
  });
}
