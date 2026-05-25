import { TopicPage } from './_client';

export function generateStaticParams() {
  return [{ name: '_placeholder' }];
}

export default function Page() {
  return <TopicPage />;
}
