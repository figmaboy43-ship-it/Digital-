import { sendEmail } from './emailService';

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
    .btn { display: inline-block; padding: 10px 20px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="color: #059669; margin: 0;">Digital Services SaaS</h2>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>This is an automated message, please do not reply directly to this email.</p>
    <p>&copy; ${new Date().getFullYear()} Digital Services SaaS. All rights reserved.</p>
  </div>
</body>
</html>
`;

export const sendOrderConfirmationEmail = async (to: string, orderId: string, amount: number) => {
  const content = `
    <h3>Order Confirmation</h3>
    <p>Thank you for your order!</p>
    <p>We have successfully received your order (<strong>${orderId.split('-')[0]}</strong>).</p>
    <p><strong>Total Amount:</strong> ৳${amount.toFixed(2)}</p>
    <p>We will notify you once processing begins.</p>
  `;
  return sendEmail({ to, subject: 'Order Confirmation', html: baseTemplate(content), type: 'order_created' });
};

export const sendPaymentReceivedEmail = async (to: string, paymentId: string, amount: number) => {
  const content = `
    <h3>Payment Received</h3>
    <p>Your deposit request has been received.</p>
    <p><strong>Payment ID:</strong> ${paymentId.split('-')[0]}</p>
    <p><strong>Amount:</strong> ৳${amount.toFixed(2)}</p>
    <p>Our team is currently verifying this transaction. You will be notified once it is approved.</p>
  `;
  return sendEmail({ to, subject: 'Payment Received', html: baseTemplate(content), type: 'payment_received' });
};

export const sendTicketUpdatedEmail = async (to: string, ticketNumber: string, status: string) => {
  const content = `
    <h3>Support Ticket Update</h3>
    <p>There has been an update to your support ticket <strong>${ticketNumber}</strong>.</p>
    <p><strong>New Status:</strong> ${status.replace('_', ' ').toUpperCase()}</p>
    <p>Please log in to your dashboard to view the latest messages.</p>
  `;
  return sendEmail({ to, subject: `Update on Ticket ${ticketNumber}`, html: baseTemplate(content), type: 'ticket_update' });
};
