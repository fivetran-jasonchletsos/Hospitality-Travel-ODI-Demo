import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="eyebrow">404</div>
      <h1 className="mt-2 font-serif text-5xl tracking-tight">Room not found.</h1>
      <p className="mt-4 text-[var(--ink-muted)]">
        That folio doesn't exist in this catalog.
      </p>
      <Link to="/" className="mt-6 inline-block text-sm font-semibold text-[var(--brass-dim)] hover:text-[var(--brass)] uppercase tracking-wider">
        Return to the front desk →
      </Link>
    </div>
  );
}
