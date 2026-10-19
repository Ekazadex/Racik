import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignBuilder } from '@/components/campaign-builder';

const sampleResult = {
  campaignName: 'A Lighter Start to the Day',
  bigIdea: 'A convenient homemade breakfast to make busy workday mornings feel a little calmer.',
  instagramCaption: 'Make room for a calmer morning with homemade banana-cinnamon granola. Pour it over yogurt, add milk, or enjoy it straight from the bowl before your workday begins.',
  shortVideoScript: 'Show a bowl of granola on a tidy desk. Pour in milk, add a spoon, and take it along for a practical breakfast before work.',
  whatsappMessage: 'Hi! Our homemade banana-cinnamon granola is made for practical breakfasts on busy mornings. Message us if you would like to learn more.',
  storySlides: ['Running out of time for breakfast?', 'Meet a homemade banana-cinnamon granola for busy mornings.', 'Message us to ask about the first 250 g pack.'],
  callToAction: 'Send us a message to ask about the first 250 g pack.',
  hashtags: ['#BreakfastIdeas', '#HomemadeGranola', '#LocalBusiness', '#SmallBusiness', '#MorningRoutine'],
  assumptions: ['Confirm the final price before sharing ordering details.'],
};

describe('CampaignBuilder', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the accessible form and a useful empty state', () => {
    render(<CampaignBuilder />);

    expect(screen.getByRole('heading', { name: /create a campaign/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name and type of your product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/who do you want to reach/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your next idea starts here' })).toBeInTheDocument();
  });

  it('switches the interface and document language between English and Indonesian', async () => {
    const user = userEvent.setup();
    render(<CampaignBuilder />);

    await user.click(screen.getByRole('button', { name: 'Bahasa Indonesia' }));
    expect(screen.getByRole('heading', { name: 'Bikin kampanye yang terasa seperti kamu.' })).toBeInTheDocument();
    expect(screen.getByLabelText('Apa nama dan jenis produkmu?')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'id');

    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('heading', { name: 'Create a campaign that feels like you.' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'en');
  });

  it('sends the selected language with a campaign request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: sampleResult }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const user = userEvent.setup();
    render(<CampaignBuilder />);

    await user.click(screen.getByRole('button', { name: 'Bahasa Indonesia' }));
    await user.click(screen.getByRole('button', { name: /isi contoh brief/i }));
    await user.click(screen.getByRole('button', { name: /racik ide kampanye/i }));

    await screen.findByRole('heading', { name: 'A Lighter Start to the Day' });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({ language: 'id' });
  });

  it('has no detectable WCAG A/AA axe violations in the initial form', async () => {
    const { container } = render(<CampaignBuilder />);
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });

  it('loads an example brief without pretending that an AI result exists', async () => {
    const user = userEvent.setup();
    render(<CampaignBuilder />);

    await user.click(screen.getByRole('button', { name: /try an example brief/i }));

    expect(screen.getByLabelText(/name and type of your product/i)).toHaveValue(
      'Homemade banana-cinnamon granola',
    );
    expect(screen.getByRole('heading', { name: 'Your next idea starts here' })).toBeInTheDocument();
  });

  it('validates the brief before making a network request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    render(<CampaignBuilder />);

    await user.click(screen.getByRole('button', { name: /generate campaign ideas/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 2 characters/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders validated campaign content returned by the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: sampleResult }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const user = userEvent.setup();
    render(<CampaignBuilder />);

    await user.click(screen.getByRole('button', { name: /try an example brief/i }));
    await user.click(screen.getByRole('button', { name: /generate campaign ideas/i }));

    expect(await screen.findByRole('heading', { name: 'A Lighter Start to the Day' })).toBeInTheDocument();
    expect(screen.getByText(sampleResult.instagramCaption)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText(/review before publishing/i)).toBeInTheDocument();
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({ language: 'en' });
  });

  it('surfaces server failures instead of showing a success-shaped result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'AI_NOT_CONFIGURED', message: 'Generator belum dikonfigurasi.' } }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const user = userEvent.setup();
    render(<CampaignBuilder />);

    await user.click(screen.getByRole('button', { name: /try an example brief/i }));
    await user.click(screen.getByRole('button', { name: /generate campaign ideas/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/not configured/i);
    expect(screen.queryByRole('heading', { name: 'A Lighter Start to the Day' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /generate campaign ideas/i })).toBeEnabled());
  });

  it('copies generated content and announces success', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: sampleResult }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(<CampaignBuilder />);

    await user.click(screen.getByRole('button', { name: /try an example brief/i }));
    await user.click(screen.getByRole('button', { name: /generate campaign ideas/i }));
    await screen.findByRole('heading', { name: 'A Lighter Start to the Day' });
    const [copyButton] = screen.getAllByRole('button', { name: 'Copy' });
    expect(copyButton).toBeDefined();
    await user.click(copyButton!);

    expect(writeText).toHaveBeenCalledWith(sampleResult.instagramCaption);
    expect(await screen.findByRole('status')).toHaveTextContent(/instagram caption copied/i);
  });

  it('shows a concise success notice when the full campaign pack is copied', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: sampleResult }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(<CampaignBuilder />);

    await user.click(screen.getByRole('button', { name: /try an example brief/i }));
    await user.click(screen.getByRole('button', { name: /generate campaign ideas/i }));
    await screen.findByRole('heading', { name: 'A Lighter Start to the Day' });
    await user.click(screen.getByRole('button', { name: 'Copy all' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(sampleResult.instagramCaption));
    expect(document.querySelector('.copy-notice')).toHaveTextContent('Campaign pack copied to clipboard.');
    expect(screen.getByRole('status')).toHaveTextContent('Campaign pack copied to clipboard.');
  });

  it('explains when clipboard access is unavailable', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard unavailable')) },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: sampleResult }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(<CampaignBuilder />);

    await user.click(screen.getByRole('button', { name: /try an example brief/i }));
    await user.click(screen.getByRole('button', { name: /generate campaign ideas/i }));
    await screen.findByRole('heading', { name: 'A Lighter Start to the Day' });
    const [copyButton] = screen.getAllByRole('button', { name: 'Copy' });
    expect(copyButton).toBeDefined();
    await user.click(copyButton!);

    expect(await screen.findByRole('status')).toHaveTextContent(/could not copy instagram caption/i);
  });
});
