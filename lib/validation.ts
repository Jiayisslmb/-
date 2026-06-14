import { z } from 'zod';

// 用户注册验证
export const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(50, '用户名最多50个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string()
    .email('请输入有效的邮箱地址')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(6, '密码至少6个字符')
    .max(100, '密码最多100个字符'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

// 用户登录验证
export const loginSchema = z.object({
  username: z.string()
    .min(1, '请输入用户名'),
  password: z.string()
    .min(1, '请输入密码'),
});

// 发布动态验证
export const postSchema = z.object({
  content: z.string()
    .min(1, '内容不能为空')
    .max(5000, '内容最多5000字符'),
  visibility: z.enum(['public', 'followers'], {
    message: '可见性设置无效',
  }),
});

export const articleSchema = z.object({
  title: z.string()
    .min(1, '标题不能为空')
    .max(200, '标题最多200字符'),
  content: z.string()
    .min(10, '内容至少10个字符')
    .max(50000, '内容最多50000字符'),
  coverCid: z.string().optional(),
  tags: z.string().optional(),
  visibility: z.enum(['public', 'followers']).optional(),
  circleId: z.number().optional(),
});

// 评论验证
export const commentSchema = z.object({
  content: z.string()
    .min(1, '评论内容不能为空')
    .max(1000, '评论最多1000字符'),
});

// 消息验证
export const messageSchema = z.object({
  content: z.string()
    .min(1, '消息内容不能为空')
    .max(2000, '消息最多2000字符'),
  receiverId: z.number()
    .positive('接收者ID必须是正数'),
});

// 圈子创建验证
export const circleSchema = z.object({
  name: z.string()
    .min(1, '圈子名称不能为空')
    .max(50, '圈子名称最多50字符'),
  description: z.string()
    .max(500, '圈子描述最多500字符')
    .optional(),
  avatarCid: z.string().optional(),
  category: z.string()
    .min(1, '请选择分类'),
});

// 用户资料更新验证
export const profileSchema = z.object({
  nickname: z.string()
    .max(50, '昵称最多50字符')
    .optional(),
  bio: z.string()
    .max(500, '个人简介最多500字符')
    .optional(),
  backgroundColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '背景颜色格式无效')
    .optional(),
  globalBackgroundColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '全局背景颜色格式无效')
    .optional(),
});

// 密码修改验证
export const passwordSchema = z.object({
  currentPassword: z.string()
    .min(1, '请输入当前密码'),
  newPassword: z.string()
    .min(6, '新密码至少6个字符')
    .max(100, '新密码最多100个字符'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: '两次输入的新密码不一致',
  path: ['confirmNewPassword'],
});

// 搜索验证
export const searchSchema = z.object({
  query: z.string()
    .min(1, '搜索关键词不能为空')
    .max(100, '搜索关键词最多100字符'),
});

// 话题验证
export const topicSchema = z.object({
  name: z.string()
    .min(1, '话题名称不能为空')
    .max(50, '话题名称最多50字符'),
});

// 验证辅助函数
export function validateSchema<T>(schema: z.ZodSchema<T>, data: any): { success: boolean; data?: T; errors?: Record<string, string> } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      (error.issues as any[] || []).forEach((err: any) => {
        const field = err.path.join('.');
        errors[field] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { global: '验证失败' } };
  }
}
