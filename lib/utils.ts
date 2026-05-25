/**
 * 通用工具函数库
 *
 * 文件功能说明：
 * - 提供项目中常用的格式化、验证和转换工具函数
 * - 封装日期显示、数字格式化等通用逻辑
 * - 统一处理文本截断、HTML清理等操作
 * - 提供CSS类名组合工具函数
 *
 * 设计原则：
 * 1. **纯函数**：所有函数都是无副作用的纯函数，便于测试
 * 2. **类型安全**：使用TypeScript严格类型定义
 * 3. **防御性编程**：处理边界情况和异常输入
 * 4. **国际化友好**：支持中文时间格式（刚刚、X分钟前等）
 *
 * 函数分类：
 * ┌─────────────────────────────────────────────────────┐
 * │ 📅 日期时间 (Date/Time)                             │
 * │   - formatDate: 智能相对时间格式化                  │
 * ├─────────────────────────────────────────────────────┤
 * │ 🔢 数字格式化 (Number Formatting)                   │
 * │   - formatNumber: 大数字简化显示（K/M/B）          │
 * ├─────────────────────────────────────────────────────┤
 * │ ✅ 验证函数 (Validation)                            │
 * │   - validateUsername: 用户名格式验证                │
 * │   - validatePassword: 密码强度验证                  │
 * ├─────────────────────────────────────────────────────┤
 * │ 📝 文本处理 (Text Processing)                       │
 * │   - truncateText: 文本截断                          │
 * │   - stripHtml: HTML标签清除                        │
 * ├─────────────────────────────────────────────────────┤
 * │ 🖼️ 媒体处理 (Media Processing)                      │
 * │   - getThumbnailUrl: 缩略图URL生成                 │
 * ├─────────────────────────────────────────────────────┤
 * │ 🎨 样式工具 (Styling Utilities)                     │
 * │   - classNames: 条件CSS类名组合                    │
 * └─────────────────────────────────────────────────────┘
 *
 * 使用示例：
 * ```typescript
 * import { formatDate, formatNumber, classNames } from '@/lib/utils';
 *
 * // 日期格式化
 * formatDate('2026-04-25T10:30:00Z'); // "2小时前" 或 "刚刚"
 *
 * // 数字格式化
 * formatNumber(1500);    // "1.5K"
 * formatNumber(2500000); // "2.5M"
 *
 * // 类名组合
 * classNames('btn', isActive && 'active', 'primary'); // "btn active primary"
 * ```
 *
 * @module utils
 * @version 1.3.0
 * @author 项目开发团队
 */

//通用工具函数（格式化、验证等）

/**
 * 智能相对时间格式化函数
 *
 * @function formatDate
 * @param {string | Date} date - 要格式化的日期（ISO字符串或Date对象）
 * @returns {string} 格式化后的相对时间字符串
 *
 * @description 将日期转换为用户友好的中文相对时间表示，
 * 类似社交媒体的时间显示风格（如微博、微信朋友圈）。
 *
 * 时间转换规则：
 * - < 60秒 → "刚刚"
 * - < 60分钟 → "X分钟前"
 * - < 24小时 → "X小时前"
 * - < 7天 → "X天前"
 * - < 30天 → "X周前"（按7天计算）
 * - < 365天 → "X个月前"（按30天计算）
 * - ≥ 365天 → "X年前"
 *
 * 算法原理：
 * 1. 统一将输入转换为Date对象
 * 2. 计算当前时间与目标时间的差值（毫秒）
 * 3. 将差值逐步转换为秒→分→时→天
 * 4. 根据差值大小选择合适的单位显示
 *
 * @example
 * formatDate('2026-04-25T12:00:00Z'); // 假设现在是12:05 → "5分钟前"
 * formatDate(new Date());              // "刚刚"
 * formatDate('2026-01-01');            // "4个月前"（假设现在是4月）
 *
 * @note 时区处理：自动使用浏览器本地时区
 */
export function formatDate(date: string | Date): string {
  /**
   * 统一日期对象
   * @type {Date}
   * @description 处理字符串和Date对象两种输入类型
   */
  const d = typeof date === 'string' ? new Date(date) : date;

  /**
   * 当前时间戳
   * @type {Date}
   */
  const now = new Date();

  /**
   * 时间差（毫秒）
   * @type {number}
   * @description 正数表示过去的时间，负数表示未来的时间
   */
  const diff = now.getTime() - d.getTime();

  /**
   * 转换为更直观的单位
   */
  const seconds = Math.floor(diff / 1000);      // 秒
  const minutes = Math.floor(seconds / 60);      // 分钟
  const hours = Math.floor(minutes / 60);        // 小时
  const days = Math.floor(hours / 24);           // 天

  // 按优先级从短到长匹配时间范围
  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
}

