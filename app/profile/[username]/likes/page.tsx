import { UserLikesPage } from './_client';

export default function Page() {
  return <UserLikesPage />;
}

export async function generateStaticParams() {
  return [{ username: 'default' }];
}
