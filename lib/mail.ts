import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendTestimonialRequest({
    to,
    customerName,
    productName,
    submitLink,
    ownerPlan
}: {
    to: string,
    customerName?: string,
    productName: string,
    submitLink: string,
    ownerPlan?: string
}) {
    const name = customerName || 'there';
    const isFreePlan = (ownerPlan || 'free').toLowerCase() === 'free';
    const senderName = `${productName} Team`;
    const subtleAttributionText = isFreePlan ? '\n\nSent via Testio' : '';
    const subtleAttributionHtml = isFreePlan
        ? `<tr><td style="padding:4px 24px 20px;"><p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">Sent via Testio</p></td></tr>`
        : '';

    const mailOptions = {
        from: `"${senderName}" <${process.env.SMTP_FROM || 'noreply@testio.io'}>`,
        to,
        subject: `Quick feedback request for ${productName}`,
        text: `Hi ${name},\n\nWe'd love to hear your feedback about ${productName}. Could you take 30 seconds to share your experience?\n\nSubmit here: ${submitLink}\n\nBest,\nThe ${productName} Team${subtleAttributionText}`,
        html: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e7eaf3;border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <tr>
                <td style="padding:22px 24px;background:linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%);">
                  <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#ddd6fe;font-weight:700;">${productName}</div>
                  <div style="margin-top:8px;font-size:22px;line-height:1.25;font-weight:800;color:#ffffff;">Quick favor, ${name}?</div>
                </td>
              </tr>
              <tr>
                <td style="padding:26px 24px 8px;">
                  <p style="margin:0;font-size:16px;line-height:1.75;color:#1f2937;">
                    We'd love to hear your feedback on <strong>${productName}</strong> and how your experience has been.
                  </p>
                  <p style="margin:14px 0 0;font-size:16px;line-height:1.75;color:#1f2937;">
                    Could you take 30 seconds to share a quick response? It helps us a lot.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px 8px;">
                  <a href="${submitLink}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:10px;">
                    Share Feedback
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 24px 24px;">
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
                    Thanks for being a customer,<br>
                    <strong style="color:#111827;">The ${productName} Team</strong>
                  </p>
                </td>
              </tr>
              ${subtleAttributionHtml}
            </table>
          </td>
        </tr>
      </table>
    `,
    };

    return await transporter.sendMail(mailOptions);
}

export async function sendReminderRequest({
    to,
    customerName,
    productName,
    submitLink,
    ownerPlan
}: {
    to: string,
    customerName?: string,
    productName: string,
    submitLink: string,
    ownerPlan?: string
}) {
    const name = customerName || 'there';
    const isFreePlan = (ownerPlan || 'free').toLowerCase() === 'free';
    const senderName = `${productName} Team`;
    const subtleAttributionText = isFreePlan ? '\n\nSent via Testio' : '';
    const subtleAttributionHtml = isFreePlan
        ? `<tr><td style="padding:4px 24px 20px;"><p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">Sent via Testio</p></td></tr>`
        : '';

    const mailOptions = {
        from: `"${senderName}" <${process.env.SMTP_FROM || 'noreply@testio.io'}>`,
        to,
        subject: `Friendly reminder: Share feedback on ${productName}`,
        text: `Hi ${name},\n\nJust a quick follow up in case you had a moment to share your feedback on ${productName}.\n\nSubmit here: ${submitLink}\n\nThanks again!${subtleAttributionText}`,
        html: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e7eaf3;border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <tr>
                <td style="padding:22px 24px;background:linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%);">
                  <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#ddd6fe;font-weight:700;">${productName}</div>
                  <div style="margin-top:8px;font-size:22px;line-height:1.25;font-weight:800;color:#ffffff;">Friendly reminder, ${name}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:26px 24px 8px;">
                  <p style="margin:0;font-size:16px;line-height:1.75;color:#1f2937;">
                    Just a quick follow-up in case you missed our earlier email.
                  </p>
                  <p style="margin:14px 0 0;font-size:16px;line-height:1.75;color:#1f2937;">
                    If you have 30 seconds, we'd really appreciate your feedback on <strong>${productName}</strong>.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px 8px;">
                  <a href="${submitLink}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:10px;">
                    Share Feedback
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 24px 24px;">
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
                    We promise this is our last follow-up.<br>
                    <strong style="color:#111827;">The ${productName} Team</strong>
                  </p>
                </td>
              </tr>
              ${subtleAttributionHtml}
            </table>
          </td>
        </tr>
      </table>
    `,
    };

    return await transporter.sendMail(mailOptions);
}
