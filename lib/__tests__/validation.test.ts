import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  postSchema,
  articleSchema,
  commentSchema,
  messageSchema,
  circleSchema,
  profileSchema,
  passwordSchema,
  searchSchema,
  validateSchema,
} from '../validation';

// ============================================================
// registerSchema
// ============================================================
describe('registerSchema', () => {
  it('接受合法的注册数据', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      password: '123456',
      confirmPassword: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('拒绝过短的用户名', () => {
    const result = registerSchema.safeParse({
      username: 'ab',
      password: '123456',
      confirmPassword: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('拒绝两次密码不一致', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      password: '123456',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
    }
  });

  it('拒绝包含特殊字符的用户名', () => {
    const result = registerSchema.safeParse({
      username: 'user@name',
      password: '123456',
      confirmPassword: '123456',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// loginSchema
// ============================================================
describe('loginSchema', () => {
  it('接受合法的登录数据', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: 'pass123' });
    expect(result.success).toBe(true);
  });

  it('拒绝空用户名', () => {
    const result = loginSchema.safeParse({ username: '', password: 'pass123' });
    expect(result.success).toBe(false);
  });

  it('拒绝空密码', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: '' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// postSchema
// ============================================================
describe('postSchema', () => {
  it('接受合法的动态数据', () => {
    const result = postSchema.safeParse({ content: 'Hello World', visibility: 'public' });
    expect(result.success).toBe(true);
  });

  it('拒绝空内容', () => {
    const result = postSchema.safeParse({ content: '', visibility: 'public' });
    expect(result.success).toBe(false);
  });

  it('拒绝超长内容', () => {
    const result = postSchema.safeParse({ content: 'a'.repeat(5001), visibility: 'public' });
    expect(result.success).toBe(false);
  });

  it('拒绝无效的visibility值', () => {
    const result = postSchema.safeParse({ content: 'test', visibility: 'private' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// articleSchema
// ============================================================
describe('articleSchema', () => {
  it('接受合法的文章数据', () => {
    const result = articleSchema.safeParse({
      title: 'Test Article',
      content: 'This is a test article with enough content.',
    });
    expect(result.success).toBe(true);
  });

  it('拒绝过短的标题', () => {
    const result = articleSchema.safeParse({ title: '', content: 'Enough content for testing.' });
    expect(result.success).toBe(false);
  });

  it('拒绝过短的内容（少于10字符）', () => {
    const result = articleSchema.safeParse({ title: 'Test', content: 'Short' });
    expect(result.success).toBe(false);
  });

  it('接受可选的coverCid和tags', () => {
    const result = articleSchema.safeParse({
      title: 'Test',
      content: 'Long enough content here.',
      coverCid: 'QmTest123',
      tags: 'tech,web',
      circleId: 1,
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// commentSchema
// ============================================================
describe('commentSchema', () => {
  it('接受合法的评论', () => {
    const result = commentSchema.safeParse({ content: 'Good post!' });
    expect(result.success).toBe(true);
  });

  it('拒绝空评论', () => {
    const result = commentSchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
  });

  it('拒绝超长评论', () => {
    const result = commentSchema.safeParse({ content: 'a'.repeat(1001) });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// messageSchema
// ============================================================
describe('messageSchema', () => {
  it('接受合法的消息', () => {
    const result = messageSchema.safeParse({ content: 'Hello!', receiverId: 1 });
    expect(result.success).toBe(true);
  });

  it('拒绝空消息', () => {
    const result = messageSchema.safeParse({ content: '', receiverId: 1 });
    expect(result.success).toBe(false);
  });

  it('receiverId必须为正数', () => {
    const result = messageSchema.safeParse({ content: 'Hi', receiverId: -1 });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// circleSchema
// ============================================================
describe('circleSchema', () => {
  it('接受合法的圈子数据', () => {
    const result = circleSchema.safeParse({
      name: 'Tech Circle',
      description: 'A circle for tech enthusiasts',
      category: 'technology',
    });
    expect(result.success).toBe(true);
  });

  it('拒绝空的圈子名称', () => {
    const result = circleSchema.safeParse({ name: '', category: 'tech' });
    expect(result.success).toBe(false);
  });

  it('拒绝空的分类', () => {
    const result = circleSchema.safeParse({ name: 'Test', category: '' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// profileSchema
// ============================================================
describe('profileSchema', () => {
  it('接受合法的资料更新', () => {
    const result = profileSchema.safeParse({ nickname: 'Test Nick' });
    expect(result.success).toBe(true);
  });

  it('接受空的资料更新（所有字段可选）', () => {
    const result = profileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('接受合法的颜色值', () => {
    const result = profileSchema.safeParse({ backgroundColor: '#FF5733' });
    expect(result.success).toBe(true);
  });

  it('拒绝无效的颜色值格式', () => {
    const result = profileSchema.safeParse({ backgroundColor: 'invalid' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// passwordSchema
// ============================================================
describe('passwordSchema', () => {
  it('接受合法的新密码数据', () => {
    const result = passwordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
      confirmNewPassword: 'newpass123',
    });
    expect(result.success).toBe(true);
  });

  it('拒绝两次新密码不一致', () => {
    const result = passwordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
      confirmNewPassword: 'different',
    });
    expect(result.success).toBe(false);
  });

  it('拒绝过短的新密码', () => {
    const result = passwordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: '12345',
      confirmNewPassword: '12345',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// searchSchema
// ============================================================
describe('searchSchema', () => {
  it('接受合法的搜索关键词', () => {
    const result = searchSchema.safeParse({ query: 'test' });
    expect(result.success).toBe(true);
  });

  it('拒绝空搜索关键词', () => {
    const result = searchSchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// validateSchema helper
// ============================================================
describe('validateSchema', () => {
  it('成功校验返回success:true和data', () => {
    const { success, data } = validateSchema(loginSchema, { username: 'user', password: 'pass' });
    expect(success).toBe(true);
    expect(data).toBeDefined();
  });

  it('失败校验返回success:false和errors', () => {
    const { success, errors } = validateSchema(loginSchema, { username: '', password: '' });
    expect(success).toBe(false);
    expect(errors).toBeDefined();
    expect(Object.keys(errors!).length).toBeGreaterThan(0);
  });

  it('非ZodError异常返回全局错误', () => {
    const badSchema = { parse: () => { throw new Error('boom'); } } as any;
    const { success, errors } = validateSchema(badSchema, {});
    expect(success).toBe(false);
    expect(errors?.global).toBe('验证失败');
  });
});
