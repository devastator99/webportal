
import { useRef, useEffect, useState } from "react";

interface UseChatScrollOptions {
  messages: any[];
  loadingMessages: boolean;
  loadingMore: boolean;
  isNewMessage?: boolean;
  messagesToShow?: number;
  fullScreen?: boolean;
  scrollThreshold?: number;
}

export function useChatScroll({ 
  messages, 
  loadingMessages, 
  loadingMore,
  isNewMessage = false,
  messagesToShow = 0,
  fullScreen = false,
  scrollThreshold = 150
}: UseChatScrollOptions) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<number | null>(null);
  const userInitiatedScrollRef = useRef(false);

  // Improved scroll handler with better position detection
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    // Mark that user has interacted with scroll
    userInitiatedScrollRef.current = true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // More accurate "near bottom" detection with configurable threshold
    const isNearBottom = scrollHeight - scrollTop - clientHeight < scrollThreshold;
    
    setShouldAutoScroll(isNearBottom);
    setShowScrollButton(!isNearBottom);
    
    // Only track scroll-up state when user has actually interacted
    if (!isNearBottom && !hasScrolledUp && userInitiatedScrollRef.current) {
      setHasScrolledUp(true);
    }

    // Enhanced scrolling state tracking with debounce
    setIsScrolling(true);
    if (scrollTimerRef.current !== null) {
      window.clearTimeout(scrollTimerRef.current);
    }
    
    scrollTimerRef.current = window.setTimeout(() => {
      setIsScrolling(false);
      scrollTimerRef.current = null;
    }, 200);

    // Handle header visibility on mobile
    if (fullScreen) {
      const header = document.querySelector('.chat-fullscreen-header');
      if (header) {
        // Show/hide header based on scroll direction
        if (scrollTop > lastScrollTop && scrollTop > 50) {
          header.classList.add('hidden');
        } 
        else if (scrollTop < lastScrollTop) {
          header.classList.remove('hidden');
        }
        setLastScrollTop(scrollTop <= 0 ? 0 : scrollTop);
      }
    }
  };

  // Initialize scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimerRef.current !== null) {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, [hasScrolledUp, fullScreen, lastScrollTop, scrollThreshold]);

  // Handle auto-scrolling with optimizations
  useEffect(() => {
    // Only auto-scroll if we should AND not in the middle of user-initiated scrolling
    if ((shouldAutoScroll || isNewMessage) && !loadingMessages && !loadingMore && !isScrolling) {
      const scrollToEndSmooth = () => {
        if (endRef.current) {
          // Use appropriate scroll behavior based on context
          const behavior = fullScreen || isNewMessage ? 'auto' : 'smooth';
          endRef.current.scrollIntoView({ 
            behavior, 
            block: 'end'
          });
          
          if (fullScreen) {
            const header = document.querySelector('.chat-fullscreen-header');
            if (header && isNewMessage) {
              header.classList.remove('hidden');
            }
          }
        }
      };
      
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(scrollToEndSmooth);
    }
  }, [messages, loadingMessages, loadingMore, shouldAutoScroll, isNewMessage, messagesToShow, fullScreen, isScrolling]);

  const scrollToBottom = () => {
    if (endRef.current) {
      // Reset user initiated scroll flag when explicit scroll to bottom occurs
      userInitiatedScrollRef.current = false;
      
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ 
          behavior: fullScreen ? 'auto' : 'smooth',
          block: 'end',
          inline: 'nearest'
        });
        setShouldAutoScroll(true);
        setShowScrollButton(false);
        setHasScrolledUp(false);
        
        if (fullScreen) {
          const header = document.querySelector('.chat-fullscreen-header');
          if (header) {
            header.classList.remove('hidden');
          }
        }
      });
    }
  };

  return {
    endRef,
    containerRef,
    showScrollButton,
    scrollToBottom,
    hasScrolledUp,
    isScrolling
  };
}
