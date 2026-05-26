import { UserPostsPage } from './_client';

export default function Page() {
  return <UserPostsPage />;
}

export async function generateStaticParams() {
  return [{ username: 'default' }];
}
