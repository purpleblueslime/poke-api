import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import mongo from '../../../../back/mongo.js';
import { messaging } from '../../../../back/firebase.js';

export async function GET(re) {
  const { searchParams } = re.nextUrl;
  const uid = searchParams.get('uid');
  if (!uid) return NextResponse.json({ error: 404 }, { status: 404 });

  const authorization = headers().get('authorization');
  if (!authorization) return NextResponse.json({ error: 401 }, { status: 401 });
  const token = authorization.replace('Bearer ', '');

  const tok = await mongo.collection('tokens').findOne({ token: token });
  if (!tok) return NextResponse.json({ error: 401 }, { status: 401 });

  const req = await mongo
    .collection('requests')
    .findOne({ by: uid, to: tok.uid });
  if (!req) return NextResponse.json({ error: 403 }, { status: 403 });

  const toUser = await mongo.collection('users').findOne({ uid: uid });
  if (!toUser) return NextResponse.json({ error: 401 }, { status: 401 });

  const user = await mongo.collection('users').findOne({ uid: tok.uid });
  if (!user) return NextResponse.json({ error: 401 }, { status: 401 });

  await mongo
    .collection('users')
    .updateOne({ uid: tok.uid }, { $addToSet: { friends: uid } });
  await mongo
    .collection('users')
    .updateOne({ uid: uid }, { $addToSet: { friends: tok.uid } });
  await mongo.collection('requests').deleteOne({ by: uid, to: tok.uid });

  if (toUser.fcmToken) {
    const message = {
      token: toUser.fcmToken,
      notification: {
        title: `${user.nick}`,
        body: `is now your friend!`,
        image: `https://apunwzrlgvqzzhzenzqa.supabase.co/storage/v1/object/public/users/${user.uid}.gif`,
      },
    };

    await messaging.send(message);

    const data = {
      token: toUser.fcmToken,
      data: {
        // just need some data or won't fire onMessage
        refresh: 'true',
      },
    };

    await messaging.send(data);
  }

  return NextResponse.json({ error: null });
}
