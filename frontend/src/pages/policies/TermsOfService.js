import PolicyLayout, { Section, List } from "./PolicyLayout";

export default function TermsOfService() {
  return (
    <PolicyLayout title="Terms of Service" lastUpdated="April 24, 2026">
      <Section title="1. Acceptance of Terms">
        <p>By accessing or using Inventory Manager, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.</p>
      </Section>

      <Section title="2. Description of Service">
        <p>Inventory Manager provides a SaaS platform to:</p>
        <List items={[
          "Manage inventory, raw materials, and products",
          "Track production and stock movement",
          "Handle ecommerce dispatches and returns",
          "Manage multi-user operations",
        ]} />
      </Section>

      <Section title="3. User Responsibilities">
        <p>You agree to:</p>
        <List items={[
          "Provide accurate information during login",
          "Use the platform only for lawful business purposes",
          "Maintain confidentiality of your account access",
          "Not misuse, copy, or disrupt the service",
        ]} />
      </Section>

      <Section title="4. No Warranty">
        <p>The service is provided "as is" and "as available" without warranties of any kind. We do not guarantee:</p>
        <List items={[
          "Continuous availability",
          "Error-free operation",
          "Suitability for specific business needs",
        ]} />
      </Section>

      <Section title="5. Limitation of Liability">
        <p>To the maximum extent permitted by law, Inventory Manager shall not be liable for:</p>
        <List items={[
          "Data loss",
          "Business interruption",
          "Indirect or consequential damages",
        ]} />
      </Section>

      <Section title="6. Termination">
        <p>We reserve the right to suspend or terminate access if terms are violated or if misuse or illegal activity is detected. Users may also stop using the service at any time.</p>
      </Section>

      <Section title="7. Changes to Terms">
        <p>We may update these terms from time to time. Continued use of the service means you accept the updated terms.</p>
      </Section>

      <Section title="8. Governing Law">
        <p>These Terms shall be governed by and interpreted under the laws of India.</p>
      </Section>
    </PolicyLayout>
  );
}
