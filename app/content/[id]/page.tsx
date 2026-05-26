import { ContentDetailPage } from './_client';

export default function Page() {
  return <ContentDetailPage />;
}

export async function generateStaticParams() {
  return [{ id: 'default' }];
}
