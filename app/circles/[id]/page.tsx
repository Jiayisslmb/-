import { CircleDetailPage } from './_client';

export default function Page() {
  return <CircleDetailPage />;
}

export async function generateStaticParams() {
  return [{ id: 'default' }];
}
