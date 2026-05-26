import { ArticleDetailPage } from './_client';

export default function Page() {
  return <ArticleDetailPage />;
}

export async function generateStaticParams() {
  return [{ id: 'default' }];
}
