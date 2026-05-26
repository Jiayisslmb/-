import { MomentDetailPage } from './_client';

export default function Page() {
  return <MomentDetailPage />;
}

export async function generateStaticParams() {
  return [{ id: 'default' }];
}
