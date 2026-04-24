import PolicyLayout, { Section, List } from "./PolicyLayout";

export default function CookiePolicy() {
  return (
    <PolicyLayout title="Cookie Policy" lastUpdated="April 24, 2026">
      <Section title="1. What Are Cookies">
        <p>Cookies are small text files stored on your device to help websites function properly.</p>
      </Section>

      <Section title="2. How We Use Cookies">
        <p>Inventory Manager uses session cookies only for:</p>
        <List items={[
          "User authentication",
          "Maintaining login sessions",
        ]} />
      </Section>

      <Section title="3. No Tracking or Advertising">
        <p>We do not use:</p>
        <List items={[
          "Tracking cookies",
          "Advertising cookies",
          "Third-party analytics cookies",
        ]} />
      </Section>

      <Section title="4. Managing Cookies">
        <p>You can disable cookies through your browser settings. However, disabling cookies may prevent login and proper functioning of the application.</p>
      </Section>

      <Section title="5. Changes to This Policy">
        <p>We may update this Cookie Policy as needed. Continued use of the service implies acceptance of any changes.</p>
      </Section>
    </PolicyLayout>
  );
}
