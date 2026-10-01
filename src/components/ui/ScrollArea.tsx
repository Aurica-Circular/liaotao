import { forwardRef, HTMLAttributes, useRef, useEffect, useImperativeHandle } from 'react'
import { cn } from '../../utils/helpers'

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  autoScroll?: boolean
  scrollThreshold?: number
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, autoScroll = true, scrollThreshold = 100, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const isNearBottomRef = useRef(true)

    useImperativeHandle(ref, () => ({
      scrollToBottom: (behavior: ScrollBehavior = 'smooth') => {
        containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior })
      },
      scrollToTop: (behavior: ScrollBehavior = 'smooth') => {
        containerRef.current?.scrollTo({ top: 0, behavior })
      },
    }))

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current!
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < scrollThreshold
    }

    useEffect(() => {
      if (autoScroll && isNearBottomRef.current) {
        containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
      }
    }, [children, autoScroll])

    return (
      <div
        ref={containerRef}
        className={cn('overflow-y-auto overflow-x-hidden scrollbar-hide', className)}
        onScroll={handleScroll}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ScrollArea.displayName = 'ScrollArea'