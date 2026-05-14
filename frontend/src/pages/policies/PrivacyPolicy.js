import PolicyLayout, { Section, List } from "./PolicyLayout";

export default function PrivacyPolicy() {
  return (
    <PolicyLayout title="Privacy Policy" lastUpdated="April 24, 2026">
      <Section title="1. Introduction">
        <p>Inventory Manager ("we", "our", "us") provides a web-based inventory and production management platform for businesses. This Privacy Policy explains how we collect, use, and protect your information.</p>
      </Section>

      <Section title="2. Information We Collect">
        <p>We collect only the data necessary to provide authentication and access to the platform:</p>
        <List items={[
          "Name (from Google OAuth)",
          "Email address (from Google OAuth)",
          "Profile picture / avatar (from Google OAuth)",
        ]} />
        <p>We do not collect sensitive personal data such as passwords — Google handles authentication entirely.</p>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use your data only for:</p>
        <List items={[
          "User authentication and login",
          "Identifying users within the application",
          "Providing access to your account and data",
        ]} />
        <p>We do not sell, rent, or share your personal information with third parties.</p>
      </Section>

      <Section title="4. Data Storage and Security">
        <p>Your data is stored securely using MongoDB Atlas. We take reasonable technical measures to protect your data from unauthorized access or misuse.</p>
      </Section>

      <Section title="5. Data Sharing">
        <p>We do not share your personal data with any third party except when required by law.</p>
      </Section>

      <Section title="6. User Rights">
        <p>You have the right to:</p>
        <List items={[
          "Request deletion of your account and associated data",
          "Request access to your stored data",
        ]} />
        <p>To make such requests, contact us using the email below.</p>
      </Section>

      <Section title="7. Data Retention">
        <p>We retain your data only as long as your account is active or as required for legal purposes.</p>
      </Section>

      <Section title="8. Contact Us">
        <p>If you have any questions about this Privacy Policy, contact us at:</p>
        <p><strong>Contact:</strong>+91 9879074592</p>
        <p><strong>Email:</strong> <a href="mailto:Info.yamatri@gmail.com">Info.yamatri@gmail.com</a></p>
      </Section>
    </PolicyLayout>
  );
}