/**
 * 大数字简化格式化函数
 *
 * @function formatNumber
 * @param {number | undefined | null} num - 要格式化的数字
 * @returns {string} 格式化后的字符串
 *
 * @description 将大数字转换为易读的简写形式，
 * 用于显示点赞数、评论数、粉丝数等统计数据。
 *
 * 格式化规则：
 * - ≥ 1,000,000 → X.XM（百万）
 * - ≥ 1,000 → X.XK（千）
 * - < 1,000 → 原样显示
 * - 无效输入 → "0"
 *
 * 使用场景：
 * - PostItem组件中的点赞/评论/转发计数
 * - 用户主页的粉丝/关注数显示
 * - 圈子成员数量展示
 *
 * @example
 * formatNumber(0);         // "0"
 * formatNumber(999);       // "999"
 * formatNumber(1500);      // "1.5K"
 * formatNumber(1234567);   // "1.2M"
 * formatNumber(null);      // "0"
 * formatNumber(undefined); // "0"
 *
 * @note 保留1位小数，便于阅读但不过于精确
 */
export function formatNumber(num: number | undefined | null): string {
  // 防御性检查：处理undefined、null和非数字值
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }

  // 百万级：使用M后缀
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }

  // 千级：使用K后缀
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }

  // 小于千：原样返回字符串形式
  return num.toString();
}

/**
 * 用户名格式验证函数
 *
 * @function validateUsername
 * @param {string} username - 待验证的用户名字符串
 * @returns {boolean} 是否通过验证
 *
 * @description 验证用户名是否符合平台规定的命名规则。
 *
 * 验证规则：
 * - 长度：3-20个字符
 * - 允许字符：英文字母（a-z, A-Z）、数字（0-9）、下划线（_）、连字符（-）
 * - 不允许：中文、特殊符号、空格
 *
 * 正则表达式说明：
 * ^[a-zA-Z0-9_-]+$
 * ^       - 字符串开始
 * [...]   - 字符集（允许的字符）
 * +       - 匹配一次或多次（即至少1个字符）
 * $       - 字符串结束
 *
 * 安全考虑：
 * - 防止SQL注入（仅允许安全字符）
 * - 防止XSS攻击（排除HTML特殊字符）
 *
 * @example
 * validateUsername('john_doe');     // true ✅
 * validateUsername('user123');      // true ✅
 * validateUsername('ab');           // false ❌ 太短
 * validateUsername('very_long_name_too_long'); // false ❌ 太长
 * validateUsername('用户名');        // false ❌ 包含中文
 * validateUsername('user@name');    // false ❌ 包含特殊字符
 */
export function validateUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(username);
}

/**
 * 密码强度基础验证函数
 *
 * @function validatePassword
 * @param {string} password - 待验证的密码字符串
 * @returns {boolean} 是否满足最低要求
 *
 * @description 验证密码是否达到最低安全要求。
 *
 * 当前规则（基础版）：
 * - 最小长度：6个字符
 *
 * ⚠️ 注意：这是基础版本，生产环境建议增强为：
 * - 最小长度：8-12个字符
 * - 必须包含：大写字母、小写字母、数字、特殊字符
 * - 不能包含：用户名、常见弱密码
 *
 * @example
 * validatePassword('123456');     // true ✅（仅检查长度）
 * validatePassword('abc');         // false ❌ 太短
 * validatePassword('P@ssw0rd!');   // true ✅
 *
 * @todo 未来可集成zxcvbn等密码强度检测库
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * 文本截断函数
 *
 * @function truncateText
 * @param {string} text - 待截断的原始文本
 * @param {number} [length=100] - 最大允许长度（默认100字符）
 * @returns {string} 截断后的文本（超出部分用...代替）
 *
 * @description 将过长的文本截断到指定长度，
 * 并在末尾添加省略号(...)表示内容被截断。
 *
 * 使用场景：
 * - 动态/文章列表中的预览文本
 * - 通知消息的内容摘要
 * - 搜索结果的描述文字
 *
 * 实现特点：
 * - 如果文本长度≤限制长度，直接返回原文（不添加省略号）
 * - 截断位置精确到字符级别（不考虑中英文宽度差异）
 *
 * @example
 * truncateText('Hello World', 5);               // "Hello..."
 * truncateText('Short text', 20);              // "Short text"（未截断）
 * truncateText('这是一段很长的中文文本...', 10); // "这是一段很长的..."
 *
 * @note 对于中文场景，建议配合CSS的text-overflow: ellipsis使用
 */
