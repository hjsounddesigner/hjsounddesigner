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
- `proposal.html` — Proposal (제안 폼 → 메일 앱)

## Stack

빌드 도구 없는 정적 사이트: 순수 HTML / CSS / JS. 토큰은 `styles.css`의 `:root` CSS 변수로 관리.
`prefers-reduced-motion` 대응, 스킵 링크, 포커스 링 포함.

## Favicon

로고(`jun` + 소리 파동)는 파비콘에서만 사용. 파일은 `assets/favicon/`, 루트에 `favicon.ico`.

## Home — SOUND ENGINE (`engine.js`)

*The Architecture of Sound.* 검정 공간에 떠 있는, 소리를 만들어내는 정밀한 기계적 코어.
NVIDIA의 기술적 분위기 + Nothing의 절제 + 하이엔드 오디오 장비의 정밀함.

**레이어**
1. Outer Frame — 티타늄 짐벌 링 2개 + 시계식 눈금 베젤 (천천히 회전)
2. Mechanical Ring — 반대 방향으로 도는 기어 2개, 볼트, 스포크
3. Resonance Chamber — 동심원 진동판(셰이더로 물결) + 공명 링
4. Energy Core — 유리 구 안에서 맥동하는 녹색 코어 + 와이어 케이지
5. Particles — 빛 입자 + 금속 파편 벨트

**Material palette** (녹색은 코어와 일부 부품에만)
Black Titanium `#111513` · Brushed Silver `#8D9891` · Neon Green `#00E676` · Dark Metal `#26332B` · Translucent Glass `#B8DCC4` · Void Black `#080B09`
비율: 블랙·다크메탈 60% / 실버·크롬 25% / 유리 10% / 네온 그린 5%

**움직임**
- Idle: 링 저속 회전, 코어 약한 맥동, 입자 부유
- Mouse: 마우스 방향으로 기울어짐, 레이어마다 다른 관성으로 반응, 코어 밝아짐
- Click: 레이어 분해(exploded view) → 코어 점등·충격파 → 고속 회전 후 안정화
- Audio reactive(준비됨): low → 링 속도, mid → 진동판, high → 입자, volume → 코어 밝기

**소리 연결 지점**
- `window.SoundEngine.setLevels({ low, mid, high, volume })` — 0~1 값, Web Audio AnalyserNode에서 넣으면 됨
- 클릭 시 `engine:ignite` 이벤트 발생 → 작동음/임팩트 사운드 재생에 사용

**레이아웃**: 좌상단 이름 · 우상단 메뉴 · 중앙 엔진(넓은 화면은 오른쪽으로 약간) · 좌하단 카피 · 우하단 SCROLL / 01—04 · 우상단 HUD
**기술**: Three.js 0.170 (CDN importmap) + UnrealBloom 후처리 + GLSL 셰이더. 빌드 도구 없음.
