import { ChatPage } from './_client';

export default function Page() {
  return <ChatPage />;
}

export async function generateStaticParams() {
  return [{ userId: 'default' }];
}
