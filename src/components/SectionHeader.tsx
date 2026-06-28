import { Link } from "react-router-dom";

interface SectionHeaderProps {
  title: string;
  /** Optional "see all"-style action on the right. */
  action?: { to: string; label: string };
  className?: string;
}

/**
 * Consistent section header used across pages: a small uppercase label with an
 * optional right-aligned link. Keeps every screen's section titles identical.
 */
export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <h2 className="section-label">{title}</h2>
      {action && (
        <Link
          to={action.to}
          className="text-sm font-semibold text-accent transition-colors hover:text-accent-dark hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
