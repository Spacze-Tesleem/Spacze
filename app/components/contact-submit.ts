/**
 * Pure submission logic for the homepage contact form.
 * Extracted so it can be unit-tested without a DOM or React renderer.
 */

export interface ContactFormData {
  name: string;
  email: string;
  budget: string;
  message: string;
}

export interface SubmitResult {
  ok: true;
}

export interface SubmitError {
  ok: false;
  message: string;
}

/** Build the email payload from raw form data. */
export function buildEmailPayload(data: ContactFormData): {
  to: string;
  subject: string;
  body: string;
} {
  const budgetLine = data.budget ? `Budget: ${data.budget}\n` : '';
  const body = `From: ${data.name}\n${budgetLine}\n${data.message}`;
  const subject = `New enquiry from ${data.name}`;
  return { to: 'spaczehq@gmail.com', subject, body };
}

/** Submit the contact form by calling /api/send-email. */
export async function submitContactForm(
  data: ContactFormData,
  fetchFn: typeof fetch = fetch,
): Promise<SubmitResult | SubmitError> {
  const payload = buildEmailPayload(data);

  let res: Response;
  try {
    res = await fetchFn('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : 'Network error. Please try again.' };
  }

  if (!res.ok) {
    let message = 'Failed to send message';
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch {
      // response body not JSON — keep default message
    }
    return { ok: false, message };
  }

  return { ok: true };
}
