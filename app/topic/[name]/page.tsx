import TopicPage from './_client';

// v2.2 — topic page fix 2026-06-14
export default function Page() {
  return <TopicPage />;
}

export async function generateStaticParams() {
  return [{ name: 'default' }];
}
