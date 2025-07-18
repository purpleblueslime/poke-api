export default function page() {
  return (
    <>
      <div className='hero'>
        <div id='hero'>
          <div className='tag'>
            <div>We Are a</div>
            <div>
              <a className='feels'>Feelings</a> First
            </div>
            <div>Camera App</div>
          </div>
          <div className='emo'>
            <img id='gho' src='./ghost.svg' />
            <img id='bub' src='./bubbles.svg' />
            <img id='bal' src='./balloon.svg' />
            <img id='cam' src='./camera.svg' />
          </div>
        </div>
        <div className='small'>
          <div>We are a camera-first app for real memories.</div>
          <div>
            At Poke, we believe the camera isn't just for capturing — it's for
            feeling, for sharing, for being real.
          </div>
          <div>
            We're building a space where people can express themselves without
            filters 😉, connect in the now, and share life as it happens —
            messy, funny, beautiful.
          </div>
        </div>
      </div>
      <div className='bento'>
        <img src='./cam.png' />
        <img src='./send-poke.png' />
        <img src='./chats.png' />
        <img src='./open-poke.png' />
        <img src='./me.png' />
      </div>
      <div id='qna'>
        <div className='tag'>Why poke?</div>
        <div className='qna'>
          <div>Q 1. What's a poke?</div>
          <div className='ans'>
            A poke is a tiny moment you send to someone — a photo or video,
            unfiltered and fast. Not a story. Not a post. Just a direct moment.
          </div>
        </div>
        <div className='qna'>
          <div>Q 2. Why would I send one?</div>
          <div className='ans'>
            Because sometimes, you don't want to text. You want to show. A
            smile, a sky, a coffee cup, a memory, a mood. A poke is a way of
            saying, “This made me think of you.”
          </div>
        </div>
        <div className='qna'>
          <div>Q 3. Is it just like Snapchat?</div>
          <div className='ans'>
            It's not about streaks or filters. Poke is simpler. Cleaner. It's
            about sharing your now — not curating it.
          </div>
        </div>
        <div className='qna'>
          <div>Q 4. Who sees my poke?</div>
          <div className='ans'>
            Only the people you choose. One tap, one send, straight to their
            chat.
          </div>
        </div>
        <div className='qna'>
          <div>Q 5. What's the point?</div>
          <div className='ans'>
            Poke isn't here to distract you. It's here to connect you. Quietly.
            Quickly. Visually.
          </div>
        </div>
        <div className='qna'>
          <div>Q 6. Can I download Poke on iOS?</div>
          <div className='ans'>
            Not just yet — Poke isn't on the Apple App Store right now. We're
            working hard to bring it to iOS soon. Hang tight — it's coming your
            way 😊
          </div>
        </div>
      </div>
    </>
  );
}
