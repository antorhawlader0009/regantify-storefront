// "Report" on a shopper-written review, an answered question, or an answer of the store's AI chat (Google Play's user-generated and
// AI-generated content rules, STORE-APP-plan.md Step 4). Sent from the browser, no account; the server limits floods per address.

export type ContentReportKind = 'REVIEW' | 'QUESTION' | 'AI_ANSWER';
export type ContentReportReason = 'SPAM' | 'OFFENSIVE' | 'FALSE_INFO' | 'PRIVATE_INFO' | 'OTHER';

/** The reasons, in the order they are offered. The labels are English keys for StorePal's `t()`. */
export const CONTENT_REPORT_REASONS: Array<{ id: ContentReportReason; label: string }> = [
  { id: 'SPAM', label: 'Spam or an advertisement' },
  { id: 'OFFENSIVE', label: 'Offensive, hateful or harmful' },
  { id: 'FALSE_INFO', label: 'Wrong or misleading' },
  { id: 'PRIVATE_INFO', label: "Shows someone's private details" },
  { id: 'OTHER', label: 'Something else' },
];

export async function submitContentReport(
  subdomain: string,
  body: { kind: ContentReportKind; targetId?: string; reason: ContentReportReason; note?: string; excerpt?: string },
): Promise<void> {
  const origin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? `${window.location.protocol}//${window.location.hostname}:4000`;
  const res = await fetch(`${origin}/v1/store/${encodeURIComponent(subdomain)}/content-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new Error(message || 'Could not send your report. Please try again.');
  }
}
