# 마트 가격 비교 - 설정 가이드

## 1. 환경 변수 설정

`.env.local` 파일을 수정하여 필요한 환경 변수를 설정하세요.

```bash
# 앱 비밀번호 (기본값: 1234)
APP_PASSWORD=원하는비밀번호

# Google Cloud Vision API 키
GOOGLE_CLOUD_API_KEY=your_api_key_here
```

## 2. Google Cloud Vision API 설정

### 2.1 Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 2.2 Vision API 활성화

1. 좌측 메뉴에서 **APIs & Services** > **Library** 선택
2. "Cloud Vision API" 검색
3. **Enable** 클릭

### 2.3 API 키 생성

1. **APIs & Services** > **Credentials** 이동
2. **+ CREATE CREDENTIALS** > **API key** 선택
3. 생성된 API 키를 `.env.local`의 `GOOGLE_CLOUD_API_KEY`에 입력

### 2.4 (권장) API 키 제한 설정

보안을 위해 API 키에 제한을 설정하세요:

1. 생성된 API 키 클릭
2. **Application restrictions**에서 배포 도메인 설정
3. **API restrictions**에서 "Cloud Vision API"만 선택

### 2.5 할당량 제한 설정 (필수!)

**과금 방지를 위해 반드시 설정하세요:**

1. **APIs & Services** > **Cloud Vision API** 클릭
2. **Quotas & System Limits** 탭 선택
3. `Requests per day` 항목 찾기
4. 연필 아이콘 클릭 > **900**으로 설정
5. **Save** 클릭

이렇게 하면 Google Cloud 측에서 일일 900회로 제한되어 과금이 발생하지 않습니다.

### 2.6 무료 한도

- Google Cloud Vision API는 **월 1,000회** 무료
- 앱 내에서도 **월 900회** 제한이 적용됨 (이중 보호)
- 사용량은 헤더와 푸터에서 실시간 확인 가능

## 3. 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인

## 4. Vercel 배포

### 4.1 GitHub 연동

```bash
# Git 초기화 (이미 되어있을 수 있음)
git init
git add .
git commit -m "Initial commit"

# GitHub 리포지토리 생성 후 푸시
git remote add origin https://github.com/your-username/cpc.git
git push -u origin main
```

### 4.2 Vercel 배포

1. [Vercel](https://vercel.com) 접속
2. **New Project** 클릭
3. GitHub 리포지토리 선택
4. **Environment Variables**에 환경 변수 추가:
   - `APP_PASSWORD`
   - `GOOGLE_CLOUD_API_KEY`
5. **Deploy** 클릭

## 5. 모바일 앱처럼 사용하기 (PWA)

### iOS (Safari)
1. 배포된 사이트 접속
2. 공유 버튼 탭
3. "홈 화면에 추가" 선택

### Android (Chrome)
1. 배포된 사이트 접속
2. 메뉴(점 3개) 탭
3. "홈 화면에 추가" 선택

## 6. 문제 해결

### "카메라를 시작할 수 없습니다"
- 브라우저 카메라 권한 확인
- HTTPS 환경에서만 카메라 사용 가능 (localhost 제외)

### "Google Cloud API 키가 설정되지 않았습니다"
- `.env.local` 파일에 API 키가 올바르게 입력되었는지 확인
- 서버 재시작 필요 (`npm run dev`)

### "상품 가격을 인식하지 못했습니다"
- 가격표가 선명하게 보이도록 촬영
- 조명이 충분한 환경에서 촬영
- 가격표가 화면의 대부분을 차지하도록 촬영

### 쿠팡 가격 조회 실패
- 쿠팡의 크롤링 방지로 인해 가격 자동 조회가 실패할 수 있음
- "쿠팡에서 직접 확인하기" 링크로 수동 확인 가능
