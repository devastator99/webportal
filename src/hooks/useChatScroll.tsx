
import { useRef, useEffect, useState } from "react";

interface UseChatScrollOptions {
  messages: any[];
  loadingMessages: boolean;
  loadingMore: boolean;
  isNewMessage?: boolean;
}

export function useChatScroll({ 
  messages, 
  loadingMessages, 
  loadingMore,
  isNewMessage = false
}: UseChatScrollOptions) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handle scroll position detection
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      // Consider "near bottom" to be within 100px of the bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setShouldAutoScroll(isNearBottom);
      setShowScrollButton(!isNearBottom);
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
  }, []);

  // Handle auto-scrolling - improved to better handle new messages
  useEffect(() => {
    // Only auto-scroll in these conditions:
    // 1. When user is already near bottom
    // 2. When a new message is added (not when loading older messages)
    // 3. Not during initial loading of messages
    // 4. Not during loading more (older) messages
    if ((shouldAutoScroll || isNewMessage) && !loadingMessages && !loadingMore) {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, loadingMessages, loadingMore, shouldAutoScroll, isNewMessage]);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShouldAutoScroll(true);
    setShowScrollButton(false);
  };

  return {
    endRef,
    containerRef,
    showScrollButton,
    scrollToBottom
  };
}
