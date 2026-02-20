import "./globals.css";

export const metadata = {
  title: "Loyalty MVP",
  description: "Fidelización para negocios",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "Inter, Poppins, system-ui, sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
