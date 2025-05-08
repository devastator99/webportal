
import { useRef, useEffect, useState } from "react";

interface UseChatScrollOptions {
  messages: any[];
  loadingMessages: boolean;
  loadingMore: boolean;
  isNewMessage?: boolean;
  messagesToShow?: number;
  fullScreen?: boolean; // Added fullScreen option
}

export function useChatScroll({ 
  messages, 
  loadingMessages, 
  loadingMore,
  isNewMessage = false,
  messagesToShow = 0,
  fullScreen = false // Default to false
}: UseChatScrollOptions) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);

  // Handle scroll position detection
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      // Consider "near bottom" to be within 100px of the bottom for faster detection on mobile
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setShouldAutoScroll(isNearBottom);
      setShowScrollButton(!isNearBottom);
      
      if (!isNearBottom && !hasScrolledUp) {
        setHasScrolledUp(true);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasScrolledUp]);

  // Handle auto-scrolling - optimized for mobile and full-screen mode
  useEffect(() => {
    // Only auto-scroll in these conditions:
    // 1. When user is already near bottom
    // 2. When a new message is added (not when loading older messages)
    // 3. Not during initial loading of messages
    // 4. Not during loading more (older) messages
    if ((shouldAutoScroll || isNewMessage) && !loadingMessages && !loadingMore) {
      requestAnimationFrame(() => {
        if (fullScreen) {
          // For full-screen mode, use a more aggressive scroll behavior
          endRef.current?.scrollIntoView({ behavior: 'auto' });
        } else {
          endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }, [messages, loadingMessages, loadingMore, shouldAutoScroll, isNewMessage, messagesToShow, fullScreen]);

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
      });
    }
  };

  return {
    endRef,
    containerRef,
    showScrollButton,
    scrollToBottom,
    hasScrolledUp
  };
}
