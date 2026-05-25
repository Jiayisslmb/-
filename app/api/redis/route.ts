import { NextRequest, NextResponse } from 'next/server';
import { redisManager } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'subscribeToChannel':
        // 注意：订阅操作在服务器端需要特殊处理，这里仅作为示例
        return NextResponse.json({ success: true });
      case 'getUserMessages':
        const messages = await redisManager.getUserMessages(data.userId, data.limit, data.offset);
        return NextResponse.json({ success: true, data: messages });
      case 'getConversationMessages':
        const conversationMessages = await redisManager.getConversationMessages(
          data.userId1, data.userId2, data.limit, data.offset
        );
        return NextResponse.json({ success: true, data: conversationMessages });
      case 'markMessageAsRead':
        await redisManager.markMessageAsRead(data.messageId);
        return NextResponse.json({ success: true });
      case 'batchMarkMessagesAsRead':
        await redisManager.batchMarkMessagesAsRead(data.messageIds);
        return NextResponse.json({ success: true });
      case 'getUnreadMessageCount':
        const count = await redisManager.getUnreadMessageCount(data.userId);
        return NextResponse.json({ success: true, data: count });
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Redis API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
