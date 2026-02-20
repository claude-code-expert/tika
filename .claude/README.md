# .claude/ - Claude Code 설정 디렉토리

Claude Code가 이 프로젝트에서 작업할 때 참조하는 설정, 규칙, 명령어, 에이전트 정의를 관리하는 디렉토리이다.

## 디렉토리 구조

```
.claude/
├── README.md                  # 이 파일 - .claude 폴더 구조 설명
├── CLAUDE.md                  # 프로젝트 가이드 (기술 스택, 코딩 규칙, 금지 사항 등)
├── settings.json              # 팀 공유 설정 (Git 커밋 대상)
├── settings.local.json        # 개인 설정 (Git 제외 대상)
├── commands/                  # 슬래시 명령어 정의
│   ├── README.md              # commands 폴더 설명
│   ├── deploy.md              # /deploy - Vercel 배포 명령어
│   └── migrate.md             # /migrate - DB 마이그레이션 명령어
├── agents/                    # 에이전트 프롬프트 정의
│   ├── README.md              # agents 폴더 설명
│   └── todo-crud.md           # TODO CRUD 구현 에이전트
└── rules/                     # 자동 적용 규칙 정의
    ├── README.md              # rules 폴더 설명
    ├── api-rules.md           # API 작업 시 자동 적용 규칙
    └── component-rules.md     # 컴포넌트 작업 시 자동 적용 규칙
```

## 파일 설명

### CLAUDE.md
프로젝트의 핵심 가이드 문서. 프로젝트 개요, 기술 스택, 핵심 명령어, 디렉토리 구조, 코딩 규칙, 금지 사항 등을 포함한다. Claude Code가 이 프로젝트에서 작업을 시작할 때 가장 먼저 참조하는 문서이다.

### settings.json
팀 전체가 공유하는 Claude Code 설정 파일. Git에 커밋하여 팀원 모두에게 동일한 설정이 적용되도록 한다. 허용/금지 명령어 권한 설정이 포함되어 있다.

### settings.local.json
개인별 Claude Code 설정 파일. `.gitignore`에 추가하여 Git에 커밋하지 않는다. 개인 환경에 맞는 설정을 추가할 수 있다.

## Git 관리 정책

| 파일 | Git 커밋 | 비고 |
|------|----------|------|
| CLAUDE.md | O | 팀 공유 |
| settings.json | O | 팀 공유 |
| settings.local.json | X | `.gitignore`에 추가 |
| commands/*.md | O | 팀 공유 |
| agents/*.md | O | 팀 공유 |
| rules/*.md | O | 팀 공유 |
