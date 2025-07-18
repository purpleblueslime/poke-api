import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import mongo from '../../../../back/mongo.js';
import supabase from '../../../../back/supabase.js';

export async function POST(re) {
  const form = await re.formData();

  const nick = (form.get('nick') || '').trim();
  const imageFile = form.get('image');

  if (!nick && !imageFile)
    return NextResponse.json({ error: 422 }, { status: 422 });

  const authorization = headers().get('authorization');
  if (!authorization) return NextResponse.json({ error: 401 }, { status: 401 });

  const token = authorization.replace('Bearer ', '');
  const tok = await mongo.collection('tokens').findOne({ token });

  if (!tok) return NextResponse.json({ error: 401 }, { status: 401 });

  const update = {};
  if (nick) {
    if (nick.length > 10)
      return NextResponse.json({ error: 400 }, { status: 400 });
    update.nick = nick;
  }

  if (update.nick) {
    await mongo
      .collection('users')
      .updateOne({ uid: tok.uid }, { $set: update });
  }

  if (imageFile) {
    if (imageFile.size > 52428800) {
      // 50mb max
      return NextResponse.json({ error: 413 }, { status: 413 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('users')
      .upload(`${tok.uid}.gif`, buffer, {
        cacheControl: '86400',
        contentType: imageFile.type || 'image/gif',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError.message);
      return NextResponse.json({ error: 500 }, { status: 500 });
    }
  }

  return NextResponse.json({ error: null });
}
