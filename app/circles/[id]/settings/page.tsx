import { CircleSettingsPage } from './_client';

export default function Page() {
  return <CircleSettingsPage />;
}

export async function generateStaticParams() {
  return [{ id: 'default' }];
}
