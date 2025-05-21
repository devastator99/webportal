
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
  const initialRenderRef = useRef(true);

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
    
    // If user has scrolled to bottom, reset hasScrolledUp
    if (isNearBottom && hasScrolledUp) {
      setHasScrolledUp(false);
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

  // Handle initial render to prevent unwanted auto-scrolling
  useEffect(() => {
    if (initialRenderRef.current && !loadingMessages && messages.length > 0) {
      scrollToBottom();
      initialRenderRef.current = false;
    }
  }, [loadingMessages, messages.length]);

  // Handle auto-scrolling with optimizations - completely rewritten for better control
  useEffect(() => {
    // Don't auto scroll if:
    // 1. User has scrolled up manually
    // 2. We're still loading messages
    // 3. We're loading more messages
    // 4. User is currently scrolling
    
    // Do auto scroll if:
    // 1. We have new messages AND user hasn't manually scrolled up
    // 2. We should auto scroll (we're near the bottom) AND we're not loading or scrolling
    
    const shouldScrollNow = (
      (!hasScrolledUp && isNewMessage) || 
      (shouldAutoScroll && !loadingMessages && !loadingMore && !isScrolling)
    );
    
    if (shouldScrollNow) {
      const scrollToEndSmooth = () => {
        if (endRef.current) {
          // Use appropriate scroll behavior based on context
          // Use 'auto' for new messages to prevent animation issues
          const behavior = isNewMessage ? 'auto' : 'smooth';
          endRef.current.scrollIntoView({ 
            behavior, 
            block: 'end'
          });
          
          // Reset flags after scrolling
          if (isNewMessage) {
            setHasScrolledUp(false);
          }
          
          if (fullScreen) {
            const header = document.querySelector('.chat-fullscreen-header');
            if (header) {
              header.classList.remove('hidden');
            }
          }
        }
      };
      
      // Small delay to ensure DOM is ready
      const scrollTimer = setTimeout(() => {
        scrollToEndSmooth();
      }, 50);
      
      return () => clearTimeout(scrollTimer);
    }
  }, [messages, loadingMessages, loadingMore, shouldAutoScroll, isNewMessage, messagesToShow, fullScreen, isScrolling, hasScrolledUp]);

  const scrollToBottom = () => {
    if (endRef.current) {
      // Reset user initiated scroll flag when explicit scroll to bottom occurs
      userInitiatedScrollRef.current = false;
      
      // Use small timeout to ensure DOM is ready
      setTimeout(() => {
        if (endRef.current) {
          endRef.current.scrollIntoView({ 
            behavior: 'auto', // Always use 'auto' for manual scrolling to avoid issues
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
        }
      }, 10);
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
