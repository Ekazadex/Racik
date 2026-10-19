import { createHmac } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { campaignRequestSchema } from '@/lib/campaign-schema';
import { CampaignGenerationError, generateCampaign } from '@/lib/generate-campaign';

export const runtime = 'nodejs';

const maxRequestLength = 12_000;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis =
  process.env.UPSTASH_REDIS_REST_URL && upstashToken
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: upstashToken,
      })
    : null;
const limiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'racik:campaigns',
    })
  : null;

export async function POST(request: NextRequest) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json(
      { error: { code: 'INVALID_CONTENT_TYPE', message: 'Kirim brief dalam format JSON.' } },
      { status: 415 },
    );
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxRequestLength) {
    return NextResponse.json(
      { error: { code: 'REQUEST_TOO_LARGE', message: 'Brief terlalu panjang.' } },
      { status: 413 },
    );
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return NextResponse.json(
      { error: { code: 'EMPTY_REQUEST', message: 'Isi brief tidak ditemukan.' } },
      { status: 400 },
    );
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxRequestLength) {
        await reader.cancel();
        return NextResponse.json(
          { error: { code: 'REQUEST_TOO_LARGE', message: 'Brief terlalu panjang.' } },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
  } catch (error) {
    console.error('Campaign request body could not be read', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { error: { code: 'REQUEST_READ_FAILED', message: 'Isi permintaan tidak dapat dibaca.' } },
      { status: 400 },
    );
  } finally {
    reader.releaseLock();
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(bodyBytes));
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Isi permintaan tidak terbaca.' } },
      { status: 400 },
    );
  }

  const parsedRequest = campaignRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_BRIEF',
          message: 'Periksa kembali brief. Nama produk dan audiens minimal 2 karakter.',
        },
      },
      { status: 400 },
    );
  }

  if (process.env.NODE_ENV === 'production' && !limiter) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_NOT_CONFIGURED',
          message: 'Generator belum siap untuk penggunaan publik. Coba lagi nanti.',
        },
      },
      { status: 503 },
    );
  }

  if (limiter) {
    if (!upstashToken) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_NOT_CONFIGURED',
            message: 'Generator belum siap untuk penggunaan publik. Coba lagi nanti.',
          },
        },
        { status: 503 },
      );
    }

    const clientIp =
      request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
    if (!clientIp) {
      return NextResponse.json(
        {
          error: {
            code: 'CLIENT_ADDRESS_UNAVAILABLE',
            message: 'Generator tidak dapat memeriksa batas penggunaan. Coba lagi nanti.',
          },
        },
        { status: 503 },
      );
    }

    const identifier = createHmac('sha256', upstashToken).update(clientIp).digest('hex');
    try {
      const limit = await limiter.limit(identifier);
      if (!limit.success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Batas 5 brief per menit tercapai. Tunggu sebentar lalu coba lagi.',
            },
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfterSeconds) },
          },
        );
      }
    } catch (error) {
      console.error('Upstash rate limit check failed', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_UNAVAILABLE',
            message: 'Pembatasan penggunaan sedang bermasalah. Coba lagi nanti.',
          },
        },
        { status: 503 },
      );
    }
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: 'Generator belum dikonfigurasi. Tambahkan API key Gemini di environment server.',
        },
      },
      { status: 503 },
    );
  }

  const model = process.env.GOOGLE_GENERATIVE_AI_MODEL || 'gemini-flash-latest';

  try {
    const campaign = await generateCampaign(parsedRequest.data, apiKey, model);
    return NextResponse.json({ data: campaign }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CampaignGenerationError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        {
          status: error.status,
          headers: error.status === 429 ? { 'Retry-After': '10' } : undefined,
        },
      );
    }

    console.error('Campaign generation failed unexpectedly', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      {
        error: {
          code: 'CAMPAIGN_GENERATION_FAILED',
          message: 'Paket kampanye belum berhasil dibuat. Coba lagi.',
        },
      },
      { status: 500 },
    );
  }
}
