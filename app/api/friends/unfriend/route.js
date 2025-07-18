import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import mongo from '../../../../back/mongo.js';

export async function GET(re) {
  const { searchParams } = re.nextUrl;
  const uid = searchParams.get('uid');
  if (!uid) return NextResponse.json({ error: 404 }, { status: 404 });

  const authorization = headers().get('authorization');
  if (!authorization) return NextResponse.json({ error: 401 }, { status: 401 });
  const token = authorization.replace('Bearer ', '');

  const tok = await mongo.collection('tokens').findOne({ token: token });
  if (!tok) return NextResponse.json({ error: 401 }, { status: 401 });

  await mongo
    .collection('users')
    .updateOne({ uid: tok.uid }, { $pull: { friends: uid } });
  await mongo
    .collection('users')
    .updateOne({ uid: uid }, { $pull: { friends: tok.uid } });

  const gallery = await mongo
    .collection('gallery')
    .find({
      $or: [
        { to: tok.uid, by: uid },
        { to: uid, by: tok.uid },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();

  for (g of gallery) {
    if (g.to.length == 1) {
      await mongo.collection('gallery').deleteOne({ id: g.id });
      const { error } = await supabase.storage
        .from('poke')
        .remove([`saved/${g.id}.${g.is == 'img' ? 'jpg' : 'mp4'}`]);
      continue;
    }

    if (g.by == tok.uid) {
      await mongo
        .collection('gallery')
        .updateOne({ id: g.id }, { $pull: { to: uid } });
    }

    if (g.by == uid) {
      await mongo
        .collection('gallery')
        .updateOne({ id: g.id }, { $pull: { to: tok.uid } });
    }
  }

  const pokes = await mongo
    .collection('pokes')
    .find({
      $or: [
        { to: tok.uid, by: uid },
        { to: uid, by: tok.uid },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();

  const ids = pokes.map((pke) => {
    pke.id;
  });

  await mongo.collection('pokes').deleteMany({ id: { $in: ids } });

  return NextResponse.json({ error: null });
}
