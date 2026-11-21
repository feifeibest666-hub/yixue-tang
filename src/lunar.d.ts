declare module 'lunar-javascript' {
  export interface JieQi {
    getName(): string
    toString(): string
  }
  export interface Lunar {
    getYearZhi(): string
    getYearInGanZhi(): string
    getYearInGanZhiExact(): string
    getMonth(): number
    getDay(): number
    getTimeZhi(): string
    getMonthZhi(): string
    getMonthZhiExact(): string
    getMonthInGanZhi(): string
    getMonthInGanZhiExact(): string
    getDayInGanZhi(): string
    getDayInGanZhiExact(): string
    getTimeInGanZhi(): string
    getMonthInChinese(): string
    getDayInChinese(): string
    getPrevJieQi(wholeDay?: boolean): JieQi | null
    toString(): string
  }
  export const Solar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): { getLunar(): Lunar }
  }
}