export function truncateText(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * HTML标签清除函数
 *
 * @function stripHtml
 * @param {string} html - 包含HTML标签的字符串
 * @returns {string} 纯文本内容（无任何HTML标签）
 *
 * @description 从HTML字符串中提取纯文本内容，
 * 移除所有HTML标签及其属性。
 *
 * 技术实现：
 * 1. 创建临时DOM元素（div）
 * 2. 将HTML字符串赋值给innerHTML
 * 3. 浏览器自动解析并渲染HTML
 * 4. 读取textContent获取纯文本
 * 5. 返回文本内容（临时元素会被垃圾回收）
 *
 * 使用场景：
 * - 显示富文本编辑器内容的纯文本预览
 * - 清理用户输入防止XSS攻击
 * - 提取邮件正文中的纯文本
 *
 * 安全性：
 * ⚠️ 此方法依赖浏览器DOM解析，在服务端渲染(SSR)环境中不可用
 * ⚠️ 对于不可信的HTML内容，建议先使用DOMPurify等库进行消毒
 *
 * @example
 * stripHtml('<p>Hello <b>World</b></p>');     // "Hello World"
 * stripHtml('<script>alert("xss")</script>'); // "alert("xss")"（脚本已移除）
 * stripHtml('<br/>Line1<br/>Line2');          // "Line1Line2"（换行符丢失）
 *
 * @see https://github.com/cure53/DOMPurify 推荐的HTML消毒库
 */
export function stripHtml(html: string): string {
  /**
   * 创建临时DOM容器
   * @type {HTMLDivElement}
   * @description 使用div元素作为HTML解析容器
   */
  const tmp = document.createElement('div');

  /**
   * 设置innerHTML触发浏览器HTML解析
   * 浏览器会自动构建DOM树并执行相关处理
   */
  tmp.innerHTML = html;

  /**
   * 提取纯文本内容
   * textContent会递归获取所有文本节点的内容
   * 优先使用textContent（标准API），降级使用innerText（IE兼容）
   */
  return tmp.textContent || tmp.innerText || '';
}

/**
 * 缩略图URL生成函数
 *
 * @function getThumbnailUrl
 * @param {string} url - 原始图片URL
 * @param {number} [width=300] - 目标宽度（像素）
 * @param {number} [height=300] - 目标高度（像素）
 * @returns {string} 可能经过处理的图片URL
 *
 * @description 根据目标尺寸生成合适的缩略图URL。
 * 目前主要处理placeholder占位图服务的URL参数调整。
 *
 * 适用场景：
 * - 占位图服务（如via.placeholder.com）的动态尺寸调整
 * - CDN图片的缩放参数注入（需扩展实现）
 *
 * 当前实现：
 * - 仅对via.placeholder.com的URL进行处理
 * - 替换默认宽度参数（150）为目标宽度
 * - 添加height查询参数
 * - 其他URL原样返回
 *
 * @example
 * getThumbnailUrl('https://via.placeholder.com/150', 400, 300);
 * // 返回: "https://via.placeholder.com/400?height=300"
 *
 * getThumbnailUrl('https://example.com/image.jpg', 200);
 * // 返回: "https://example.com/image.jpg"（原样返回）
 *
 * @todo 可扩展支持更多CDN的缩放语法（如Cloudinary、Imgix）
 */
export function getThumbnailUrl(url: string, width: number = 300, height: number = 300): string {
  // 仅处理placeholder占位图服务
  if (url.includes('via.placeholder.com')) {
    return `${url.replace('150', width.toString())}?height=${height}`;
  }
  // 其他URL原样返回
  return url;
}

/**
 * CSS条件类名组合工具函数
 *
 * @function classNames
 * @param {...(string | undefined | null | false)[]} classes - 类名列表（可包含假值）
 * @returns {string} 组合后的类名字符串（空格分隔）
 *
 * @description 将多个类名合并为一个字符串，
 * 自动过滤掉falsy值（false, null, undefined, ''）。
 *
 * 这是React/Vue项目中非常常用的工具函数，
 * 用于根据状态动态切换CSS类名。
 *
 * 工作原理：
 * 1. 接收任意数量的参数（剩余参数语法...）
 * 2. 使用Array.filter(Boolean)过滤掉所有假值
 *   - Boolean(false) → false（过滤掉）
 *   - Boolean(null) → false（过滤掉）
 *   - Boolean(undefined) → false（过滤掉）
 *   - Boolean('') → false（过滤掉）
 *   - Boolean('active') → true（保留）
 * 3. 使用Array.join(' ')将保留的类名用空格连接
 *
 * 使用场景：
 * - 根据props或state动态添加样式类
 * - 组合基础类和条件修饰类
 * - 三元表达式的简化替代
 *
 * @example
 * // 基础用法
 * classNames('btn', 'primary');                        // "btn primary"
 *
 * // 条件类名（最常用场景）
 * classNames('btn', isActive && 'active', 'primary');  // "btn active primary"（当isActive=true时）
 * classNames('btn', isActive && 'active', 'primary');  // "btn primary"（当isActive=false时）
 *
 * // 多重条件
 * classNames({
 *   'btn': true,
 *   'btn-primary': isPrimary,
 *   'btn-large': size === 'large',
 *   'disabled': disabled,
 * }); // 需要展开对象：...(需要额外处理)
 *
 * // 与Tailwind CSS配合使用
 * classNames(
 *   'px-4 py-2 rounded',
 *   variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500',
 *   isLoading && 'opacity-50 cursor-not-allowed'
 * );
 *
 * @note 这是classnames库的轻量级实现版本
 * @see https://github.com/JedWatson/classnames 完整版的classnames库
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}