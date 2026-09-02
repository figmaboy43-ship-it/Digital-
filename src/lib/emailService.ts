/**
 * Email Service for the SaaS platform.
 * Sends emails securely via our Express backend endpoint.
 */

export const sendEmail = async ({
  to,
  subject,
  html,
  type
}: {
  to: string;
  subject: string;
  html: string;
  type?: string;
}) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html, type }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[EMAIL SENT] to: ${to}, subject: ${subject}`);
    return result.success;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};
