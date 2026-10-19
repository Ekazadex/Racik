import { describe, expect, it } from 'vitest';
import { campaignRequestSchema, campaignResultSchema } from '@/lib/campaign-schema';
import {
  buildCampaignPrompt,
  normalizeCampaignCandidate,
  parseGeneratedJson,
} from '@/lib/generate-campaign';

const validRequest = {
  language: 'id' as const,
  product: 'Roti rumahan',
  audience: 'Tetangga sekitar',
  goal: 'conversion' as const,
  offer: '',
  tone: 'hangat' as const,
};

const validResult = {
  campaignName: 'Roti dari Dapur',
  bigIdea: 'Roti rumahan yang dibuat segar untuk teman sarapan di lingkungan sekitar.',
  instagramCaption: 'Sarapan jadi lebih dekat dengan roti rumahan yang dibuat segar setiap pagi.',
  shortVideoScript: 'Tunjukkan roti yang baru matang, lalu sajikan di meja sarapan keluarga.',
  whatsappMessage: 'Halo, kami membuat roti rumahan untuk sarapan. Balas pesan ini jika ingin bertanya.',
  storySlides: ['Roti baru dari dapur.', 'Dibuat segar untuk sarapan.', 'Tanya pilihan hari ini.'],
  callToAction: 'Kirim pesan untuk bertanya.',
  hashtags: ['#RotiRumahan', '#SarapanPagi', '#UsahaLokal', '#UMKMIndonesia', '#BisnisLokal'],
  assumptions: [],
};

describe('campaign schemas and prompt', () => {
  it('rejects a short product name, unexpected request properties, and oversized text', () => {
    expect(campaignRequestSchema.safeParse({ ...validRequest, product: 'x' }).success).toBe(false);
    expect(campaignRequestSchema.safeParse({ ...validRequest, extra: 'unexpected' }).success).toBe(false);
    expect(campaignRequestSchema.safeParse({ ...validRequest, audience: 'a'.repeat(161) }).success).toBe(false);
  });

  it('requires exactly three story slides and real hashtag-shaped values', () => {
    expect(campaignResultSchema.safeParse({ ...validResult, storySlides: ['one', 'two'] }).success).toBe(false);
    expect(campaignResultSchema.safeParse({ ...validResult, hashtags: ['not-a-hashtag'] }).success).toBe(false);
    expect(campaignResultSchema.safeParse({
      ...validResult,
      hashtags: ['#' + 'a'.repeat(31), ...validResult.hashtags.slice(1)],
    }).success).toBe(false);
    expect(campaignResultSchema.safeParse(validResult).success).toBe(true);
  });

  it('instructs the model not to invent claims and preserves the validated brief', () => {
    const prompt = buildCampaignPrompt(validRequest);

    expect(prompt).toContain('Jangan mengarang bahan, cara produksi, kualitas produk');
    expect(prompt).toContain('Anggap tanggal peluncuran, ketersediaan produk, cara pemesanan');
    expect(prompt).toContain('Jangan gunakan em dash atau en dash.');
    expect(prompt).not.toMatch(/[—–]/);
    expect(prompt).toContain('"product":"Roti rumahan"');
    expect(() => buildCampaignPrompt({ ...validRequest, product: '' })).toThrow();
  });

  it('requests campaign copy in the selected language', () => {
    const prompt = buildCampaignPrompt({ ...validRequest, language: 'en' });

    expect(prompt).toContain('All customer-facing content must be written in English.');
    expect(prompt).toContain('Do not use em dashes or en dashes.');
    expect(prompt).not.toMatch(/[—–]/);
    expect(prompt).not.toContain('Semua teks untuk audiens akhir harus dalam Bahasa Indonesia.');
  });

  it('parses JSON responses wrapped in code fences or short preambles', () => {
    const expected = { title: 'Ide lokal', caption: 'Teks dengan brace { di dalam kalimat.' };

    expect(parseGeneratedJson(JSON.stringify(expected))).toEqual(expected);
    expect(parseGeneratedJson(`\`\`\`json\n${JSON.stringify(expected)}\n\`\`\``)).toEqual(expected);
    expect(parseGeneratedJson(`Berikut hasilnya:\n${JSON.stringify(expected)}\nSemoga membantu.`)).toEqual(
      expected,
    );
    expect(parseGeneratedJson('respons tidak berisi JSON')).toBeNull();
  });

  it('normalizes and completes hashtags using only brief details and generic local tags', () => {
    const candidate = campaignResultSchema.safeParse(normalizeCampaignCandidate(
      { ...validResult, hashtags: ['##RotiRumahan', '#SarapanPagi', ''] },
      validRequest,
    ));

    expect(candidate.success).toBe(true);
    if (!candidate.success) return;

    expect(candidate.data.hashtags).toEqual([
      '#RotiRumahan',
      '#SarapanPagi',
      '#Rotirumahan',
      '#Tetanggasekitar',
      '#UsahaLokal',
    ]);
    expect(candidate.data.hashtags.every((tag) => /^#[\p{L}\p{N}_]+$/u.test(tag))).toBe(true);
  });

  it('uses English fallback hashtags for English campaigns', () => {
    const candidate = campaignResultSchema.safeParse(normalizeCampaignCandidate(
      { ...validResult, hashtags: [] },
      { ...validRequest, language: 'en' },
    ));

    expect(candidate.success).toBe(true);
    if (!candidate.success) return;
    expect(candidate.data.hashtags).toEqual([
      '#Rotirumahan',
      '#Tetanggasekitar',
      '#SmallBusiness',
      '#LocalBusiness',
      '#ShopLocal',
    ]);
  });

  it('drops contaminated or oversized AI hashtags and returns exactly five safe tags', () => {
    const candidate = campaignResultSchema.safeParse(normalizeCampaignCandidate(
      {
        ...validResult,
        hashtags: [
          '#RotiRumahan',
          '#SarapanPagi',
          '#assumptionswaitfixhashtags',
          '#ClientSideExecutionErrorUnableToFulfillQuery',
          '#' + 'x'.repeat(40),
        ],
      },
      validRequest,
    ));

    expect(candidate.success).toBe(true);
    if (!candidate.success) return;

    expect(candidate.data.hashtags).toEqual([
      '#RotiRumahan',
      '#SarapanPagi',
      '#Rotirumahan',
      '#Tetanggasekitar',
      '#UsahaLokal',
    ]);
    expect(candidate.data.hashtags).toHaveLength(5);
  });

  it('removes em and en dashes from all customer-facing generated copy', () => {
    const candidate = normalizeCampaignCandidate(
      {
        ...validResult,
        campaignName: 'Roti pagi — lebih praktis',
        bigIdea: 'Roti rumahan — dibuat segar.',
        instagramCaption: 'Sarapan, — lebih mudah.',
        shortVideoScript: 'Tampilkan roti — sajikan hangat.',
        whatsappMessage: 'Halo — ada roti baru.',
        storySlides: ['Pagi — cerah.', 'Roti baru – hari ini.', 'Tanya pilihan rasa.'],
        callToAction: 'Kirim pesan — kami bantu.',
        assumptions: ['Harga belum tetap — konfirmasi dahulu.'],
      },
      validRequest,
    );
    const result = campaignResultSchema.safeParse(candidate);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(JSON.stringify(result.data)).not.toMatch(/[—–]/);
    expect(result.data.instagramCaption).toBe('Sarapan, lebih mudah.');
    expect(result.data.storySlides[1]).toBe('Roti baru, hari ini.');
  });
});
