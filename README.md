# SLATE Recruiter Assistant

AI-powered recruiter workflow built with Next.js App Router, TypeScript, TailwindCSS, and pdf.js.

## What it does

- Refines a rough job description into structured hiring criteria.
- Lets recruiters edit and confirm must-haves, nice-to-haves, and red flags.
- Extracts text from uploaded PDF resumes in the browser with pdf.js.
- Caches extracted resume text in workflow state so PDFs are not reprocessed.
- Sends cached resume text to the AI ranking API.
- Displays ranked candidates and candidate-level multi-role feedback.

## Backend APIs

The frontend calls these endpoints through `src/lib/api.ts`:

- `POST /api/jd/refine`
- `POST /api/analyze-resumes`
- `POST /api/candidate-detail`

Current ID contract:

- Candidate IDs are numbers.
- Resume IDs sent to analysis are numbers so candidate drill-down can reuse cached resume text.
- API 2 candidate summaries include `consensus` and `conflicts`; interview questions are not expected there.
- API 3 accepts a numeric `candidateID`, returns numeric chunk IDs, numeric comment `chunkId` values, and a `summary` with `overview` plus `interviewQuestions`.

By default, requests are sent to the same origin. If the backend is hosted elsewhere, set:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend.example.com
```

## Production Access Control

Production deployments require Basic Auth before any app or API route is accessible:

```bash
BIBI_APP_USERNAME=slate
BIBI_APP_PASSWORD=replace-with-a-long-random-password
```

If `BIBI_APP_PASSWORD` is missing in production, the app fails closed with `503`.

For demos without a live backend, force deterministic mock responses:

```bash
NEXT_PUBLIC_USE_MOCK_API=true npm run dev
```

Mock fallback is enabled by default for missing, timed-out, or unreachable APIs. Disable it with:

```bash
NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=false npm run dev
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Main Routes

- `/upload-jd`
- `/review-criteria`
- `/upload-resumes`
- `/results`
- `/candidate/[id]`
