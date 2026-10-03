import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title:'Dayline — Today’s news & your local weather',
 description:'A daily view of India and the world. Read the latest headlines by category and check current weather and a five-day forecast for your city.',
 icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
