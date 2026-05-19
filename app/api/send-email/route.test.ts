/**
 * Tests for the send-email route, focused on the HTML-escaping fix that
 * prevents XSS payloads from being delivered to email recipients.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

const sendMailMock = jest.fn().mockResolvedValue({});

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({ sendMail: sendMailMock })),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return {
    json: async () => body,
  } as any;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/send-email – HTML escaping', () => {
  const ENV_BACKUP = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ENV_BACKUP,
      EMAIL_FROM: 'sender@example.com',
      EMAIL_PASSWORD: 'secret',
    };
    sendMailMock.mockClear();
  });

  afterAll(() => {
    process.env = ENV_BACKUP;
  });

  async function callRoute(body: Record<string, unknown>) {
    // Re-import after resetModules so env changes take effect
    const { POST } = await import('./route');
    return POST(makeRequest(body));
  }

  it('escapes <script> tags in the body', async () => {
    const payload = '<script>alert("xss")</script>';
    await callRoute({ to: 'a@b.com', subject: 'Hi', body: payload });

    const html: string = sendMailMock.mock.calls[0][0].html;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes & characters in the body', async () => {
    await callRoute({ to: 'a@b.com', subject: 'Hi', body: 'A & B' });

    const html: string = sendMailMock.mock.calls[0][0].html;
    expect(html).not.toMatch(/[^;]&[^a-z#]/); // raw & not followed by entity
    expect(html).toContain('A &amp; B');
  });

  it('escapes double-quote characters in the body', async () => {
    await callRoute({ to: 'a@b.com', subject: 'Hi', body: 'say "hello"' });

    const html: string = sendMailMock.mock.calls[0][0].html;
    expect(html).not.toContain('"hello"');
    expect(html).toContain('&quot;hello&quot;');
  });

  it('escapes single-quote characters in the body', async () => {
    await callRoute({ to: 'a@b.com', subject: 'Hi', body: "it's fine" });

    const html: string = sendMailMock.mock.calls[0][0].html;
    expect(html).not.toContain("it's");
    expect(html).toContain('&#x27;');
  });

  it('escapes an img onerror XSS vector', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    await callRoute({ to: 'a@b.com', subject: 'Hi', body: payload });

    const html: string = sendMailMock.mock.calls[0][0].html;
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('preserves the plain-text body unchanged', async () => {
    const plain = 'Hello world\nSecond line';
    await callRoute({ to: 'a@b.com', subject: 'Hi', body: plain });

    const text: string = sendMailMock.mock.calls[0][0].text;
    expect(text).toBe(plain);
  });

  it('wraps each newline-separated line in a <p> tag', async () => {
    await callRoute({ to: 'a@b.com', subject: 'Hi', body: 'Line one\nLine two' });

    const html: string = sendMailMock.mock.calls[0][0].html;
    expect(html).toContain('<p style="margin: 0 0 12px 0;">Line one</p>');
    expect(html).toContain('<p style="margin: 0 0 12px 0;">Line two</p>');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await callRoute({ to: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('returns 500 when EMAIL_FROM is not configured', async () => {
    delete process.env.EMAIL_FROM;
    const res = await callRoute({ to: 'a@b.com', subject: 'Hi', body: 'Hello' });
    expect(res.status).toBe(500);
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
