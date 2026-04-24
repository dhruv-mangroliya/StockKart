import PolicyLayout, { Section, List } from "./PolicyLayout";

export default function RefundPolicy() {
  return (
    <PolicyLayout title="Refund Policy" lastUpdated="April 24, 2026">
      <Section title="1. Current Pricing">
        <p>Inventory Manager is currently <strong>free to use</strong>. No payments are required at this stage.</p>
      </Section>

      <Section title="2. Future Paid Plans">
        <p>In the future, we may introduce paid subscription plans. Refund terms will include:</p>
        <List items={[
          "Clear pricing and billing cycles",
          "Eligibility for refunds (if applicable)",
          "Time limits for refund requests",
        ]} />
        <p>These details will be updated before any paid features are launched.</p>
      </Section>

      <Section title="3. Contact">
        <p>For billing or refund-related questions (current or future), contact:</p>
        <p><strong>Email:</strong> <a href="mailto:support@inventorymanager.in">support@inventorymanager.in</a></p>
      </Section>
    </PolicyLayout>
  );
}
