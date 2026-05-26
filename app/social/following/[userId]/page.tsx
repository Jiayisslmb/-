import { FollowingPage } from './_client';

export default function Page() {
  return <FollowingPage />;
}

export async function generateStaticParams() {
  return [{ userId: 'default' }];
}
