import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import mongo from '../../../../back/mongo.js';

export async function POST(re) {
  const data = await re.json();

  if (!data.fcmToken) return NextResponse.json({ error: 422 }, { status: 422 });

  const authorization = headers().get('authorization');
  if (!authorization) return NextResponse.json({ error: 401 }, { status: 401 });
  const token = authorization.replace('Bearer ', '');

  const tok = await mongo.collection('tokens').findOne({ token: token });
  if (!tok) return NextResponse.json({ error: 401 }, { status: 401 });

  await mongo
    .collection('users')
    .updateOne({ uid: tok.uid }, { $set: { fcmToken: data.fcmToken } });

  return NextResponse.json({ error: null });
}
