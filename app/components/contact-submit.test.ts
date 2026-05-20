import { buildEmailPayload, submitContactForm, ContactFormData } from './contact-submit';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseData: ContactFormData = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  budget: '$5k - $10k',
  message: 'I need a landing page.',
};

const nobudgetData: ContactFormData = {
  ...baseData,
  budget: '',
};

// ── buildEmailPayload ─────────────────────────────────────────────────────────

describe('buildEmailPayload', () => {
  it('always sends to the Spacze inbox', () => {
    expect(buildEmailPayload(baseData).to).toBe('spaczehq@gmail.com');
  });

  it('includes the sender name in the subject', () => {
    expect(buildEmailPayload(baseData).subject).toContain('Jane Smith');
  });

  it('includes the sender name in the body', () => {
    expect(buildEmailPayload(baseData).body).toContain('From: Jane Smith');
  });

  it('includes the budget line when budget is provided', () => {
    expect(buildEmailPayload(baseData).body).toContain('Budget: $5k - $10k');
  });

  it('omits the budget line when budget is empty', () => {
    expect(buildEmailPayload(nobudgetData).body).not.toContain('Budget:');
  });

  it('includes the message text in the body', () => {
    expect(buildEmailPayload(baseData).body).toContain('I need a landing page.');
  });
});

// ── submitContactForm ─────────────────────────────────────────────────────────

describe('submitContactForm', () => {
  function makeFetch(status: number, json: object = {}): typeof fetch {
    return jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => json,
    }) as unknown as typeof fetch;
  }

  it('returns ok:true on a 200 response', async () => {
    const result = await submitContactForm(baseData, makeFetch(200));
    expect(result).toEqual({ ok: true });
  });

  it('POSTs to /api/send-email', async () => {
    const fetchMock = makeFetch(200);
    await submitContactForm(baseData, fetchMock);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/send-email',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends Content-Type: application/json', async () => {
    const fetchMock = makeFetch(200);
    await submitContactForm(baseData, fetchMock);
    const [, init] = (fetchMock as jest.Mock).mock.calls[0];
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('serialises the payload as JSON in the request body', async () => {
    const fetchMock = makeFetch(200);
    await submitContactForm(baseData, fetchMock);
    const [, init] = (fetchMock as jest.Mock).mock.calls[0];
    const sent = JSON.parse(init.body);
    expect(sent.to).toBe('spaczehq@gmail.com');
    expect(sent.subject).toContain('Jane Smith');
    expect(sent.body).toContain('I need a landing page.');
  });

  it('returns ok:false with the API error message on a 500 response', async () => {
    const result = await submitContactForm(
      baseData,
      makeFetch(500, { error: 'Email not configured' }),
    );
    expect(result).toEqual({ ok: false, message: 'Email not configured' });
  });

  it('returns ok:false with a fallback message when the 500 body has no error field', async () => {
    const result = await submitContactForm(baseData, makeFetch(500, {}));
    expect(result).toEqual({ ok: false, message: 'Failed to send message' });
  });

  it('returns ok:false on a network error', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('Network failure'));
    const result = await submitContactForm(baseData, fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ ok: false, message: 'Network failure' });
  });

  it('returns ok:false with a generic message when the network error has no message', async () => {
    const fetchMock = jest.fn().mockRejectedValue({});
    const result = await submitContactForm(baseData, fetchMock as unknown as typeof fetch);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toBeTruthy();
  });
});
