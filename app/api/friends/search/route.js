import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import mongo from '../../../../back/mongo.js';

export async function GET(re) {
  const { searchParams } = re.nextUrl;
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 404 }, { status: 404 });

  const authorization = headers().get('authorization');
  if (!authorization) return NextResponse.json({ error: 401 }, { status: 401 });
  const token = authorization.replace('Bearer ', '');

  const tok = await mongo.collection('tokens').findOne({ token: token });
  if (!tok) return NextResponse.json({ error: 401 }, { status: 401 });

  const usr = await mongo.collection('users').findOne({ uid: tok.uid });
  if (!usr) return NextResponse.json({ error: 401 }, { status: 401 });

  const users = await mongo
    .collection('users')
    .find({ uid: { $in: usr.friends }, $text: { $search: q } })
    .project({ uid: 1, nick: 1 })
    .toArray();

  if (!users) return NextResponse.json({ error: 404 }, { status: 404 });
  if (users.length === 0)
    return NextResponse.json({ error: 404 }, { status: 404 });

  return NextResponse.json({ users: users });
}
