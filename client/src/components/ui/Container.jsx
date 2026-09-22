/**
 * Layout primitives to keep page widths/padding consistent and responsive
 * (320px -> 1440px+) without repeating max-w/px utility chains everywhere.
 */
export function Container({ className = '', children, ...props }) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Section({ className = '', children, ...props }) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 ${className}`} {...props}>
      {children}
    </section>
  );
}
