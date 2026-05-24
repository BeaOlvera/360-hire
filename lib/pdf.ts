import puppeteer, { type Browser } from 'puppeteer-core'

/**
 * Renders an HTML string to a PDF Buffer.
 *
 * Production (Vercel / Linux): uses @sparticuz/chromium's bundled Chromium.
 * Local dev (macOS / Windows): set CHROME_EXECUTABLE_PATH to your system
 * Chrome / Edge / Brave binary so the same code path works locally.
 *
 * Windows examples for CHROME_EXECUTABLE_PATH:
 *   C:/Program Files/Google/Chrome/Application/chrome.exe
 *   C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe
 */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  let browser: Browser | null = null
  try {
    const isProd = process.env.VERCEL === '1' || process.platform === 'linux'
    let executablePath: string
    let args: string[]
    let headless: boolean

    if (isProd) {
      // Dynamic import so the heavy chromium binary is not pulled into local dev bundles
      const chromium = (await import('@sparticuz/chromium')).default
      executablePath = await chromium.executablePath()
      args = chromium.args
      headless = true
    } else {
      const localPath = process.env.CHROME_EXECUTABLE_PATH
      if (!localPath) {
        throw new Error('CHROME_EXECUTABLE_PATH is not set. Point it to your local Chrome / Edge binary to render PDFs in dev.')
      }
      executablePath = localPath
      args = ['--no-sandbox', '--disable-setuid-sandbox']
      headless = true
    }

    browser = await puppeteer.launch({ executablePath, args, headless })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', right: '12mm', bottom: '16mm', left: '12mm' },
    })
    return Buffer.from(pdf)
  } finally {
    if (browser) await browser.close().catch(() => { /* ignore */ })
  }
}
