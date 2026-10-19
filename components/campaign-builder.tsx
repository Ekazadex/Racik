'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, CircleAlert, CircleCheck, Clipboard, Leaf, LockKeyhole, Sparkles } from 'lucide-react';
import {
  campaignRequestSchema,
  campaignResultSchema,
  type CampaignRequest,
  type CampaignResult,
} from '@/lib/campaign-schema';
import { translations, type Language } from '@/lib/translations';

const initialBrief = (language: Language): CampaignRequest => ({
  language,
  product: '',
  audience: '',
  goal: 'conversion',
  offer: '',
  tone: 'hangat',
});

function getApiErrorCode(payload: unknown): string | undefined {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('error' in payload) ||
    typeof payload.error !== 'object' ||
    payload.error === null ||
    !('code' in payload.error) ||
    typeof payload.error.code !== 'string'
  ) {
    return undefined;
  }

  return payload.error.code;
}

export function CampaignBuilder() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const [brief, setBrief] = useState<CampaignRequest>(() => initialBrief('en'));
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [copyNotice, setCopyNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const copyTimer = useRef<number | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => () => {
    if (copyTimer.current !== null) {
      window.clearTimeout(copyTimer.current);
    }
  }, []);

  const updateBrief = <Key extends keyof CampaignRequest>(key: Key, value: CampaignRequest[Key]) => {
    setBrief((current) => ({ ...current, [key]: value }));
  };

  const clearCopyNotice = () => {
    if (copyTimer.current !== null) {
      window.clearTimeout(copyTimer.current);
      copyTimer.current = null;
    }
    setCopiedKey('');
    setCopyNotice(null);
  };

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    updateBrief('language', nextLanguage);
    setErrorMessage('');
    setAnnouncement('');
    clearCopyNotice();
  };

  const loadSampleBrief = () => {
    clearCopyNotice();
    setBrief({
      language,
      product:
        language === 'en'
          ? 'Homemade banana-cinnamon granola'
          : 'Granola rumahan rasa pisang kayu manis',
      audience:
        language === 'en'
          ? 'Office workers looking for a practical breakfast'
          : 'Pekerja kantoran yang mencari sarapan praktis',
      goal: 'launch',
      offer:
        language === 'en'
          ? 'First 250 g pack; price not set yet'
          : 'Kemasan perdana 250 gram; harga belum ditentukan',
      tone: 'hangat',
    });
    setErrorMessage('');
    setResult(null);
  };

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setAnnouncement('');
    clearCopyNotice();

    const parsedBrief = campaignRequestSchema.safeParse(brief);
    if (!parsedBrief.success) {
      setErrorMessage(t.briefError);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBrief.data),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const code = getApiErrorCode(payload);
        throw new Error((code && (t.apiErrors[code] || (language === 'id' ? getApiErrorMessage(payload) : undefined))) || t.requestError);
      }

      const data =
        typeof payload === 'object' && payload !== null && 'data' in payload
          ? campaignResultSchema.safeParse(payload.data)
          : null;
      if (!data?.success) {
        throw new Error(t.invalidResult);
      }

      setResult(data.data);
      setAnnouncement(t.ready);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t.networkError,
      );
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = async (key: string, label: string, text: string) => {
    clearCopyNotice();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      const message = key === 'all' ? t.copyAllSucceeded : t.copySucceeded(label);
      setAnnouncement(message);
      setCopyNotice({ type: 'success', message });
    } catch {
      const message = key === 'all' ? t.copyAllFailed : t.copyFailed(label);
      setAnnouncement(message);
      setCopyNotice({ type: 'error', message });
    }
    copyTimer.current = window.setTimeout(() => {
      setCopiedKey('');
      setCopyNotice(null);
      copyTimer.current = null;
    }, 2200);
  };

  function getApiErrorMessage(payload: unknown): string | undefined {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('error' in payload) ||
      typeof payload.error !== 'object' ||
      payload.error === null ||
      !('message' in payload.error) ||
      typeof payload.error.message !== 'string'
    ) {
      return undefined;
    }
    return payload.error.message;
  }

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <div className="shell">
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">r.</span>
            racik
          </Link>
          <span className="topbar-note">
            <Leaf size={15} aria-hidden="true" />
            {t.header}
          </span>
          <div className="language-switch" role="group" aria-label={t.language}>
            <button
              type="button"
              aria-label="English"
              aria-pressed={language === 'en'}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
            <button
              type="button"
              aria-pressed={language === 'id'}
              aria-label="Bahasa Indonesia"
              onClick={() => changeLanguage('id')}
            >
              ID
            </button>
          </div>
        </header>

        <main id="main" tabIndex={-1}>
          <section className="hero" aria-labelledby="page-title">
            <div>
              <p className="eyebrow">{t.eyebrow}</p>
              <h1 id="page-title">{t.title}</h1>
              <p className="hero-copy">{t.intro}</p>
            </div>
            <div className="hero-stamp" aria-label={t.stampLabel}>
              <strong>{t.local}</strong>
              <span>{t.madeFor}</span>
              <strong>{t.grow}</strong>
            </div>
          </section>

          <section className="workspace" aria-label={t.workspace}>
            <section className="panel" aria-labelledby="brief-title">
              <div className="panel-header">
                <span className="step-number" aria-hidden="true">01</span>
                <h2 id="brief-title">{t.briefTitle}</h2>
              </div>

              <form className="form-body" onSubmit={generate} noValidate>
                <div className="field">
                  <label className="field-label" htmlFor="product">{t.productLabel}</label>
                  <input
                    className="control"
                    id="product"
                    name="product"
                    autoComplete="off"
                    maxLength={80}
                    placeholder={t.productPlaceholder}
                    value={brief.product}
                    onChange={(event) => updateBrief('product', event.currentTarget.value)}
                    aria-describedby="product-hint"
                  />
                  <p className="field-hint" id="product-hint">{t.privacyHint}</p>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="audience">{t.audienceLabel}</label>
                  <input
                    className="control"
                    id="audience"
                    name="audience"
                    autoComplete="off"
                    maxLength={160}
                    placeholder={t.audiencePlaceholder}
                    value={brief.audience}
                    onChange={(event) => updateBrief('audience', event.currentTarget.value)}
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="offer">{t.offerLabel}</label>
                  <textarea
                    className="control"
                    id="offer"
                    name="offer"
                    maxLength={240}
                    placeholder={t.offerPlaceholder}
                    value={brief.offer}
                    onChange={(event) => updateBrief('offer', event.currentTarget.value)}
                  />
                  <p className="field-hint">{t.offerHint}</p>
                </div>

                <div className="field-pair">
                  <div className="field">
                    <label className="field-label" htmlFor="goal">{t.goalLabel}</label>
                    <select
                      className="control"
                      id="goal"
                      value={brief.goal}
                      onChange={(event) =>
                        updateBrief('goal', campaignRequestSchema.shape.goal.parse(event.currentTarget.value))
                      }
                    >
                      {Object.entries(t.goals).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="tone">{t.toneLabel}</label>
                    <select
                      className="control"
                      id="tone"
                      value={brief.tone}
                      onChange={(event) =>
                        updateBrief('tone', campaignRequestSchema.shape.tone.parse(event.currentTarget.value))
                      }
                    >
                      {Object.entries(t.tones).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-footer">
                  <button
                    className="sample-button"
                    type="button"
                    onClick={loadSampleBrief}
                  >
                    {t.sample} <ArrowUpRight size={13} aria-hidden="true" />
                  </button>
                  <span className="privacy-note">
                    <LockKeyhole size={13} aria-hidden="true" />
                    {t.privacy}
                  </span>
                </div>

                <button className="button button-primary submit-button" type="submit" disabled={isLoading}>
                  <Sparkles size={16} aria-hidden="true" />
                  {isLoading ? t.generating : result ? t.regenerate : t.generate}
                </button>
              </form>

              {errorMessage ? (
                <div className="alert" role="alert" tabIndex={-1} ref={errorRef}>
                  {errorMessage}
                </div>
              ) : null}
            </section>

            <section className="panel result-panel" aria-labelledby="result-title">
              <div className="panel-header result-header">
                <div className="result-heading">
                  <span className="step-number" aria-hidden="true">02</span>
                  <h2 id="result-title">{t.resultTitle}</h2>
                </div>
                {result ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => copyText('all', t.copyAll, [
                      result.campaignName,
                      result.bigIdea,
                      result.instagramCaption,
                      result.shortVideoScript,
                      result.whatsappMessage,
                      ...result.storySlides,
                      result.callToAction,
                      result.hashtags.join(' '),
                    ].join('\n\n'))}
                  >
                    {copiedKey === 'all' ? <Check size={14} /> : <Clipboard size={14} aria-hidden="true" />}
                    {copiedKey === 'all' ? t.copied : t.copyAll}
                  </button>
                ) : null}
              </div>

              <div className="result-body">
                <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
                {copyNotice ? (
                  <div className={`copy-notice copy-notice-${copyNotice.type}`} aria-hidden="true">
                    {copyNotice.type === 'success'
                      ? <CircleCheck size={16} aria-hidden="true" />
                      : <CircleAlert size={16} aria-hidden="true" />}
                    <span>{copyNotice.message}</span>
                  </div>
                ) : null}
                {isLoading ? (
                  <div className="loading-state" role="status" aria-live="polite">
                    <span className="spinner" aria-hidden="true" />
                    <strong>{t.loadingTitle}</strong>
                    <span>{t.loadingHint}</span>
                  </div>
                ) : result ? (
                  <div className="result-content">
                    <div className="campaign-intro">
                      <p className="eyebrow">{t.campaignDirection}</p>
                      <h3>{result.campaignName}</h3>
                      <p>{result.bigIdea}</p>
                    </div>
                    <ContentCard
                      title={t.instagram}
                      text={result.instagramCaption}
                      onCopy={() => copyText('instagram', t.instagram, result.instagramCaption)}
                      copied={copiedKey === 'instagram'}
                      copyLabel={t.copy}
                      copiedLabel={t.copied}
                    />
                    <ContentCard
                      title={t.video}
                      text={result.shortVideoScript}
                      onCopy={() => copyText('video', t.video, result.shortVideoScript)}
                      copied={copiedKey === 'video'}
                      copyLabel={t.copy}
                      copiedLabel={t.copied}
                    />
                    <ContentCard
                      title={t.whatsapp}
                      text={result.whatsappMessage}
                      onCopy={() => copyText('whatsapp', t.whatsapp, result.whatsappMessage)}
                      copied={copiedKey === 'whatsapp'}
                      copyLabel={t.copy}
                      copiedLabel={t.copied}
                    />
                    <div className="content-card">
                      <div className="content-card-heading"><h3>{t.stories}</h3></div>
                      <ol className="story-list">
                        {result.storySlides.map((slide, index) => (
                          <li key={index}><span>{index + 1}</span><span>{slide}</span></li>
                        ))}
                      </ol>
                    </div>
                    <div className="content-card">
                      <div className="content-card-heading"><h3>{t.callToAction}</h3></div>
                      <p>{result.callToAction}</p>
                      <p className="hashtags hashtags-spaced">{result.hashtags.join(' ')}</p>
                    </div>
                    {result.assumptions.length > 0 ? (
                      <div className="assumption-note">
                        <strong>{t.review}</strong>
                        <ul>{result.assumptions.map((assumption, index) => <li key={index}>{assumption}</li>)}</ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-illustration"><Sparkles size={25} aria-hidden="true" /></span>
                    <h3>{t.emptyTitle}</h3>
                    <p>{t.emptyHint}</p>
                  </div>
                )}
              </div>
            </section>
          </section>
        </main>

        <footer className="site-footer">
          <p>{t.footer}</p>
          <p>{t.footerNote}</p>
        </footer>
      </div>
    </>
  );
}

function ContentCard({
  title,
  text,
  onCopy,
  copied,
  copyLabel,
  copiedLabel,
}: {
  title: string;
  text: string;
  onCopy: () => void;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <div className="content-card">
      <div className="content-card-heading">
        <h3>{title}</h3>
        <button type="button" className="button button-secondary" onClick={onCopy}>
          {copied ? <Check size={14} aria-hidden="true" /> : <Clipboard size={14} aria-hidden="true" />}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <p>{text}</p>
    </div>
  );
}
