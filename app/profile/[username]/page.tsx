import { ProfileDetailPage } from './_client';

export default function Page() {
  return <ProfileDetailPage />;
}

export async function generateStaticParams() {
  return [{ username: 'default' }];
}
