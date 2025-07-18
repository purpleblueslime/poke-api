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

  await mongo.collection('requests').deleteOne({ by: tok.uid, to: uid });

  return NextResponse.json({ error: null });
}
