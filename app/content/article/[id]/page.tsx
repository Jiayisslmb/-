import { ArticleDetailPage } from './_client';

export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default function Page() {
  return <ArticleDetailPage />;
}
