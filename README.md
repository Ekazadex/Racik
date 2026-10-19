<div align="center">

# Racik

### A thoughtful campaign studio for Indonesia's small businesses

Turn a product brief into a clear, editable campaign for Instagram, short video, WhatsApp, and Stories.

[**Open the live app**](https://racik-sage.vercel.app) · [Report an issue](https://github.com/Ekazadex/Racik/issues)

<br />

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Powered by Gemini](https://img.shields.io/badge/AI-Gemini-4285F4?logo=googlegemini&logoColor=white)

</div>

---

## About

Racik helps Indonesian small-business owners turn a short product brief into a practical first draft, without handing creative control to a chatbot. The interface and generated copy are available in **English** and **Bahasa Indonesia**.

The owner stays in charge: generated content is editable, uncertain details are surfaced as assumptions, and the model is instructed not to invent product claims, prices, stock, or delivery information.

## What you can make

- A campaign name and central creative idea
- An Instagram caption and short-form video script
- A polite WhatsApp message and three Story slides
- A call to action, hashtags, and assumptions to review
- One complete campaign in the language selected in the interface

## Built with

| Layer | Tools |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Validation | Zod, shared between the browser and API |
| Generation | Google Gemini API, called from the server |
| Rate limiting | Upstash Redis and Ratelimit in production |
| Quality | Vitest, Testing Library, axe-core, ESLint |
| Hosting | Vercel |

## Run locally

**Requirements:** Node.js 20.9 or newer and npm.

```bash
npm install
```

Create a local environment file:

```powershell
Copy-Item .env.example .env.local
```

On macOS or Linux, use `cp .env.example .env.local` instead. Add a Gemini API key to `.env.local`, then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local development does not require Upstash credentials; production rate limiting requires both Redis values below. **Never commit real credentials or expose server keys through `NEXT_PUBLIC_*` variables.**

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Authenticates server-side Gemini requests |
| `GOOGLE_GENERATIVE_AI_MODEL` | No | Gemini model name; defaults to `gemini-flash-latest` |
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST endpoint for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Upstash Redis REST token for rate limiting |

## Project structure

```text
app/
  api/campaigns/       Campaign generation endpoint
  globals.css          Global styles and responsive layout
  layout.tsx           Root layout and page metadata
components/
  campaign-builder.tsx Campaign form, language switch, and results
lib/
  campaign-schema.ts   Shared request and result validation
  generate-campaign.ts Gemini prompt and response handling
  translations.ts      English and Indonesian interface copy
public/
  images/              Scalable decorative background artwork
```

The page background is drawn as **SVG vector artwork**, so its fine lines stay crisp on 4K and high-density screens without shipping a multi-megabyte raster image.

## Quality checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Safety and privacy

- Input and model output are validated before use; invalid output is returned as an error, not presented as a successful campaign.
- The API limits request size, handles provider failures explicitly, and applies a production rate limit of five requests per minute per client address.
- Production generation fails closed if its rate-limiting configuration is missing or unavailable.
- Briefs are sent to Google to generate content. Racik does not store campaign history; avoid submitting personal customer data or business secrets.
- Generated copy is a draft. Review factual claims, pricing, availability, platform policies, and brand fit before publishing.

## Deployment

The existing Vercel project deploys this repository's `main` branch and retains the original production URL: [racik-sage.vercel.app](https://racik-sage.vercel.app). Pushes to `main` trigger deployments. Configure the production environment variables in Vercel; keep secrets out of Git.

If a deployment causes problems, use Vercel's deployment history to promote the last known-good release.
