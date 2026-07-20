import { Html, Head, Main, NextScript } from 'next/document';

const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme') || 'light';
    var root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    }
    var accentColor = localStorage.getItem('accentColor') || '#224b82';
    root.style.setProperty('--accent-color', accentColor);
  } catch(e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
