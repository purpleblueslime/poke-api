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

  const pke = await mongo.collection('gallery').findOne({
    $or: [
      { id: id, to: tok.uid },
      { id: id, by: tok.uid },
    ],
  });
  if (!pke) return NextResponse.json({ error: 404 }, { status: 404 });

  if (pke.is === 'img') {
    const { data, error } = await supabase.storage
      .from('poke')
      .createSignedUrl(`saved/${pke.id}.jpg`, 5 * 60); // expires in 5 min

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.redirect(data.signedUrl, 302);
  }

  const { data, error } = await supabase.storage
    .from('poke')
    .createSignedUrl(`saved/${pke.id}.mp4`, 5 * 60); // expires in 5 min

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.redirect(data.signedUrl, 302);
}
