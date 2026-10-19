import type { CampaignRequest } from '@/lib/campaign-schema';

export type Language = 'en' | 'id';

const indonesianApiErrors: Record<string, string> = {};

export const translations = {
  en: {
    language: 'Language',
    skip: 'Skip to main content',
    header: 'Campaign studio for small businesses',
    eyebrow: 'Your brief in, campaign ideas out',
    title: 'Create a campaign that feels like you.',
    intro:
      'Tell us about your product. Racik helps you shape ideas and content for multiple channels, while you stay in control before anything is published.',
    stampLabel: 'Made for Indonesian small businesses',
    local: 'local',
    madeFor: 'made to',
    grow: 'grow',
    workspace: 'Campaign studio',
    briefTitle: 'Tell us about your product',
    productLabel: 'What is the name and type of your product?',
    productPlaceholder: 'Example: Homemade banana-cinnamon granola',
    privacyHint: 'Do not include customer data or business secrets.',
    audienceLabel: 'Who do you want to reach?',
    audiencePlaceholder: 'Example: Office workers looking for a practical breakfast',
    offerLabel: 'Any offer or important details?',
    offerPlaceholder: 'Optional. Add confirmed facts, such as size or promotion dates.',
    offerHint: 'AI will not invent prices or claims you have not provided.',
    goalLabel: 'Campaign goal',
    goals: { awareness: 'Introduce a product', conversion: 'Drive sales', launch: 'Launch a product' },
    toneLabel: 'Tone of voice',
    tones: {
      hangat: 'Warm & friendly',
      ceria: 'Cheerful & light',
      premium: 'Polished & premium',
      santai: 'Casual & straightforward',
    },
    sample: 'Try an example brief',
    privacy: 'Your brief is only sent to generate content.',
    generate: 'Generate campaign ideas',
    regenerate: 'Regenerate campaign',
    generating: 'Creating your campaign…',
    resultTitle: 'Your campaign pack',
    copyAll: 'Copy all',
    copied: 'Copied',
    loadingTitle: 'Putting your ideas together…',
    loadingHint: 'This usually takes a few seconds.',
    campaignDirection: 'Campaign direction',
    instagram: 'Instagram caption',
    video: 'Short video script',
    whatsapp: 'WhatsApp message',
    stories: 'Instagram Stories · 3 slides',
    callToAction: 'Call to action & hashtags',
    review: 'Review before publishing',
    emptyTitle: 'Your next idea starts here',
    emptyHint: 'Complete the brief to get campaign ideas and three content formats ready for you to edit.',
    footer: 'Racik · A creative aid, not a substitute for your judgment.',
    footerNote: 'Always verify facts, prices, and claims before publishing.',
    copy: 'Copy',
    copyAllSucceeded: 'Campaign pack copied to clipboard.',
    copyAllFailed: 'Could not copy your campaign pack. Select and copy the text manually.',
    copySucceeded: (label: string) => `${label} copied.`,
    copyFailed: (label: string) => `Could not copy ${label}. Select and copy the text manually.`,
    ready: 'Campaign pack ready. Results are shown in the panel on the right.',
    briefError: 'Enter a product name and audience of at least 2 characters.',
    invalidResult: 'The result could not be displayed. Please generate the campaign again.',
    requestError: 'The campaign could not be created. Please try again.',
    networkError: 'Connection problem. Check your internet connection and try again.',
    apiErrors: {
      INVALID_CONTENT_TYPE: 'Send the brief in JSON format.',
      REQUEST_TOO_LARGE: 'The brief is too long.',
      EMPTY_REQUEST: 'No brief was received.',
      REQUEST_READ_FAILED: 'The request could not be read.',
      INVALID_JSON: 'The request could not be understood.',
      INVALID_BRIEF: 'Check your brief. Product name and audience must each have at least 2 characters.',
      RATE_LIMIT_NOT_CONFIGURED: 'The generator is not ready for public use. Please try again later.',
      CLIENT_ADDRESS_UNAVAILABLE: 'Usage limits could not be checked. Please try again later.',
      RATE_LIMITED: 'The limit of 5 briefs per minute has been reached. Please wait and try again.',
      RATE_LIMIT_UNAVAILABLE: 'Usage limiting is temporarily unavailable. Please try again later.',
      AI_NOT_CONFIGURED: 'The generator is not configured. Please try again later.',
      AI_TIMEOUT: 'The AI took too long to respond. Please try again.',
      AI_UNAVAILABLE: 'Could not connect to the AI service. Please try again.',
      AI_RATE_LIMITED: 'The AI service is busy. Please wait and try again.',
      AI_REQUEST_REJECTED: 'The AI service could not process this request. Please try again.',
      AI_EMPTY_RESPONSE: 'The AI did not return a usable result. Try changing the brief.',
      AI_INVALID_JSON: 'The AI returned an invalid format. Please generate the campaign again.',
      AI_INVALID_OUTPUT: 'The AI result did not pass validation. Please try again.',
      AI_INVALID_RESULT: 'The AI result did not pass validation. Please try again.',
      CAMPAIGN_GENERATION_FAILED: 'The campaign could not be created. Please try again.',
    } as Record<string, string>,
  },
  id: {
    language: 'Bahasa',
    skip: 'Lewati ke konten utama',
    header: 'Studio kampanye untuk usaha kecil',
    eyebrow: 'Brief masuk, ide kampanye keluar',
    title: 'Bikin kampanye yang terasa seperti kamu.',
    intro:
      'Ceritakan produkmu. Racik membantu menyiapkan ide dan konten untuk beberapa kanal. Kamu tetap memegang kendali sebelum konten dipublikasikan.',
    stampLabel: 'Dibuat untuk UMKM Indonesia',
    local: 'lokal',
    madeFor: 'dibuat untuk',
    grow: 'tumbuh',
    workspace: 'Studio kampanye',
    briefTitle: 'Kenali produkmu',
    productLabel: 'Apa nama dan jenis produkmu?',
    productPlaceholder: 'Contoh: Granola rumahan rasa pisang',
    privacyHint: 'Hindari memasukkan data pelanggan atau rahasia usaha.',
    audienceLabel: 'Siapa yang ingin kamu jangkau?',
    audiencePlaceholder: 'Contoh: Pekerja kantoran yang butuh sarapan praktis',
    offerLabel: 'Ada penawaran atau detail penting?',
    offerPlaceholder: 'Opsional. Tulis fakta yang sudah pasti, misalnya ukuran atau periode promo.',
    offerHint: 'AI tidak akan mengarang harga atau klaim yang belum kamu berikan.',
    goalLabel: 'Tujuan kampanye',
    goals: { awareness: 'Kenalkan produk', conversion: 'Dorong penjualan', launch: 'Luncurkan produk' },
    toneLabel: 'Nada bicara',
    tones: {
      hangat: 'Hangat & akrab',
      ceria: 'Ceria & ringan',
      premium: 'Rapi & premium',
      santai: 'Santai & apa adanya',
    },
    sample: 'Isi contoh brief',
    privacy: 'Brief hanya dikirim untuk membuat konten.',
    generate: 'Racik ide kampanye',
    regenerate: 'Racik ulang kampanye',
    generating: 'Sedang meracik…',
    resultTitle: 'Paket kampanyemu',
    copyAll: 'Salin semua',
    copied: 'Tersalin',
    loadingTitle: 'Meracik ide yang pas…',
    loadingHint: 'Biasanya hanya perlu beberapa detik.',
    campaignDirection: 'Arah kampanye',
    instagram: 'Caption Instagram',
    video: 'Naskah video pendek',
    whatsapp: 'Pesan WhatsApp',
    stories: 'Instagram Story · 3 slide',
    callToAction: 'Ajakan & hashtag',
    review: 'Periksa sebelum dipublikasikan',
    emptyTitle: 'Idemu mulai dari sini',
    emptyHint: 'Isi brief singkat untuk menerima ide dan tiga format konten yang siap kamu sunting.',
    footer: 'Racik · Alat bantu ide, bukan pengganti penilaianmu.',
    footerNote: 'Selalu periksa fakta, harga, dan klaim sebelum konten dipublikasikan.',
    copy: 'Salin',
    copyAllSucceeded: 'Paket kampanye berhasil disalin.',
    copyAllFailed: 'Paket kampanye gagal disalin. Pilih lalu salin teks secara manual.',
    copySucceeded: (label: string) => `${label} berhasil disalin.`,
    copyFailed: (label: string) => `Gagal menyalin ${label}. Pilih dan salin teks secara manual.`,
    ready: 'Paket kampanye siap. Hasil ditampilkan di panel sebelah kanan.',
    briefError: 'Isi nama produk dan audiens dengan minimal 2 karakter sebelum melanjutkan.',
    invalidResult: 'Format hasil belum bisa ditampilkan. Coba buat paket kampanye sekali lagi.',
    requestError: 'Paket kampanye belum berhasil dibuat. Coba lagi.',
    networkError: 'Koneksi bermasalah. Periksa internet dan coba lagi.',
    apiErrors: indonesianApiErrors,
  },
} satisfies Record<Language, {
  language: string;
  skip: string;
  header: string;
  eyebrow: string;
  title: string;
  intro: string;
  stampLabel: string;
  local: string;
  madeFor: string;
  grow: string;
  workspace: string;
  briefTitle: string;
  productLabel: string;
  productPlaceholder: string;
  privacyHint: string;
  audienceLabel: string;
  audiencePlaceholder: string;
  offerLabel: string;
  offerPlaceholder: string;
  offerHint: string;
  goalLabel: string;
  goals: Record<CampaignRequest['goal'], string>;
  toneLabel: string;
  tones: Record<CampaignRequest['tone'], string>;
  sample: string;
  privacy: string;
  generate: string;
  regenerate: string;
  generating: string;
  resultTitle: string;
  copyAll: string;
  copied: string;
  loadingTitle: string;
  loadingHint: string;
  campaignDirection: string;
  instagram: string;
  video: string;
  whatsapp: string;
  stories: string;
  callToAction: string;
  review: string;
  emptyTitle: string;
  emptyHint: string;
  footer: string;
  footerNote: string;
  copy: string;
  copyAllSucceeded: string;
  copyAllFailed: string;
  copySucceeded: (label: string) => string;
  copyFailed: (label: string) => string;
  ready: string;
  briefError: string;
  invalidResult: string;
  requestError: string;
  networkError: string;
  apiErrors: Record<string, string>;
}>;
