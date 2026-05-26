import { TopicPage } from './_client';

export default function Page() {
  return <TopicPage />;
}

export async function generateStaticParams() {
  return [{ name: 'default' }];
}
