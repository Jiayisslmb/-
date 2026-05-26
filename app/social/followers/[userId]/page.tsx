import { FollowersPage } from './_client';

export default function Page() {
  return <FollowersPage />;
}

export async function generateStaticParams() {
  return [{ userId: 'default' }];
}
