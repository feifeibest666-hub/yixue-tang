/**
 * 抓取维基文库十翼，转成简体，写入 src/data/yizhuan.ts。
 * 只在维护经文时运行；应用本身不访问网络。
 *
 * 来源（action=parse&prop=wikitext）：
 * - 彖、大象、小象、文言：周易/<卦名>（恒的页面是「周易/恒」，无妄是「周易/无妄」）
 * - 系辞上下、说卦、序卦、杂卦：易传专页（周易/繫辭上 会重定向到 易傳/繫辭上）
 * 大象另与 src/data/zhouyiText.ts 对过字；对不上的从仓库里已有的通行本大象。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import OpenCC from 'opencc-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cacheDir = process.env.YIZHUAN_CACHE || '/tmp/yizhuan-cache'
const conv = OpenCC.Converter({ from: 't', to: 'cn' })
const QIAN = '\uE000'

/** 与 ZHOUYI_TEXT 同序。页面标题用维基文库实际用字。 */
const PAGES = [
  '乾', '坤', '屯', '蒙', '需', '訟', '師', '比', '小畜', '履', '泰', '否',
  '同人', '大有', '謙', '豫', '隨', '蠱', '臨', '觀', '噬嗑', '賁', '剝', '復',
  '无妄', '大畜', '頤', '大過', '坎', '離', '咸', '恒', '遯', '大壯', '晉', '明夷',
  '家人', '睽', '蹇', '解', '損', '益', '夬', '姤', '萃', '升', '困', '井',
  '革', '鼎', '震', '艮', '漸', '歸妹', '豐', '旅', '巽', '兌', '渙', '節',
  '中孚', '小過', '既濟', '未濟',
]

const BOOKS = {
  xici1: '易傳/繫辭上',
  xici2: '易傳/繫辭下',
  shuogua: '易傳/說卦',
  xugua: '易傳/序卦',
  zagua: '易傳/雜卦',
}

/** 系辞下按朱熹《本义》十二章切开。锚点取转换后的正文，且各只出现一次。 */
const XIA_ANCHORS = [
  '八卦成列',
  '古者包牺氏之王天下也',
  '是故易者，象也',
  '阳卦多阴',
  '憧憧往来',
  '乾坤，其易之门邪',
  '其于中古乎',
  '为书也不可远',
  '原始要终',
  '广大悉备',
  '其当殷之末世',
  '天下之至健也',
]

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchWiki(title) {
  mkdirSync(cacheDir, { recursive: true })
  const file = join(cacheDir, encodeURIComponent(title) + '.wiki')
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const url = 'https://zh.wikisource.org/w/api.php?' + new URLSearchParams({
    action: 'parse', page: title, prop: 'wikitext', format: 'json', redirects: '1',
  })
  let last = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'YixuetangBot/1.0 (educational; yixue-tang text fetch)' } })
    if (res.status === 429) {
      await sleep(2000 * (attempt + 1))
      continue
    }
    const data = await res.json()
    if (data.error) {
      last = data.error.code + ' ' + (data.error.info || '')
      if (data.error.code === 'ratelimited') {
        await sleep(2000 * (attempt + 1))
        continue
      }
      throw new Error(title + ': ' + last)
    }
    const text = data.parse.wikitext['*']
    writeFileSync(file, text)
    await sleep(250)
    return text
  }
  throw new Error(title + ': ' + (last || 'fetch failed'))
}

