import type { Metadata } from "next";
import "~/styles/globals.css";
import "~/styles/splash.css";
import "~/styles/notepad.scss";
import Footer from "~/components/Footer";

export const metadata: Metadata = {
  title: "Task.Me",
  description: "Task everybody",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
