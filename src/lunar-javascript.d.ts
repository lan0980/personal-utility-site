/** Minimal type declarations for lunar-javascript */
declare module 'lunar-javascript' {
  export class Lunar {
    getDay(): number;
    getDayInChinese(): string;
    getMonthInChinese(): string;
  }

  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
  }
}
