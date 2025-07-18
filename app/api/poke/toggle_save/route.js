import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import mongo from '../../../../back/mongo.js';
import supabase from '../../../../back/supabase.js';
import { messaging } from '../../../../back/firebase.js';

export async function GET(re) {
  const { searchParams } = re.nextUrl;
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 404 }, { status: 404 });

  const authorization = headers().get('authorization');
  if (!authorization) return NextResponse.json({ error: 401 }, { status: 401 });
  const token = authorization.replace('Bearer ', '');

  const tok = await mongo.collection('tokens').findOne({ token: token });
  if (!tok) return NextResponse.json({ error: 401 }, { status: 401 });

  const user = await mongo.collection('users').findOne({ uid: tok.uid });
  if (!user) return NextResponse.json({ error: 401 }, { status: 401 });

  const pke = await mongo.collection('pokes').findOne({ id: id, to: tok.uid });
  if (!pke || !pke.allowSave)
    return NextResponse.json({ error: 404 }, { status: 404 });

  const by = await mongo.collection('users').findOne({ uid: pke.by });
  if (!by) return NextResponse.json({ error: 401 }, { status: 401 });

  if (tok.uid != pke.to)
    return NextResponse.json({ error: 401 }, { status: 401 });

  const gallery = await mongo
    .collection('gallery')
    .findOne({ id: pke.id, by: pke.by });

  const ext = pke.is === 'img' ? 'jpg' : 'mp4';
  const name = `saved/${pke.id}.${ext}`;

  try {
    if (pke.saved) {
      if (gallery.to.length === 1) {
        const { error } = await supabase.storage.from('poke').remove([name]);

        if (error) {
          throw error;
        }
        await mongo.collection('gallery').deleteOne({ id: pke.id });
      } else
        await mongo
          .collection('gallery')
          .updateOne({ by: pke.by, id: pke.id }, { $pull: { to: pke.to } });
      await mongo
        .collection('pokes')
        .updateOne({ id: pke.id, to: tok.uid }, { $set: { saved: false } });
      return NextResponse.json({ error: null });
    }

    if (!gallery) {
      const { data: downloadData, error: downloadError } =
        await supabase.storage.from('poke').download(`pokes/${pke.id}.${ext}`);
      if (downloadError) throw downloadError;

      const buffer = await downloadData.arrayBuffer();
      const upload = await supabase.storage
        .from('poke')
        .upload(name, Buffer.from(buffer), {
          contentType: pke.is === 'img' ? 'image/jpeg' : 'video/mp4',
          upsert: true,
        });
      if (upload.error) throw upload.error;
    }

    if (by.fcmToken) {
      const message = {
        token: by.fcmToken,
        notification: {
          title: `${user.nick}`,
          body: `saved your poke!`,
          image: `https://apunwzrlgvqzzhzenzqa.supabase.co/storage/v1/object/public/users/${user.uid}.gif`,
        },
        data: {
          // just need some data or won't fire onMessage
          refresh: 'true',
        },
      };
      await messaging.send(message);
    }

    if (!gallery)
      await mongo.collection('gallery').insertOne({
        by: pke.by,
        id: pke.id,
        to: [pke.to],
        is: pke.is,
        geo: pke.geo,
        createdAt: pke.createdAt,
      });
    else
      await mongo
        .collection('gallery')
        .updateOne({ by: pke.by, id: pke.id }, { $push: { to: pke.to } });
    await mongo
      .collection('pokes')
      .updateOne({ id: pke.id, to: tok.uid }, { $set: { saved: true } });
    return NextResponse.json({ error: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
