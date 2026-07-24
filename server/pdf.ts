import { access } from 'node:fs/promises'
import puppeteer, { type Browser } from 'puppeteer-core'

let browserPromise: Promise<Browser> | null = null

async function executablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter((candidate): candidate is string => Boolean(candidate))
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch { /* try the next known installation */ }
  }
  throw new Error('未找到可用的 Chrome。请安装 Google Chrome，或设置 PUPPETEER_EXECUTABLE_PATH。')
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      executablePath: await executablePath(),
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }).catch((error) => {
      browserPromise = null
      throw error
    })
  }
  const browser = await browserPromise
  if (!browser.connected) {
    browserPromise = null
    return getBrowser()
  }
  return browser
}

export async function generateResumePdf(sourceUrl: string) {
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })
    await page.goto(sourceUrl, { waitUntil: 'networkidle0', timeout: 30_000 })
    await page.evaluate(async () => { await document.fonts.ready })
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    })
    await page.waitForSelector('#resume-page[data-pagination-ready="true"]', { timeout: 15_000 })
    await page.emulateMediaType('print')
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
  } finally {
    await page.close()
  }
}
