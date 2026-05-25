import { UserCollectionsPage } from './_client';

export function generateStaticParams() {
  return [{ username: '_placeholder' }];
}

export default function Page() {
  return <UserCollectionsPage />;
}
