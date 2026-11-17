declare module 'lunar-javascript' {
  export interface Lunar {
    getYearZhi(): string
    getYearInGanZhi(): string
    getMonth(): number
    getDay(): number
    getTimeZhi(): string
    getMonthZhi(): string
    getMonthInChinese(): string
    getDayInChinese(): string
    toString(): string
  }
  export const Solar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): { getLunar(): Lunar }
  }
}
