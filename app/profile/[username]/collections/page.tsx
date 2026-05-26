import { UserCollectionsPage } from './_client';

export default function Page() {
  return <UserCollectionsPage />;
}

export async function generateStaticParams() {
  return [{ username: 'default' }];
}
