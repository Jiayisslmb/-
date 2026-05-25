/**
 * Next.js 核心配置文件
 *
 * 文件功能说明：
 * - 配置Next.js应用的全局设置
 * - 实现API请求代理，解决前后端分离架构下的跨域问题
 * - 将前端 /api/* 请求自动转发到后端服务 http://localhost:3001/api/*
 *
 * 技术原理：
 * - 使用Next.js的rewrites功能实现反向代理
 * - 开发环境下避免CORS（跨域资源共享）限制
 * - 生产环境可通过环境变量配置目标地址
 *
 * 配置项说明：
 * - source: 前端请求路径模式（使用:path*通配符匹配所有子路径）
 * - destination: 后端实际处理请求的目标地址
 *
 * @module next.config.ts
 * @version 1.0.0
 * @author 项目开发团队
 */

import type { NextConfig } from "next";

/**
 * Next.js主配置对象
 *
 * @description 包含所有Next.js运行时配置选项
 * @property {Function} rewrites - URL重写规则配置函数
 */
const nextConfig: NextConfig = {
  /**
   * URL重写规则配置
   *
   * @function rewrites
   * @returns {Array<Object>} 重写规则数组
   *
   * @example
   * // 前端请求：/api/content/articles
   * // 自动转发到：http://localhost:3001/api/content/articles
   *
   * @security 注意事项：
   * - 仅在开发环境硬编码localhost地址
   * - 生产环境应通过环境变量NEXT_PUBLIC_API_URL配置
   * - 避免敏感信息泄露到前端代码中
   *
   * @performance 优化建议：
   * - 可考虑添加缓存策略
   * - 对于静态资源可配置CDN转发
   */
  async rewrites() {
    return [
      {
        /**
         * 源路径模式
         * @type {string}
         * @description 匹配所有以/api/开头的请求路径
         * :path* 是通配符，匹配任意层级的子路径
         *
         * 示例匹配：
         * - /api/users → 匹配
         * - /api/content/articles/1 → 匹配
         * - /other/path → 不匹配
         */
        source: '/api/:path*',

        /**
         * 目标地址
         * @type {string}
         * @description 后端API服务的完整URL
         * :path* 会替换为实际捕获的路径部分
         *
         * 转换示例：
         * - /api/users → http://localhost:3001/api/users
         * - /api/auth/login → http://localhost:3001/api/auth/login
         */
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;