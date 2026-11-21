import { useEffect } from 'react'
import type { RefObject } from 'react'

/**
 * Grows a textarea to its content on narrow screens, where the diary page flows
 * instead of holding fixed rows. Runs again when the element is first laid out
 * (the note page is mounted but hidden until its tab is opened).
 */
export function useAutosize(ref: RefObject<HTMLTextAreaElement | null>, value: string, enabled: boolean): void {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (!enabled) {
      element.style.height = ''
      return
    }

    let frame = 0
    let busy = false

    const apply = () => {
      if (busy || element.clientWidth === 0) return
      busy = true
      element.style.height = 'auto'
      const next = `${element.scrollHeight}px`
      if (element.style.height !== next) element.style.height = next
      busy = false
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(apply)
    }

    schedule()
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    if (document.fonts) void document.fonts.ready.then(schedule)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [ref, value, enabled])
}
