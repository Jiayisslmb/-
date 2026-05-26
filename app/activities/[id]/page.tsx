import { ActivityPage } from './_client';

export default function Page() {
  return <ActivityPage />;
}

export async function generateStaticParams() {
  return [{ id: 'default' }];
}
