import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import mongo from '../../../back/mongo.js';

export async function GET() {
  const authorization = headers().get('authorization');
  if (!authorization) return NextResponse.json({ error: 401 }, { status: 401 });
  const token = authorization.replace('Bearer ', '');

  const tok = await mongo.collection('tokens').findOne({ token: token });
  if (!tok) return NextResponse.json({ error: 401 }, { status: 401 });

  const usr = await mongo.collection('users').findOne({ uid: tok.uid });
  if (!usr) return NextResponse.json({ error: 401 }, { status: 401 });

  await mongo
    .collection('tokens')
    .updateOne({ uid: tok.uid }, { $set: { createdAt: new Date() } });

  const p = Object.values(usr.pokes).reduce((_, pke) => _ + pke, 0);

  const re = await mongo
    .collection('requests')
    .find({ to: tok.uid })
    .sort({ _id: -1 })
    .toArray();

  const reUids = re.map(({ by }) => by);

  const requests = await mongo
    .collection('users')
    .find({ uid: { $in: reUids } })
    .project({ uid: 1, nick: 1 })
    .toArray();

  const requestsWithSort = reUids.map((uid) =>
    requests.find((r) => r.uid === uid)
  );

  const friends = await mongo
    .collection('users')
    .find({ uid: { $in: usr.friends } })
    .project({ uid: 1, nick: 1 })
    .sort({ nick: 1 })
    .toArray();

  const streaks = await mongo
    .collection('streaks')
    .find({
      $and: [{ 'users.uid': usr.uid }, { 'users.uid': { $in: usr.friends } }],
    })
    .toArray();

  const now = Date.now();
  const aDay = 86400000;

  usr.friends = friends.map((frnd) => {
    frnd.pokes = usr['pokes'][frnd.uid] || 0;
    const strk = streaks.find(
      (s) =>
        s.users.some((u) => u.uid === usr.uid) &&
        s.users.some((u) => u.uid === frnd.uid)
    );

    if (strk?.startedAt) {
      const startedAt = new Date(strk.startedAt).getTime();
      const dys = Math.floor((now - startedAt) / aDay);
      frnd.streaks = dys;
    } else frnd.streaks = 0;

    return frnd;
  });

  const last24Hrs = new Date(Date.now() - aDay);
  const pokes = await mongo
    .collection('pokes')
    .find({ to: tok.uid, createdAt: { $gte: last24Hrs } }) // also find pokes that're only 24hr or newer
    .sort({ createdAt: -1 })
    .toArray();

  const pokesWithStuff = pokes.map((poke) => {
    const user = usr.friends.find((user) => user.uid === poke.by);
    poke.by = user;
    return poke;
  });

  const gallery = await mongo
    .collection('gallery')
    .find({ $or: [{ to: usr.uid }, { by: usr.uid }] })
    .sort({ createdAt: -1 })
    .toArray();

  const galleryWithUser = gallery.map((gllry) => {
    gllry.by = usr.friends.find((frien) => frien.uid == gllry.by) || {
      uid: usr.uid,
      nick: usr.nick,
      p: p,
    };
    gllry.to = gllry.to
      .map((gllyUser) =>
        gllyUser == usr.uid
          ? {
              uid: usr.uid,
              nick: usr.nick,
              p: p,
            }
          : usr.friends.find((frien) => frien.uid == gllyUser)
      )
      .filter((v) => v);
    return gllry;
  });

  return NextResponse.json({
    uid: usr.uid,
    nick: usr.nick,
    p: p,
    friends: usr.friends,
    requests: requestsWithSort,
    pokes: pokesWithStuff,
    gallery: [], // we do grouping in app now leave it like this to avoid app break on v > 1.5.5
    justGallery: galleryWithUser,
  });
}
