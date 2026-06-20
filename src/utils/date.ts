import dayjs from 'dayjs';
import { Solar } from 'lunar-javascript';

/** 获取农历日期显示文本 */
export function getLunarDate(dateStr: string): string {
  try {
    const d = dayjs(dateStr);
    const solar = Solar.fromYmd(d.year(), d.month() + 1, d.date());
    const lunar = solar.getLunar();
    const dayName = lunar.getDayInChinese();
    // 如果是初一，显示月份（如"五月"），否则显示日
    if (lunar.getDay() === 1) {
      return lunar.getMonthInChinese() + '月';
    }
    return dayName;
  } catch {
    return '';
  }
}

/** 获取当前月份的日历数据 */
export function getCalendarDays(currentMonth: string): (string | null)[] {
  const monthDayjs = dayjs(currentMonth + '-01');
  const startOfMonth = monthDayjs.startOf('month');
  const startDay = startOfMonth.day(); // 0=Sunday
  const daysInMonth = monthDayjs.daysInMonth();

  const days: (string | null)[] = [];

  // 填充月前空白
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // 填充日期
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = monthDayjs.date(d).format('YYYY-MM-DD');
    days.push(dateStr);
  }

  return days;
}

/** 生成唯一ID */
export function generateId(): string {
  return crypto.randomUUID();
}

/** 格式化日期为 YYYY-MM-DD */
export function formatDate(date: dayjs.Dayjs): string {
  return date.format('YYYY-MM-DD');
}

/** 获取今天的日期字符串 */
export function getToday(): string {
  return dayjs().format('YYYY-MM-DD');
}

/** 判断是否是今天 */
export function isToday(dateStr: string): boolean {
  return dateStr === getToday();
}

/** 判断日期是否在同一个月 */
export function isSameMonth(dateStr: string, monthStr: string): boolean {
  return dateStr.startsWith(monthStr);
}