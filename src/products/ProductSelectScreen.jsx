import DEdgeLogo from '../admin/DEdgeLogo.jsx';
import styles from './ProductSelectScreen.module.css';

// First screen after login. Lets the operator pick which product
// inside the suite they want to manage. Cards marked available:false
// render disabled with a "Coming soon" badge and short-circuit at the
// screen level — selecting them is a no-op until the underlying
// product flow is wired (landing + form + server routes).
const PRODUCTS = [
  {
    key: 'best-price-widget',
    name: 'D-EDGE Best Price Widget',
    summary:
      'Compare your direct rate against every OTA and surface the savings on every page.',
    available: true,
  },
  {
    key: 'lead-gen',
    name: 'D-EDGE Lead Gen',
    summary:
      'Capture newsletter signups with a configurable popup — branded image, custom copy, GDPR-friendly consent toggle.',
    available: true,
  },
  {
    key: 'stress-marketing',
    name: 'D-EDGE Stress Marketing',
    summary:
      'Surface urgency and social-proof toasts — booking activity, scarcity, demand trends — at the moment they move the conversion needle.',
    available: true,
  },
  {
    key: 'reassurance',
    name: 'D-EDGE Reassurance',
    summary:
      'Show a side-by-side comparison of guest review scores from every major platform — Booking, Tripadvisor, Google, Hotels.com.',
    available: false,
  },
];

export default function ProductSelectScreen({ onSelect }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <DEdgeLogo height={28} />
          </div>
          <h1 className={styles.title}>D-EDGE Marketing Suite</h1>
          <p className={styles.subtitle}>
            Pick the product you want to manage.
          </p>
        </header>

        <div className={styles.grid}>
          {PRODUCTS.map((p) => (
            <ProductCard
              key={p.key}
              product={p}
              onSelect={() => p.available && onSelect(p.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onSelect }) {
  const { name, summary, available } = product;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!available}
      className={`${styles.card} ${available ? styles.cardAvailable : styles.cardSoon}`}
    >
      <div className={styles.cardBadge}>
        {available ? 'Available' : 'Coming soon'}
      </div>
      <h2 className={styles.cardName}>{name}</h2>
      <p className={styles.cardSummary}>{summary}</p>
      {available && <span className={styles.cardCta}>Open →</span>}
    </button>
  );
}
