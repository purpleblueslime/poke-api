import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongo from '../../../../back/mongo.js';
import supabase from '../../../../back/supabase.js';

export async function POST(re) {
  const form = await re.formData();

  const email = (form.get('email') || '').trim();
  const code = form.get('code');
  const nick = (form.get('nick') || '').trim();
  const imageFile = form.get('image');

  if (!email || !code || !nick || nick.length > 10 || !imageFile)
    return NextResponse.json({ token: null });

  if (imageFile.size > 52428800) {
    // 50mb max
    return NextResponse.json({ error: 413 }, { status: 413 });
  }

  const user = await mongo.collection('codes').findOne({
    email: email,
    code: code,
  });
  if (!user) return NextResponse.json({ token: null });

  const usr = await mongo.collection('users').findOne({ email });
  if (usr) return NextResponse.json({ token: null });

  await mongo.collection('codes').deleteOne({ code });

  const newUser = {
    uid: crypto.randomBytes(20).toString('hex'),
    email: email,
    nick: nick,
    pokes: {},
    friends: [],
  };

  const buffer = Buffer.from(await imageFile.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('users')
    .upload(`${newUser.uid}.gif`, buffer, {
      cacheControl: '86400',
      contentType: imageFile.type || 'image/gif',
    });

  if (uploadError) {
    console.error('Upload failed:', uploadError.message);
    return NextResponse.json({ error: 500 }, { status: 500 });
  }

  await mongo.collection('users').insertOne(newUser);

  const k = crypto.randomBytes(20).toString('hex');
  const token = jwt.sign({ uid: newUser.uid }, k);

  await mongo.collection('tokens').insertOne({
    uid: newUser.uid,
    token: token,
    createdAt: new Date(),
  });

  return NextResponse.json({ token });
}
