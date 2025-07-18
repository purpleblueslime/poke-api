import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongo from '../../../../back/mongo.js';

export async function POST(re) {
  const data = await re.json();

  if (!data.email || !data.code) return NextResponse.json({ token: null });

  const email = data.email.trim();

  const user = await mongo
    .collection('codes')
    .findOne({ email: email, code: data.code });
  if (!user) return NextResponse.json({ token: null });

  const usr = await mongo.collection('users').findOne({ email: email });
  if (!usr) return NextResponse.json({ token: null });

  await mongo.collection('codes').deleteOne({ code: data.code });

  const tok = await mongo.collection('tokens').findOne({ uid: usr.uid });
  if (tok) {
    return NextResponse.json({ token: tok.token });
  }

  const k = crypto.randomBytes(20).toString('hex');
  const token = jwt.sign({ uid: usr.uid }, k);
  mongo
    .collection('tokens')
    .insertOne({ uid: usr.uid, token: token, createdAt: new Date() });
  return NextResponse.json({ token: token });
}
