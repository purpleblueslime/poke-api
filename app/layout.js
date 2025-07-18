'use client';

import Link from 'next/link';
import './style.css';

export default function layout({ children }) {
  const scrollToDownload = () => {
    window.scrollTo({
      top: app.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <html>
      <head>
        <title>We are Poke</title>
        <link rel='icon' type='image/png' href='/icon.png' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content='We are poke!' />
        <meta
          name='twitter:image'
          content='https://pokebyslime.vercel.app/poke-banner.png'
        />
        <meta name='twitter:site' content='@ik_moksh' />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=League+Spartan:wght@800&display=swap'
        />
      </head>
      <body id='app'>
        <div className='pokeapp'>
          <div className='navbar'>
            <Link className='name' href='/'>
              Poke <div className='dull'>v1.x.x</div>
            </Link>
            <div className='links'>
              <a className='link' onClick={() => scrollToDownload()}>
                Download
              </a>
            </div>
          </div>
          {children}
          <div className='foo'>
            <Link
              className='link dwnl'
              href='https://play.google.com/store/apps/details?id=com.slime.poke'
              target='_'
            >
              <div className='download'>
                <img src='/google-icon.png' />
                <div className='on'>
                  <div className='small'>Download on</div>
                  <div className='big'>Google Play</div>
                </div>
              </div>
            </Link>
            <div className='links'>
              <Link
                className='link'
                href='https://x.com/we_are_poke'
                target='_'
              >
                X
              </Link>
              <Link
                className='link'
                href='https://discord.gg/S2HQvhSyzW'
                target='_'
              >
                Discord
              </Link>
              <Link className='link' href='./privacy'>
                Privacy
              </Link>
              <Link className='link' href='./tos'>
                Tos
              </Link>
            </div>
          </div>
        </div>
        <div id='rainbow'>
          <div className='col' id='bei'></div>
          <div className='col' id='gre'></div>
          <div className='col' id='cya'></div>
          <div className='col' id='pur'></div>
          <div className='col' id='pin'></div>
        </div>
      </body>
    </html>
  );
}
