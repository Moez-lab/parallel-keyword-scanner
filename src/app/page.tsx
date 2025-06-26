'use client';

import dynamic from 'next/dynamic';

const ClientOnlyKeywordApp = dynamic(() => import('./ClientOnlyKeywordApp'), {
  ssr: false,
});

export default function Page() {
  return <ClientOnlyKeywordApp />;
}
