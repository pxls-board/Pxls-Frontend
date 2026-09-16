/** Browser capability detection for the board renderer. */

function checkImageRendering(prefix: string, crisp: boolean, pixelated: boolean, optimizeContrast: boolean) {
  const style = document.createElement('div').style;
  const attempt = (value: string) => {
    style.imageRendering = prefix + value;
    return style.imageRendering === prefix + value;
  };
  return (
    (crisp && attempt('crisp-edges')) ||
    (pixelated && attempt('pixelated')) ||
    (optimizeContrast && attempt('optimize-contrast'))
  );
}

function detect() {
  const ua = navigator.userAgent;
  let haveImageRendering =
    checkImageRendering('', true, true, false) ||
    checkImageRendering('-o-', true, false, false) ||
    checkImageRendering('-moz-', true, false, false) ||
    checkImageRendering('-webkit-', true, false, true);
  let haveZoomRendering = false;

  const webkitBased = /AppleWebKit/i.test(ua);
  const iOSSafari = /(iPod|iPhone|iPad)/i.test(ua) && webkitBased;
  const desktopSafari = /safari/i.test(ua) && !/chrome/i.test(ua);
  const msEdge = ua.includes('Edge');
  const possiblyMobile = window.innerWidth < 768 && ua.includes('Mobile');

  if (iOSSafari) {
    const match = /CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(ua);
    const version = parseFloat((match?.[1] ?? '3_2').replace('_', '.').replace('_', '')) || 0;
    haveImageRendering = false;
    haveZoomRendering = version >= 11;
  } else if (desktopSafari) {
    haveImageRendering = false;
    haveZoomRendering = true;
  }
  if (msEdge) {
    haveImageRendering = false;
  }

  return { haveImageRendering, haveZoomRendering, webkitBased, possiblyMobile };
}

let cached: ReturnType<typeof detect> | null = null;

export function browserFlags() {
  cached ??= detect();
  return cached;
}

/** Whether a keyboard event originates from a text field (hotkeys are ignored there). */
export function isTypingTarget(event: Event): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.nodeName) || target.isContentEditable;
}
