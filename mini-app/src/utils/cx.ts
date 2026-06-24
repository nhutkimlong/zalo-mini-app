// Utility to handle combining and mapping class names to CSS Module hashes safely
export default function cx(styles: Record<string, string>, ...classes: (string | undefined | null | false | number)[]) {
  return classes
    .filter(Boolean)
    .map(c => {
      if (!c) return '';
      // Split by space to handle strings like "home-banner flex-row"
      return String(c)
        .split(' ')
        .map(cls => styles[cls] || cls) // If class exists in CSS Module, use the hashed version. Else use the original string.
        .join(' ');
    })
    .join(' ');
}
