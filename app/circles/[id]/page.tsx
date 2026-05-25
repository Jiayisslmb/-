import { CircleDetailPage } from './_client';

export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default function Page() {
  return <CircleDetailPage />;
}
