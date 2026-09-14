# Agentic OCR API 테스터 (Vercel)

외부 연동 API 10종을 브라우저에서 호출·확인하는 테스트 사이트.
**토큰·Base URL은 서버 환경변수**로만 두고, 브라우저는 `/api/proxy`만 호출한다(토큰 미노출 + CORS 해결).
**결과 콜백**은 `/api/callback`이 받아 함수 로그에 남긴다.

## 구조

```
목서버/
├─ public/
│  └─ index.html      # 테스터 UI (정적)
├─ api/
│  ├─ proxy.js        # OCR API 프록시 — 토큰 주입 후 전달
│  └─ callback.js     # 콜백 수신 — 로그로 확인
├─ package.json
└─ README.md
```

> 참고: 로컬 단독 실행용 `api-tester.html`은 이 Vercel 버전으로 대체됨(삭제해도 됨).

## 환경변수 (Vercel > Project > Settings > Environment Variables)

| 이름 | 예시 | 설명 |
| --- | --- | --- |
| `OCR_BASE_URL` | `https://ocr.example.com` | OCR 제품 Base URL (끝 슬래시 없이) |
| `OCR_API_TOKEN` | `aocr_...` | API 토큰. 프록시가 `Authorization: Bearer`로 주입 |

두 값은 **서버에서만** 쓰이며 브라우저 번들·응답에 노출되지 않는다.

## 배포

### GitHub 연동 (권장)
1. 이 폴더를 Git 저장소로 올린다.
2. Vercel에서 `Add New… → Project`로 저장소를 import (프레임워크: **Other**).
3. Settings에서 위 환경변수 2개 등록 → Deploy.

### CLI
```bash
npm i -g vercel
cd 목서버
vercel                 # 최초 배포(프로젝트 생성)
vercel env add OCR_BASE_URL
vercel env add OCR_API_TOKEN
vercel --prod          # 운영 배포
```

## 콜백 테스트

1. 배포 후 콜백 URL: `https://<앱>.vercel.app/api/callback`
   (UI 상단에도 표시되며 [복사] 버튼 있음)
2. 트랜잭션 제출 시 요청 본문 `callback_url`이 이 주소로 자동 채워짐.
3. OCR 서버가 콜백을 보내면 **함수 로그**에서 확인:
   - Vercel 대시보드 > 프로젝트 > **Logs** (실시간), 또는
   - `vercel logs <배포 URL>`
4. 로그에 `[CALLBACK ...] method / headers / body`가 찍힌다.

> 콜백은 서명·인증이 없다(수신측 IP·망 보호 전제). 이 테스터는 무조건 200으로 응답한다.

## 로컬 개발

```bash
vercel dev             # /api/* 함수까지 로컬에서 실행 (env는 vercel env pull 로 가져오기)
```

## 알아둘 점

- 프록시 `target`은 `/v1/`로 시작하는 경로만 허용(그 외 400).
- Vercel 서버리스 요청 본문 상한(기본 ~4.5MB)이 있어, 대용량 문서 base64 제출은 실패할 수 있다(테스트용 한계).
- 콜백 수신 내역은 **상태 저장 없이 로그로만** 확인한다(서버리스는 무상태).
