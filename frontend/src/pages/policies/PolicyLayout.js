export default function PolicyLayout({ title, lastUpdated, children }) {
  return (
    <div className="policy-page">
      <div className="policy-header">
        <h1>{title}</h1>
        <span className="policy-date">Last Updated: {lastUpdated}</span>
      </div>
      <div className="policy-body">{children}</div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <div className="policy-section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export function List({ items }) {
  return (
    <ul className="policy-list">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}
