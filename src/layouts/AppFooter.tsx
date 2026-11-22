/**
 * Wspólna stopka. Wygląd (tło, kolor tekstu, obramowanie)
 * jest sterowany zmiennymi `--gw-footer-*` z src/styles/custom.css.
 */
import React from 'react';
import CONFIG from '@/configs/config';

export const AppFooter: React.FC = () => {
  return (
    <footer className="gw-footer px-4 py-3 text-[11px] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <span>{CONFIG.footer_text}</span>
        <span>
          {CONFIG.app_name} v{CONFIG.app_version}
        </span>
      </div>
    </footer>
  );
};

export default AppFooter;
