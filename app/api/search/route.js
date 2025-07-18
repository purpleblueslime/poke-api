import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import mongo from '../../../back/mongo.js';

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
    .find({ $text: { $search: q } })
    .project({ uid: 1, nick: 1 })
    .toArray();
  if (!users) return NextResponse.json({ error: 404 }, { status: 404 });
  if (users.length === 0)
    return NextResponse.json({ error: 404 }, { status: 404 });

  const reqs = await mongo
    .collection('requests')
    .find({ to: tok.uid })
    .toArray();
  const uids = reqs.map(({ by }) => by);

  const reSent = await mongo
    .collection('requests')
    .find({ by: tok.uid })
    .toArray();
  const uidsSent = reSent.map(({ to }) => to);

  const usersWithAs = users
    .filter((u) => u.uid !== tok.uid)
    .map((user) => {
      if (uids.includes(user.uid)) {
        user.as = 'request';
      } else if (uidsSent.includes(user.uid)) {
        user.as = 'requested';
      } else if (usr.friends.includes(user.uid)) {
        user.as = 'friend';
      } else {
        user.as = 'ghost';
      }
      return user;
    });

  return NextResponse.json({ users: usersWithAs });
}
