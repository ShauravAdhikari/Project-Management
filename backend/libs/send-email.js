import sgMail from "@sendgrid/mail";
import {
  fromEmail,
  isEmailEnabled,
  sendGridApiKey,
  shouldBypassEmail,
} from "./runtime-config.js";

if (isEmailEnabled) {
  sgMail.setApiKey(sendGridApiKey);
} else if (!shouldBypassEmail) {
  console.warn(
    "SendGrid email delivery is disabled because SEND_GRID_API or FROM_EMAIL is missing."
  );
}

export const sendEmail = async (to, subject, html) => {
  if (shouldBypassEmail) {
    console.log(
      `Skipping email in development because SendGrid is not configured: ${subject} -> ${to}`
    );
    return true;
  }

  if (!isEmailEnabled) {
    console.error(
      "Email delivery failed because SEND_GRID_API or FROM_EMAIL is missing."
    );
    return false;
  }

  const msg = {
    to,
    from: `Yutani Foundation <${fromEmail}>`,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent successfully");

    return true;
  } catch (error) {
    console.error("Error sending email:", error);

    return false;
  }
};
