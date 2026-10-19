# Racik

**A live, bilingual AI campaign studio for Indonesian small businesses.** Racik turns a short product brief into an editable campaign direction, Instagram caption, short-video script, WhatsApp message, three Instagram Story slides, a call to action, five hashtags, and assumptions to verify. It is designed for owners who need a practical starting point rather than a general-purpose chatbot, and keeps the owner in control of every claim before publication. I chose the idea because it solves a concrete marketing workflow while making accuracy, review, and safe AI output part of the product.

**Live app:** [racik-sage.vercel.app](https://racik-sage.vercel.app)

**Repository:** [github.com/Ekazadex/Racik](https://github.com/Ekazadex/Racik)

## What it does

- Switch the complete interface between English and Bahasa Indonesia. English is the default; the selected language also controls the language of AI-generated copy.
- Describe a product, intended audience, campaign goal, tone, and optional confirmed offer details.
- Generate a structured, multi-channel campaign draft with Gemini.
- Copy the full campaign or an individual content block.
- Review assumptions and check every factual claim before publishing.

## Run locally

Requirements: Node.js 20.9+ and npm.

```powershell
npm install
Copy-Item .env.example .env.local
```

Set `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local` to a Gemini API key. Do not put real credentials in `.env.example`, source control, or `NEXT_PUBLIC_*` variables. The API key is read only by the server. Local development does not require Upstash; production requires both Upstash Redis REST variables for rate limiting.

```bash
npm run dev
```

Open `http://localhost:3000`. Available validation commands:

```bash
npm test
npm run test:coverage
npm run typecheck
npm run lint
npm run build
```

## Architecture

- `app/page.tsx` and `app/layout.tsx`: the home page, English metadata, and the default document language.
- `components/campaign-builder.tsx`: accessible brief form, language switch, client-side validation, loading/error/success states, campaign output, and copy actions.
- `app/globals.css` and `public/images/botanical-background.png`: responsive layout, visual styling, and the owner-supplied botanical page background.
- `lib/translations.ts`: English and Indonesian UI strings and localized API error messages.
- `app/api/campaigns/route.ts`: server endpoint; checks JSON content type, caps request bodies at 12 KB, validates input, applies the production rate limit, and calls the model.
- `lib/campaign-schema.ts`: shared Zod contracts for the brief and campaign result.
- `lib/generate-campaign.ts`: language-aware Gemini prompt, bounded generation, JSON extraction, generated-copy punctuation cleanup, hashtag sanitation, and strict output validation.
- Upstash Redis/Ratelimit: limits each client address to five requests per minute in production. The address is HMAC-hashed; if rate limiting is missing or unavailable, the endpoint fails closed.
- `*.test.ts(x)`: schema, prompt, UI, error handling, copy behavior, and axe-core tests.

## AI integration

The server sends the validated product, audience, goal, tone, and optional offer to Gemini. The prompt requests concise, specific campaign content in the language selected in the interface, avoids generic copywriting phrases, and prohibits em/en dash punctuation. It instructs the model not to invent prices, inventory, launch timing, ordering or delivery details, outcomes, testimonials, certifications, health claims, or false urgency, and to report uncertainties as assumptions.

Gemini is asked for JSON matching a fixed response schema. The result is parsed and validated again before it is returned or rendered. Em/en dashes in generated copy are replaced with commas. Invalid output is rejected rather than displayed as a successful campaign. Hashtags that do not match the allowed format or resemble prompt/schema fragments are discarded, then completed from brief details and generic local-business tags in the selected language.

The model can be changed with `GOOGLE_GENERATIVE_AI_MODEL`; the default is `gemini-flash-latest`. The API key is sent only server-to-server. Briefs are sent to Google to generate content and are not stored by this application. Do not submit personal customer data, business secrets, or other sensitive information.

## Resilience and limitations

- Client and server both validate the brief and generated result.
- Invalid requests, missing configuration, rate limits, upstream failures, timeouts, and malformed model output produce explicit errors; raw provider responses and credentials are not exposed.
- Production requests fail closed if Upstash rate limiting cannot be applied.
- Generated copy is a draft. Owners must verify factual claims, pricing, availability, platform policy, and brand fit before publication.
- The app has no accounts, saved campaign history, or per-user quotas. IP rate limiting is basic abuse protection, not a substitute for API budget alerts or account-based controls.
- Google model availability, rate limits, and pricing may change.

## Testing and accessibility evidence

Latest local verification:

- **20 tests pass** across the UI, schema, and prompt suites.
- Campaign-builder coverage: **83.17% statements, 83% lines, 74.02% branches, and 70.58% functions** (above the 50% component-coverage requirement).
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- Production UI flow and the AI endpoint were exercised on the public deployment; the generation request returned HTTP 200 and rendered a validated campaign.
- Production Lighthouse 12.8.2, mobile: Performance **98**, Accessibility **100**, Best Practices **96**, SEO **100**; FCP 0.94 s, LCP 1.90 s, TBT 146 ms, CLS 0.
- Production Lighthouse 12.8.2, desktop: Performance **100**, Accessibility **100**, Best Practices **96**, SEO **100**; FCP 0.27 s, LCP 0.44 s, TBT 0 ms, CLS 0.
- Production browser axe audit detected **0 WCAG 2.1 A/AA violations**. A contrast review also led to changing placeholder color from `#8b9388` (3.17:1 on white) to `#687166` (5.07:1).
- The current decorative background is the owner-supplied 1080x768 PNG.
- [WebAIM WAVE audit](https://wave.webaim.org/report#/https://racik-sage.vercel.app) of the live English and Bahasa Indonesia interfaces on 2026-10-18: **0 errors, 0 contrast errors, 0 alerts; AIM score 10/10**.
- Keyboard smoke test verified the skip link and brand link can be reached in order.

Automated audits are not proof of full WCAG conformance. A screen-reader/assistive-technology test has not been completed; WAVE and axe explicitly recommend additional manual testing. Axe in JSDOM does not evaluate visual color contrast.

## Deployment and operations

Production runs on Vercel at [racik-sage.vercel.app](https://racik-sage.vercel.app), connected to this repository. The existing Vercel project and domain were kept; no new project or domain was created. Production secrets are stored as Vercel environment variables and are not committed.

### Deployment checklist

- [x] Connect the existing Vercel project to this repository while preserving the existing production domain and project settings.
- [x] Run tests, typecheck, lint, and production build.
- [x] Rotate credentials previously exposed in chat; store replacement secrets only in Vercel.
- [x] Configure `GOOGLE_GENERATIVE_AI_API_KEY`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` in the Production environment.
- [x] Deploy the application and confirm the public page returns HTTP 200.
- [x] Exercise successful AI generation from the public form and confirm structured output.
- [x] Verify malformed input, rate-limit, and upstream-error handling with automated tests.
- [x] Run production Lighthouse and axe checks; record the scores and the contrast improvement above.
- [x] Run WebAIM WAVE on both live interface languages; record results above.
- [x] Review production runtime logs without logging briefs or secrets.
- [x] Document safe failure behavior and the Vercel rollback procedure below.

**Owner sign-off:** Approved by Ekananda Zhafif Dean on 2026-10-18.

### Safe failure and rollback

The app displays an error instead of substituting fake success content when validation, rate limiting, or the model fails. Gemini requests time out after 30 seconds. If a release causes production issues, use Vercel's deployment history to promote the last known-good deployment; rotate the Gemini key in Google AI Studio if compromise is suspected.

Preview deployments need their own environment secrets if AI generation is to be tested there. Do not test production rate limits by exhausting the public quota.

## Reflection

The hardest part was making the AI useful without implying that every output is true. A model can invent a price, stock level, or claim that the owner never provided. I constrained the brief and output with schemas, asked the model to expose assumptions, and rejected responses that did not match the contract. A production run also surfaced provider error text embedded in a hashtag; adding strict normalization and a regression test made that failure visible and safe.

Next time, I would test deployment secrets and unexpected live-model responses earlier instead of leaving them to the final stage. I was surprised that a JSDOM accessibility test missed a link-name issue that an axe audit in a real browser found. Component tests are valuable, but they do not replace checking the actual deployed interface.
