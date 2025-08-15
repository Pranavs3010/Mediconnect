import Mailgun from "mailgun.js";
import formData from "form-data";
import twilio from "twilio";

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendEmail = async (to, subject, text) => {
  try {
    await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `MediConnect <mailgun@${process.env.MAILGUN_DOMAIN}>`,
      to: [to],
      subject: subject,
      text: text,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendSms = async (to, body) => {
  try {
    // Ensure the 'to' number is in E.164 format (e.g., +14155238886)
    if (!to.startsWith("+")) {
      console.error(
        "Invalid phone number format for SMS. Must be in E.164 format."
      );
      return;
    }
    await twilioClient.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log(`SMS sent to ${to}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
};
