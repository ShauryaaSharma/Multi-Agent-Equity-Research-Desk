'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ENTRY_MARKUP } from './entry-markup';

export function EntryView() {
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const nav = t.closest('[data-nav]') as HTMLElement | null;
      if (nav) {
        const href = nav.getAttribute('data-nav');
        if (href) {
          e.preventDefault();
          router.push(href);
        }
        return;
      }
      const faqQ = t.closest('.faq-q');
      if (faqQ?.parentElement) faqQ.parentElement.classList.toggle('open');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [router]);

  return <div dangerouslySetInnerHTML={{ __html: ENTRY_MARKUP }} />;
}
