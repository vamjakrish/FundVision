/**
 * FundVision brand logo component.
 * Renders the official uploaded brand assets exactly as-is (no redesign,
 * no stretching, no recoloring) — never rebuild the mark from scratch.
 *
 *  - variant="icon"  -> square icon mark only  (/brand/logo-icon.png)
 *  - variant="full"  -> horizontal logo + wordmark, for light backgrounds (/brand/logo.png)
 *  - dark={true}     -> horizontal logo variant tuned for dark backgrounds (/brand/dark-logo.png)
 */
export default function Logo({ variant = 'icon', className = '', dark = false, height = 36 }) {
  if (variant === 'icon') {
    return (
      <img
        src="/brand/logo-icon.png"
        alt="FundVision"
        className={`shrink-0 object-contain ${className}`}
        style={{ height, width: height }}
        draggable={false}
      />
    );
  }

  // Horizontal lockup (icon + wordmark + tagline), baked into the source asset
  return (
    <img
      src={dark ? '/brand/dark-logo.png' : '/brand/logo.png'}
      alt="FundVision – Fund Today, Build Tomorrow"
      className={`shrink-0 object-contain ${className}`}
      style={{ height }}
      draggable={false}
    />
  );
}
