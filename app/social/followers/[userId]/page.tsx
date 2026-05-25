import { FollowersPage } from './_client';

export function generateStaticParams() {
  return [{ userId: '_placeholder' }];
}

export default function Page() {
  return <FollowersPage />;
}
