import { CirclePostsPage } from './_client';

export default function Page() {
  return <CirclePostsPage />;
}

export async function generateStaticParams() {
  return [{ id: 'default' }];
}
