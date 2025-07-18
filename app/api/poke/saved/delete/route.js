import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import mongo from '../../../../../back/mongo.js';
import supabase from '../../../../../back/supabase.js';

export async function GET(re) {
  const { searchParams } = re.nextUrl;
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 404 }, { status: 404 });

  const authorization = headers().get('authorization');
  if (!authorization) return NextResponse.json({ error: 401 }, { status: 401 });
  const token = authorization.replace('Bearer ', '');

  const tok = await mongo.collection('tokens').findOne({ token });
  if (!tok) return NextResponse.json({ error: 401 }, { status: 401 });

  const gallery = await mongo.collection('gallery').findOne({ id });
  if (!gallery) return NextResponse.json({ error: 404 }, { status: 404 });

  if (!gallery.to.includes(tok.uid) && gallery.by !== tok.uid) {
    return NextResponse.json({ error: 404 }, { status: 404 });
  }

  // delete if only 1 user saved or sender is deleting
  if (gallery.by === tok.uid || gallery.to.length === 1) {
    const ext = gallery.is === 'img' ? 'jpg' : 'mp4';
    const { error } = await supabase.storage
      .from('poke')
      .remove([`saved/${gallery.id}.${ext}`]);

    if (error) {
      console.error('supabase delete error:', error.message);
      return NextResponse.json({ error: 500 }, { status: 500 });
    }

    await mongo.collection('gallery').deleteOne({ id: gallery.id });

    const p = await mongo.collection('pokes').findOne({ id: id });
    if (p) {
      await mongo
        .collection('pokes')
        .updateMany({ id: id }, { $set: { saved: false } });
    }
  } else {
    await mongo
      .collection('gallery')
      .updateOne({ id: gallery.id }, { $pull: { to: tok.uid } });

    const pe = await mongo.collection('pokes').findOne({ id: id, to: tok.uid });

    if (pe) {
      await mongo
        .collection('pokes')
        .updateOne({ id: id, to: tok.uid }, { $set: { saved: false } });
    }
  }

  return NextResponse.json({ error: null });
}
