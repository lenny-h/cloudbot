export function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitMilliseconds: number,
): F & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = function (this: any, ...args: any[]) {
    const context = this;

    const later = () => {
      timeoutId = undefined;
      func.apply(context, args);
    };

    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, waitMilliseconds);
  } as F & { cancel: () => void };

  debounced.cancel = function () {
    clearTimeout(timeoutId);
  };

  return debounced;
}
