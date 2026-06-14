'use client';

import { useParams } from 'next/navigation';

export default function TopicPage() {
  const params = useParams();
  const topicName = decodeURIComponent((params.name as string) || '');

  return (
    <div style={{ padding: 40 }}>
      <h1>话题：{topicName}</h1>
      <p>页面正常加载</p>
    </div>
  );
}
