
import { useRef, useEffect, useState } from "react";

interface UseChatScrollOptions {
  messages: any[];
  loadingMessages: boolean;
  loadingMore: boolean;
  isNewMessage?: boolean;
  messagesToShow?: number;
  fullScreen?: boolean;
  scrollThreshold?: number; // Added configurable threshold
}

export function useChatScroll({ 
  messages, 
  loadingMessages, 
  loadingMore,
  isNewMessage = false,
  messagesToShow = 0,
  fullScreen = false,
  scrollThreshold = 150 // Default threshold for "near bottom" detection
}: UseChatScrollOptions) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<number | null>(null);

  // Debounced scroll handler to improve performance
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Use configurable threshold for "near bottom" detection
    const isNearBottom = scrollHeight - scrollTop - clientHeight < scrollThreshold;
    
    setShouldAutoScroll(isNearBottom);
    setShowScrollButton(!isNearBottom);
    
    if (!isNearBottom && !hasScrolledUp) {
      setHasScrolledUp(true);
    }

    // Set scrolling state with debounce
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
        // Scrolling down - hide header
        if (scrollTop > lastScrollTop && scrollTop > 50) {
          header.classList.add('hidden');
        } 
        // Scrolling up - show header
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
      // Clear any pending timeouts
      if (scrollTimerRef.current !== null) {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, [hasScrolledUp, fullScreen, lastScrollTop, scrollThreshold]);

  // Handle auto-scrolling with optimizations
  useEffect(() => {
    // Only auto-scroll in these conditions:
    // 1. When user is already near bottom
    // 2. When a new message is added (not when loading older messages)
    // 3. Not during initial loading of messages
    // 4. Not during loading more (older) messages
    if ((shouldAutoScroll || isNewMessage) && !loadingMessages && !loadingMore && !isScrolling) {
      const scrollToEndSmooth = () => {
        if (endRef.current) {
          const behavior = fullScreen || isNewMessage ? 'auto' : 'smooth';
          endRef.current.scrollIntoView({ 
            behavior, 
            block: 'end'
          });
          
          // Show header when auto-scrolling on mobile
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
        
        // Show header when manually scrolling to bottom
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
