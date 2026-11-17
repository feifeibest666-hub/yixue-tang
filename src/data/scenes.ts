const ART = `${import.meta.env?.BASE_URL ?? '/'}art/`

export const SCENE = {
  welcome: `${ART}hero-welcome.webp`,
  tian: `${ART}scene-tian.webp`,
  di: `${ART}scene-di.webp`,
  lei: `${ART}scene-lei.webp`,
  shan: `${ART}scene-shan.webp`,
  shui: `${ART}scene-shui.webp`,
  huo: `${ART}scene-huo.webp`,
  feng: `${ART}scene-feng.webp`,
  ze: `${ART}scene-ze.webp`,
  yinyang: `${ART}scene-yinyang.webp`,
  meihua: `${ART}scene-meihua.webp`,
  book: `${ART}scene-book.webp`,
} as const

export type SceneKey = keyof typeof SCENE

export const TRIGRAM_SCENE: Record<string, SceneKey> = {
  乾: 'tian', 坤: 'di', 震: 'lei', 艮: 'shan', 坎: 'shui', 离: 'huo', 巽: 'feng', 兑: 'ze',
}

export const TRIGRAM_WHY: Record<string, string> = {
  乾: '三条全是阳爻，没有一处断开：纯粹、刚健、运转不停，所以是天。',
  坤: '三条全是阴爻，都能容纳：承载、包容、顺承，所以是地。',
  震: '唯一的阳爻在最下面：阳气从底下往上冲，像雷从地下爆发，所以是雷，主“动”。',
  艮: '唯一的阳爻在最上面：阳到了顶就停住，像山稳稳立着，所以是山，主“止”。',
  坎: '阳爻夹在两条阴爻中间：外柔内刚，像水表面软、深处有力也有险，所以是水。',
  离: '阴爻夹在两条阳爻中间：中间是空的，像火焰明亮而中心空虚，所以是火。',
  巽: '唯一的阴爻在最下面：底下是空的，气流从下面钻进去，无孔不入，所以是风。',
  兑: '唯一的阴爻在最上面：上面缺了个口，像湖面张开、也像张嘴而笑，所以是泽，主“悦”。',
}
