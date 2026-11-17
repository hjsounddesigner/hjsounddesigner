# Design Direction — Hakjun Lee Portfolio

**Mood:** 미래지향적인 테크 디자인 + 정교한 미니멀리즘
**Reference mix:** NVIDIA(강한 녹색 정체성) · Nothing(독특한 테크 미니멀) · Linear(정교한 다크 UI/레이아웃) · Vercel(절제된 다크 인터페이스)

방향: 녹색의 존재감을 높이고, 선명한 포인트 컬러와 어두운 배경의 대비를 적극 활용한다.
녹색은 버튼 색으로만 쓰지 않고 **데이터 시각화, 인터랙션, 활성 상태, 미세한 발광 효과**까지 일관되게 사용한다.

## Color system (중심: `#00E676` + `#080B09`)

| Token | Hex | 용도 |
|---|---|---|
| Background | `#080B09` | 메인 배경 |
| Surface | `#101713` | 카드 배경 |
| Elevated | `#18231C` | 강조 영역 |
| Primary | `#00E676` | 메인 포인트 (Digital Green) |
| Secondary | `#00B85C` | 보조 포인트 |
| Glow | `#123D28` | 은은한 녹색 효과 |
| Text | `#F2F5F2` | 기본 텍스트 |
| Muted | `#89958C` | 보조 텍스트 |

메인 그린 후보(채택: Digital Green): Cyber Lime `#76FF03`, Tech Emerald `#00C853`, Neon Mint `#39FF88`.

## Details

| 요소 | 스타일 |
|---|---|
| 폰트 | Geist / Inter (한글은 Pretendard Variable 폴백), 모노는 Geist Mono |
| 모서리 | 6–10px |
| 테두리 | 얇은 다크 그레이 |
| 버튼 | 선명한 녹색 |
| 차트 | 녹색 + 회색 |
| 애니메이션 | 부드러운 Fade / Glow |
| 배경 효과 | 은은한 Radial Gradient |

## Site structure

- `index.html` — Home
- `works.html` — Works (카테고리 필터: all / game / film / music)
- `about.html` — About
- `contact.html` — Contact

## Stack

빌드 도구 없는 정적 사이트: 순수 HTML / CSS / JS. 토큰은 `styles.css`의 `:root` CSS 변수로 관리.
`prefers-reduced-motion` 대응, 스킵 링크, 포커스 링 포함.

## Favicon

로고(`jun` + 소리 파동)는 파비콘에서만 사용. 파일은 `assets/favicon/`, 루트에 `favicon.ico`.
