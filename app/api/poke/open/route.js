import { NextResponse } from 'next/server';
import mongo from '../../../../back/mongo.js';
import supabase from '../../../../back/supabase.js';

export async function GET(re) {
  const { searchParams } = re.nextUrl;
  const id = searchParams.get('id');
  const token = searchParams.get('token');
  if (!id || !token) return NextResponse.json({ error: 404 }, { status: 404 });

  const tok = await mongo.collection('tokens').findOne({ token: token });
  if (!tok) return NextResponse.json({ error: 401 }, { status: 401 });

  const pke = await mongo.collection('pokes').findOne({ id: id, to: tok.uid });
  if (!pke) return NextResponse.json({ error: 404 }, { status: 404 });

  if (!pke.allowSave && pke.opened)
    return NextResponse.json({ error: 401 }, { status: 401 });

  if (!pke.opened) {
    const inc = {};
    inc[`pokes.${pke.to}`] = 1;
    await mongo.collection('users').updateOne({ uid: pke.by }, { $inc: inc });
    await mongo
      .collection('pokes')
      .updateOne({ id: pke.id, to: tok.uid }, { $set: { opened: true } });
  }

  const ext = pke.is === 'img' ? 'jpg' : 'mp4';
  const name = `pokes/${pke.id}.${ext}`;

  const { data, error } = await supabase.storage
    .from('poke')
    .createSignedUrl(name, 5 * 60);

  if (error) {
    return NextResponse.json({ error: 404 }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
