import { UserWorksPage } from './_client';

export default function Page() {
  return <UserWorksPage />;
}

export async function generateStaticParams() {
  return [{ username: 'default' }];
}
