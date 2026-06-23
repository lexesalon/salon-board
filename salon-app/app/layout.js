import "./globals.css";

export const metadata = {
  title: "サロンボード",
  description: "美容室売上管理アプリ",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
        <meta name="apple-mobile-web-app-title" content="サロンボード"/>
        <meta name="theme-color" content="#1A1A2E"/>
      </head>
      <body>{children}</body>
    </html>
  );
}
