import { useEffect, useState, RefObject } from 'react';

export function useVideoObserver(
  elementRef: RefObject<Element>,
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '100px' }
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options.threshold, options.rootMargin]);

  return isIntersecting;
}
export default useVideoObserver;
