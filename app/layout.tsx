export const metadata = {
  title: "Loyalty MVP",
  description: "Sellos + Ruleta para bares",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
