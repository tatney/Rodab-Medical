const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function settleLayout(timeout = 2000) {
  const deadline = Date.now() + timeout
  const remaining = () => Math.max(0, deadline - Date.now())

  const waitFonts = async () => {
    try {
      if (document.fonts && document.fonts.ready) {
        await Promise.race([document.fonts.ready, sleep(remaining())])
      }
    } catch (e) {
      /* ignore */
    }
  }

  const waitImages = async () => {
    while (Date.now() < deadline) {
      const pending = Array.from(document.images).filter((img) => !img.complete)
      if (pending.length === 0) break
      await sleep(80)
    }
  }

  return waitFonts().then(waitImages).then(() => sleep(50))
}

const scrollMarginTop = (el) => {
  const style = window.getComputedStyle(el)
  const raw = style.scrollMarginTop
  if (raw && raw !== 'auto' && raw.endsWith('px')) return parseFloat(raw)
  return 0
}

export async function scrollToSection(id, { timeout = 3000 } = {}) {
  const deadline = Date.now() + timeout

  let el = null
  while (!el && Date.now() < deadline) {
    el = document.getElementById(id)
    if (!el) await sleep(50)
  }
  if (!el) {
    scrollToTop()
    return
  }

  const align = () => {
    if (!document.body.contains(el)) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  align()

  await settleLayout()

  align()

  const expectedOffset = scrollMarginTop(el)
  setTimeout(() => {
    if (!document.body.contains(el)) return
    const top = el.getBoundingClientRect().top
    if (Math.abs(top - expectedOffset) > 24) {
      window.scrollBy({ top: top - expectedOffset, behavior: 'smooth' })
    }
  }, 500)
}

export function scrollToTop() {
  const root = document.documentElement
  const prev = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto'
  window.scrollTo(0, 0)
  root.style.scrollBehavior = prev
}
