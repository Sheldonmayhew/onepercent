import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GameLayoutProps {
  /** Header slot — timer bars, round info, player identity, back buttons */
  header?: ReactNode;
  /** Main scrollable content */
  children: ReactNode;
  /** Primary CTA in bottom nav (takes 2/3 width) */
  cta?: ReactNode;
  /** Secondary action in bottom nav — compact icon/text button (takes 1/3 width) */
  secondaryAction?: ReactNode;
  /** Full custom footer — overrides cta/secondaryAction when you need full control */
  footer?: ReactNode;
}

export default function GameLayout({ header, children, cta, secondaryAction, footer }: GameLayoutProps) {
  const hasBottomNav = footer || cta;

  return (
    <div className="h-dvh flex flex-col bg-bg-primary safe-area-top overflow-hidden">
      {/* Header — shrinks to fit */}
      {header && <div className="shrink-0">{header}</div>}

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-12 pb-2">
        <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto">
          {children}
        </div>
      </div>

      {/* Bottom nav — segmented bar */}
      {hasBottomNav && (
        <div className="shrink-0 bg-bg-card/95 backdrop-blur-md border-t border-outline-variant/10 safe-area-bottom px-4 sm:px-8 lg:px-12 pt-3 pb-5">
          <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto">
            {footer ? (
              footer
            ) : (
              <div className="flex items-center gap-2.5">
                {secondaryAction && (
                  <div className="shrink-0">
                    {secondaryAction}
                  </div>
                )}
                {cta && (
                  <div className="flex-1 min-w-0">
                    {cta}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Reusable primary CTA button for the bottom nav */
export function NavCTA({
  children,
  onClick,
  disabled,
  variant = 'primary',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'gold' | 'success' | 'muted';
}) {
  const styles = {
    primary: 'bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary',
    gold: 'bg-neon-gold text-text-primary shadow-gold',
    success: 'bg-neon-green/15 text-neon-green',
    muted: 'bg-bg-elevated text-text-muted',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3.5 md:py-4 rounded-2xl md:rounded-3xl font-display text-lg md:text-xl font-bold tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed ${styles[variant]}`}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
    >
      {children}
    </motion.button>
  );
}

/** Reusable secondary action button (compact, for the left side of the bar) */
export function NavBack({
  onClick,
  label = 'Back',
  icon,
}: {
  onClick: () => void;
  label?: string;
  icon?: ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 px-4 md:px-5 py-3.5 md:py-4 rounded-2xl md:rounded-3xl bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors font-medium text-sm md:text-base"
      whileTap={{ scale: 0.95 }}
    >
      {icon ?? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      )}
      {label}
    </motion.button>
  );
}
