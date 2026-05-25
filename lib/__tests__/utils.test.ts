import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatDate,
  formatNumber,
  validateUsername,
  validatePassword,
  truncateText,
  stripHtml,
  getThumbnailUrl,
  classNames,
} from '../utils';

// ============================================================
// formatDate
// ============================================================
describe('formatDate', () => {
  it('返回"刚刚"当时间差小于60秒', () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 30_000);
    expect(formatDate(recent)).toBe('刚刚');
  });

  it('返回"刚刚"当时间为当前时间', () => {
    expect(formatDate(new Date())).toBe('刚刚');
  });

  it('返回分钟数当时间差在1-59分钟之间', () => {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60_000);
    expect(formatDate(fiveMinAgo)).toBe('5分钟前');
  });

  it('返回小时数当时间差在1-23小时之间', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600_000);
    expect(formatDate(threeHoursAgo)).toBe('3小时前');
  });

  it('返回天数当时间差在1-6天之间', () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 86400_000);
    expect(formatDate(twoDaysAgo)).toBe('2天前');
  });

  it('返回周数当时间差在7-29天之间', () => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400_000);
    expect(formatDate(twoWeeksAgo)).toBe('2周前');
  });

  it('返回月数当时间差在30-364天之间', () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 86400_000);
    expect(formatDate(threeMonthsAgo)).toBe('3个月前');
  });

  it('返回年数当时间差超过365天', () => {
    const now = new Date();
    const twoYearsAgo = new Date(now.getTime() - 730 * 86400_000);
    expect(formatDate(twoYearsAgo)).toBe('2年前');
  });

  it('接受字符串日期输入', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600_000);
    expect(formatDate(oneHourAgo.toISOString())).toBe('1小时前');
  });

  it('处理未来日期（负时间差）不崩溃', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 3600_000);
    const result = formatDate(future);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ============================================================
// formatNumber
// ============================================================
describe('formatNumber', () => {
  it('返回"0"当输入为0', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('返回原始数字字符串当数字小于1000', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(42)).toBe('42');
  });

  it('返回K格式当数字>=1000且<1000000', () => {
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(999999)).toBe('1000.0K');
  });

  it('返回M格式当数字>=1000000', () => {
    expect(formatNumber(1_500_000)).toBe('1.5M');
    expect(formatNumber(1_000_000)).toBe('1.0M');
  });

  it('返回"0"当输入为null', () => {
    expect(formatNumber(null)).toBe('0');
  });

  it('返回"0"当输入为undefined', () => {
    expect(formatNumber(undefined)).toBe('0');
  });

  it('返回"0"当输入为NaN', () => {
    expect(formatNumber(NaN)).toBe('0');
  });
});

// ============================================================
// validateUsername
// ============================================================
describe('validateUsername', () => {
  it('接受有效的用户名', () => {
    expect(validateUsername('john_doe')).toBe(true);
    expect(validateUsername('user123')).toBe(true);
    expect(validateUsername('test-user')).toBe(true);
    expect(validateUsername('abc')).toBe(true);
  });

  it('拒绝过短的用户名（少于3字符）', () => {
    expect(validateUsername('ab')).toBe(false);
    expect(validateUsername('a')).toBe(false);
  });

  it('拒绝过长的用户名（超过20字符）', () => {
    expect(validateUsername('a'.repeat(21))).toBe(false);
  });

  it('拒绝包含中文的用户名', () => {
    expect(validateUsername('用户名')).toBe(false);
  });

  it('拒绝包含特殊字符的用户名', () => {
    expect(validateUsername('user@name')).toBe(false);
    expect(validateUsername('user name')).toBe(false);
    expect(validateUsername('user.name')).toBe(false);
  });

  it('接受长度边界值', () => {
    expect(validateUsername('abc')).toBe(true);
    expect(validateUsername('a'.repeat(20))).toBe(true);
  });
});

// ============================================================
// validatePassword
// ============================================================
describe('validatePassword', () => {
  it('接受6位及以上密码', () => {
    expect(validatePassword('123456')).toBe(true);
    expect(validatePassword('password')).toBe(true);
    expect(validatePassword('P@ssw0rd!')).toBe(true);
  });

  it('拒绝少于6位的密码', () => {
    expect(validatePassword('12345')).toBe(false);
    expect(validatePassword('abc')).toBe(false);
    expect(validatePassword('')).toBe(false);
  });
});

// ============================================================
// truncateText
// ============================================================
describe('truncateText', () => {
  it('当文本长度未超出限制时返回原文', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('当文本长度超出限制时截断并添加...', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
  });

  it('默认使用100字符作为限制', () => {
    const longText = 'a'.repeat(150);
    expect(truncateText(longText)).toBe('a'.repeat(100) + '...');
  });

  it('空字符串返回空字符串', () => {
    expect(truncateText('')).toBe('');
  });

  it('等于限制长度时返回原文', () => {
    expect(truncateText('abcde', 5)).toBe('abcde');
  });
});

// ============================================================
// stripHtml
// ============================================================
describe('stripHtml', () => {
  it('移除HTML标签返回纯文本', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('移除script标签内容', () => {
    const result = stripHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
  });

  it('处理空字符串', () => {
    expect(stripHtml('')).toBe('');
  });

  it('处理纯文本（无HTML标签）', () => {
    expect(stripHtml('Hello World')).toBe('Hello World');
  });
});

// ============================================================
// getThumbnailUrl
// ============================================================
describe('getThumbnailUrl', () => {
  it('替换placeholder.com URL中的宽度', () => {
    const result = getThumbnailUrl('https://via.placeholder.com/150', 400, 300);
    expect(result).toBe('https://via.placeholder.com/400?height=300');
  });

  it('非placeholder URL原样返回', () => {
    const url = 'https://example.com/image.jpg';
    expect(getThumbnailUrl(url)).toBe(url);
  });

  it('默认使用300x300', () => {
    const result = getThumbnailUrl('https://via.placeholder.com/150');
    expect(result).toContain('300');
    expect(result).toContain('height=300');
  });
});

// ============================================================
// classNames
// ============================================================
describe('classNames', () => {
  it('组合多个类名', () => {
    expect(classNames('btn', 'primary')).toBe('btn primary');
  });

  it('过滤假值', () => {
    expect(classNames('btn', false && 'active', 'primary')).toBe('btn primary');
    expect(classNames('btn', null, undefined, '', 'primary')).toBe('btn primary');
  });

  it('返回空字符串当所有参数都为假值', () => {
    expect(classNames(false, null, undefined, '')).toBe('');
  });

  it('正确的条件类名', () => {
    const isActive = true;
    const isDisabled = false;
    expect(classNames('btn', isActive && 'active', isDisabled && 'disabled')).toBe('btn active');
  });
});