/** 去掉维基标记。{{另|甲|乙}} 取页面正文甲，乙是「一作」。 */
function cleanInline(s) {
  s = s.replace(/-\{([^{}]*)\}-/g, (_, inner) => (inner.includes('|') ? '' : inner))
  s = s.replace(/\{\{另\|([^|}]*)\|[^{}]*\}\}/g, '$1')
  s = s.replace(/\{\{\*\|[^{}]*\}\}/g, '')
  s = s.replace(/\{\{gap\}\}/g, '')
  s = s.replace(/\[\[(?:File|Image|文件):[^\]]*\]\]/gi, '')
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
  s = s.replace(/\[\[([^\]|]+)\]\]/g, (_, t) => t.split('/').pop())
  s = s.replace(/\{\{[^{}]*\}\}/g, '')
  s = s.replace(/<[^>]+>/g, '')
  s = s.replace(/'{2,}/g, '')
  s = s.replace(/&nbsp;|&#160;/g, '')
  s = s.replace(/[ \t\u00a0\u3000]+/g, '')
  return s.trim()
}

/**
 * 维基底字和通行本不一致、或标记把字吃掉时，在转简体前改回通行本。
 * 只改有出处的几处，不扩大到「我觉得该这么写」。
 */
function fixTraditional(s) {
  return s
    .replaceAll('保合大和', '保合太和') // 乾彖。页内注「一作太和」，通行本作太和
    .replaceAll('大轝以載', '大車以載') // 大有九二小象。页内「一作車」
    .replaceAll('乘其庸', '乘其墉') // 同人九四小象。页内「一作墉」
    .replaceAll('聦', '聰')
    .replaceAll('蒺蔾', '蒺藜')
    .replaceAll('有上下然後禮儀有所錯', '有上下，然後禮義有所錯') // 链接把「礼义」显示成了「礼仪」
    .replaceAll('故受之既濟', '故受之以既濟') // 序卦链接吃掉了「以」
    .replaceAll('故曰說；言乎兌', '故曰說言乎兌')
    .replaceAll('不咥人，亨，利貞。剛中正', '不咥人，亨。剛中正') // 履彖。通行本无「利贞」
    .replaceAll('驚遠而懼邇也。出可以', '驚遠而懼邇也。不喪匕鬯，出可以') // 震彖。卦页漏「不丧匕鬯」
    .replaceAll('有飛鳥之象焉，有飛鳥遺之音', '有飛鳥之象焉，飛鳥遺之音')
    .replaceAll('君子道長，小人道消也', '君子道長，小人道憂也') // 杂卦末句。通行本作忧，与否彖「小人道消」不同
    .replaceAll('長裕而不没', '長裕而不設') // 系辞下九卦。通行本作不设
    .replaceAll('天命不佑', '天命不祐') // 无妄彖。与经文「自天祐之」同一用字
    .replaceAll('神也者。妙萬物', '神也者，妙萬物')
}

function toCn(s) {
  const fixed = fixTraditional(s).replaceAll('乾', QIAN)
  let out = conv(fixed).replaceAll(QIAN, '乾')
  // OpenCC 把餗、隤、絪、輮转成扩展区字，手机字体经常缺。这些字通行本就用原字。
  for (const ch of new Set(fixed)) {
    if (ch === QIAN) continue
    const mapped = conv(ch)
    if ([...mapped].some((c) => c.codePointAt(0) > 0x9fff)) out = out.replaceAll(mapped, ch)
  }
  return out
}

function parseGua(raw) {
  const sections = []
  let cur = null
  for (const line0 of raw.split('\n')) {
    const t = line0.trim()
    const marker = t.match(/^[\*#'：:]*'''\s*(彖曰|象曰|文言曰)/)
    if (marker) {
      cur = { name: marker[1], items: [] }
      sections.push(cur)
      continue
    }
    if (!cur) continue
    if (/^\*+'''/.test(t)) {
      cur = null
      continue
    }
    if (/^\*:\s*$/.test(t)) {
      cur.items.push({ break: true })
      continue
    }
    if (!t || t.startsWith('{{') || /^\[\[(File|Image)/i.test(t)) continue
    let level = 'cont'
    let body = t
    if (t.startsWith('*#')) {
      level = 'yao'
      body = t.replace(/^\*+#\s*/, '')
    } else if (t.startsWith('*')) {
      level = 'para'
      body = t.replace(/^\*+\s*/, '')
    }
    const text = cleanInline(body)
    if (!text) continue
    if (level === 'cont' && cur.items.length && !cur.items[cur.items.length - 1].break) {
      cur.items[cur.items.length - 1].text += text
    } else {
      cur.items.push({ level, text })
    }
  }
  const sec = (name) => sections.find((s) => s.name === name)
  const tuanSec = sec('彖曰')
  const xiangSec = sec('象曰')
  if (!tuanSec || !xiangSec) throw new Error('缺少彖或象')
  const tuan = toCn(tuanSec.items.filter((it) => !it.break).map((it) => it.text).join(''))
  const xiangItems = xiangSec.items.filter((it) => !it.break)
  const da = xiangItems.find((it) => it.level === 'para')
  const xiao = xiangItems.filter((it) => it.level === 'yao').map((it) => toCn(it.text))
  if (!da) throw new Error('缺少大象')
  let wenyan = null
  const wen = sec('文言曰')
  if (wen) {
    const paras = []
    let buf = []
    const flush = () => {
      if (buf.length) paras.push(toCn(buf.join('')))
      buf = []
    }
    for (const it of wen.items) {
      if (it.break) {
        flush()
        continue
      }
      const short = it.text.length <= 24 && !it.text.includes('子曰') && !it.text.includes('何謂')
      if (short) buf.push(it.text)
      else {
        flush()
        paras.push(toCn(it.text))
      }
    }
    flush()
    wenyan = paras
  }
  return { tuan, da: toCn(da.text), xiao, wenyan }
}

function bookParas(raw) {
  const from = raw.indexOf('==')
  if (from < 0) throw new Error('no heading')
  let text = raw.slice(from)
  const cut = text.search(/\n==校/)
  if (cut >= 0) text = text.slice(0, cut)
  const paras = []
  for (const line0 of text.split('\n')) {
    let t = line0.trim()
    if (!t || t.startsWith('|')) continue
    if (t.startsWith('{{') && !t.startsWith('{{gap}}')) continue
    if (t.startsWith('==')) {
      const h = t.replace(/=/g, '').trim()
      if (h === '上篇') paras.push('@@SHANG@@')
      else if (h === '下篇') paras.push('@@XIA@@')
      else if (/^第.+章$/.test(h)) paras.push('@@CH@@')
      continue
    }
    t = t.replace(/^\{\{gap\}\}/, '').replace(/^:+/, '')
    const cleaned = cleanInline(t)
    if (cleaned) paras.push(toCn(cleaned))
  }
  return paras
}

function chaptersByMarker(paras) {
  const groups = []
  let cur = []
  for (const p of paras) {
    if (p === '@@CH@@') {
      if (cur.length) groups.push(cur)
      cur = []
    } else if (!p.startsWith('@@')) cur.push(p)
  }
  if (cur.length) groups.push(cur)
  return groups
}

/** 整段归入章，避免锚点切在「子曰：「乾坤…」这种句子中间。 */
function splitByAnchors(paras, anchors) {
  const groups = anchors.map(() => [])
  let gi = 0
  let started = false
  for (const p of paras) {
    if (p.startsWith('@@')) continue
    let next = gi
    for (let j = anchors.length - 1; j > gi; j--) {
      if (p.includes(anchors[j])) { next = j; break }
    }
    if (!started) {
      if (next === 0 && !p.includes(anchors[0])) continue
      started = true
    }
    gi = next
    groups[gi].push(p)
  }
  anchors.forEach((a, i) => {
    if (!groups[i].some((p) => p.includes(a))) throw new Error('系辞下找不到分章锚点：' + a)
  })
  return groups
}

function norm(s) {
  return s.replace(/[\s\p{P}\p{S}]+/gu, '')
}

function tsString(s) {
  return JSON.stringify(s)
}

function tsArray(arr, indent) {
  const pad = ' '.repeat(indent)
  return '[\n' + arr.map((x) => pad + '  ' + (Array.isArray(x)
    ? '[\n' + x.map((y) => pad + '    ' + tsString(y) + ',').join('\n') + '\n' + pad + '  ]'
    : tsString(x)) + ',').join('\n') + '\n' + pad + ']'
}

function assertClean(label, s) {
  if (/[{}[\]<>]|彖曰|象曰|文言曰|一作/.test(s)) {
    throw new Error(label + ' 还留着标记：' + s.slice(0, 80))
  }
  if (s.includes('干') && !s.includes('干父') && !/若干|干支/.test(s)) {
    // 干可能是误转的乾。逐处检查留给调用方的汇总。
  }
}

const xiangExpect = [...readFileSync(join(root, 'src/data/zhouyiText.ts'), 'utf8').matchAll(/"xiang": "([^"]*)"/g)].map((m) => m[1])
if (xiangExpect.length !== 64) throw new Error('zhouyi 大象不是 64 条')

const guaRaw = []
for (const name of PAGES) {
  guaRaw.push(await fetchWiki('周易/' + name))
}
const books = {}
for (const [key, title] of Object.entries(BOOKS)) books[key] = bookParas(await fetchWiki(title))

const TUAN = []
const XIANG_DA = []
const XIANG_XIAO = []
let wenQian = null
let wenKun = null
const adopted = []
for (let i = 0; i < guaRaw.length; i++) {
  const g = parseGua(guaRaw[i])
  const expectN = i < 2 ? 7 : 6
  if (g.xiao.length !== expectN) throw new Error(PAGES[i] + ' 小象 ' + g.xiao.length + ' 条，应为 ' + expectN)
  TUAN.push(g.tuan)
  let da = g.da
  if (norm(da) !== norm(xiangExpect[i])) {
    adopted.push({ i, got: da, expect: xiangExpect[i] })
    da = xiangExpect[i]
  }
  XIANG_DA.push(da)
  XIANG_XIAO.push(g.xiao)
  if (i === 0) wenQian = g.wenyan
  if (i === 1) wenKun = g.wenyan
  for (const s of [g.tuan, da, ...g.xiao, ...(g.wenyan || [])]) assertClean(PAGES[i], s)
}
if (!wenQian?.length || !wenKun?.length) throw new Error('文言缺失')
if (!TUAN[0].startsWith('大哉乾元')) throw new Error('乾彖不是以大哉乾元起笔：' + TUAN[0].slice(0, 20))
if (!TUAN[50].includes('不丧匕鬯')) throw new Error('震彖缺不丧匕鬯')
if (TUAN[9].includes('利贞')) throw new Error('履彖多了利贞：' + TUAN[9])
if (!TUAN[24].includes('天命不祐')) throw new Error('无妄彖用字')

const XICI_SHANG = chaptersByMarker(books.xici1)
const XICI_XIA = splitByAnchors(books.xici2, XIA_ANCHORS)
const SHUOGUA = chaptersByMarker(books.shuogua)
if (XICI_SHANG.length !== 12) throw new Error('系辞上章数 ' + XICI_SHANG.length)
if (XICI_XIA.length !== 12) throw new Error('系辞下章数 ' + XICI_XIA.length)
if (SHUOGUA.length !== 11) throw new Error('说卦章数 ' + SHUOGUA.length)
if (!XICI_SHANG[0][0].startsWith('天尊地卑')) throw new Error('系辞上第一章不对')
if (!XICI_SHANG[8].join('').includes('大衍之数五十')) throw new Error('大衍不在系辞上第九章')
if (!XICI_SHANG[11].join('').includes('书不尽言')) throw new Error('系辞上第十二章不对')
if (!XICI_XIA[11].join('').includes('天下之至健')) throw new Error('系辞下第十二章不对')
if (!SHUOGUA[0][0].includes('幽赞于神明而生蓍')) throw new Error('说卦第一章不对')
if (!SHUOGUA[4].join('').includes('帝出乎震')) throw new Error('说卦第五章不对')

let shang = []
let xia = []
let side = ''
for (const p of books.xugua) {
  if (p === '@@SHANG@@') { side = 'shang'; continue }
  if (p === '@@XIA@@') { side = 'xia'; continue }
  if (p.startsWith('@@')) continue
  if (side === 'shang') shang.push(p)
  else if (side === 'xia') xia.push(p)
}
if (!shang.length || !xia.length) throw new Error('序卦上下篇为空')
if (!shang[0].includes('有天地，然后万物生焉') && !norm(shang[0]).includes('有天地然后万物生焉')) {
  throw new Error('序卦起笔不对：' + shang[0])
}
const ZAGUA = books.zagua.filter((p) => !p.startsWith('@@'))
if (ZAGUA.length < 10) throw new Error('杂卦太短')
if (!norm(ZAGUA[0]).startsWith('乾刚坤柔')) throw new Error('杂卦起笔：' + ZAGUA[0])

const allText = [
  ...TUAN, ...XIANG_DA, ...XIANG_XIAO.flat(), ...wenQian, ...wenKun,
  ...XICI_SHANG.flat(), ...XICI_XIA.flat(), ...SHUOGUA.flat(), ...shang, ...xia, ...ZAGUA,
]
for (const s of allText) {
  if (/[{}\[\]<>]/.test(s)) throw new Error('标记残留：' + s.slice(0, 100))
}
const gan = allText.join('\n').split('干')
if (gan.length > 1) {
  console.log('含「干」的片段（确认不是乾被转错）：')
  for (let i = 1; i < gan.length; i++) console.log(' …' + gan[i - 1].slice(-8) + '干' + gan[i].slice(0, 8))
}

const xiaoTotal = XIANG_XIAO.reduce((n, a) => n + a.length, 0)
if (xiaoTotal !== 386) throw new Error('小象合计 ' + xiaoTotal)

if (adopted.length) {
  console.log('大象与 zhouyiText 去标点后不一致，已改从仓库通行本：')
  for (const a of adopted) console.log(PAGES[a.i], '\n  抓到', a.got, '\n  采用', a.expect)
} else {
  console.log('大象 64 条与 zhouyiText 去标点后一致')
}
console.log('彖', TUAN.length, '小象', xiaoTotal, '文言乾', wenQian.length, '坤', wenKun.length)
console.log('系辞', XICI_SHANG.length, XICI_XIA.length, '说卦', SHUOGUA.length, '序卦', shang.length, xia.length, '杂卦', ZAGUA.length)

const header = `// 《十翼》通行本。由 scripts/fetch-yizhuan.mjs 从维基文库抓取（易传专页与周易各卦页），用 opencc-js 转为简体。
// 乾不简化成干；于/后/无与 src/data/zhouyiText.ts 同一套。大象去标点后与该文件的 xiang 逐字相同。
// 分章：系辞上下依朱熹《周易本义》各十二章，说卦十一章。

export const TUAN: string[] = ${tsArray(TUAN, 0)}

export const XIANG_DA: string[] = ${tsArray(XIANG_DA, 0)}

export const XIANG_XIAO: string[][] = ${tsArray(XIANG_XIAO, 0)}

export const WENYAN: { qian: string[]; kun: string[] } = {
  qian: ${tsArray(wenQian, 2)},
  kun: ${tsArray(wenKun, 2)},
}

export const XICI_SHANG: string[][] = ${tsArray(XICI_SHANG, 0)}

export const XICI_XIA: string[][] = ${tsArray(XICI_XIA, 0)}

export const SHUOGUA: string[][] = ${tsArray(SHUOGUA, 0)}

export const XUGUA: { shang: string[]; xia: string[] } = {
  shang: ${tsArray(shang, 2)},
  xia: ${tsArray(xia, 2)},
}

export const ZAGUA: string[] = ${tsArray(ZAGUA, 0)}
`

writeFileSync(join(root, 'src/data/yizhuan.ts'), header)
console.log('wrote src/data/yizhuan.ts', header.length, 'chars')
