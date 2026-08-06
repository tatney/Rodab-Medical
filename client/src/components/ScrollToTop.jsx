import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollToTop } from '../utils/scrollToSection'

const ScrollToTop = () => {
  const { pathname, state } = useLocation()

  useEffect(() => {
    if (state?.scrollTo) return
    scrollToTop()
  }, [pathname, state])

  return null
}

export default ScrollToTop
