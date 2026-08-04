'use client';

import { ConsoleShell } from '@/components/aerd/ConsoleShell';
import { BackendLinkBanner } from '@/components/BackendLinkBanner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell>
      <BackendLinkBanner />
      {children}
    </ConsoleShell>
  );
}
