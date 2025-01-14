import { Metadata } from 'next';
import { PropsWithChildren } from 'react';


const title = 'Next.js ';
const description = '.';

export const getLayoutProps = (): Metadata => {
  return {
    title,
    description,
  };
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="">
        <main
          id="skip"
          className="min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
