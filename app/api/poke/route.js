import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import supabase from '../../../back/supabase.js';
import mongo from '../../../back/mongo.js';
import { messaging } from '../../../back/firebase.js';

export async function POST(re) {
  const formData = await re.formData();
  const file = formData.get('file');
  const is = formData.get('is');
  const uids = JSON.parse(formData.get('uids'));
  const allowSave = formData.get('allowSave') === 'true';
  const isGeo = formData.get('geo');
  // im sending geo as 'null' STRING with pMultiipart func on app :(
  const geo = isGeo == 'null' ? null : isGeo;

  if (!is || !uids || !file)
    return NextResponse.json({ error: 403 }, { status: 403 });

  if (file.size > 52428800) {
    // 50mb max
    return NextResponse.json({ error: 413 }, { status: 413 });
  }

  const fileBuff = await file.arrayBuffer();

  const authorization = headers().get('authorization');
  if (!authorization) return NextResponse.json({ error: 401 }, { status: 401 });
  const token = authorization.replace('Bearer ', '');

  const tok = await mongo.collection('tokens').findOne({ token: token });
  if (!tok) return NextResponse.json({ error: 401 }, { status: 401 });

  const user = await mongo.collection('users').findOne({ uid: tok.uid });
  if (!user) return NextResponse.json({ error: 401 }, { status: 401 });

  const poke = {
    by: tok.uid,
    is: is,
    opened: false,
    saved: false,
    allowSave: allowSave,
    geo: geo,
    createdAt: new Date(),
  };
  poke.id = crypto.randomBytes(20).toString('hex');

  const ext = is === 'img' ? 'jpg' : 'mp4';
  if (!ext) return NextResponse.json({ error: 403 }, { status: 403 });

  const { error: uploadError } = await supabase.storage
    .from('poke')
    .upload(`pokes/${poke.id}.${ext}`, Buffer.from(fileBuff), {
      contentType: ext == 'jpg' ? 'image/jpg' : 'video/mp4',
    });

  if (uploadError) {
    console.error('Upload failed:', uploadError.message);
    return NextResponse.json({ error: 500 }, { status: 500 });
  }

  const pokes = uids
    .filter((uid) => user.friends.includes(uid))
    .map((uid) => ({
      ...poke,
      to: uid,
    }));

  if (pokes.length > 0) {
    await mongo.collection('pokes').insertMany(pokes);
  }

  const fUids = uids.filter((uid) => user.friends.includes(uid));

  const users = await mongo
    .collection('users')
    .find({ uid: { $in: fUids } })
    .toArray();

  const streaks = await mongo
    .collection('streaks')
    .find({
      $and: [{ 'users.uid': user.uid }, { 'users.uid': { $in: fUids } }],
    })
    .toArray();

  const now = new Date();
  const aDay = 86400000;

  const updates = streaks.map((streak) => {
    const userAt = streak.users.findIndex((u) => u.uid === user.uid);
    const friend = streak.users.find((u) => u.uid !== user.uid);

    const poked = friend?.updatedAt && now - new Date(friend.updatedAt) <= aDay;

    const updateSet = {
      [`users.${userAt}.updatedAt`]: now,
    };

    if (poked) {
      updateSet.deleteAt = new Date(now.getTime() + aDay);
    }

    if (poked && !streak.startedAt) {
      updateSet.startedAt = now;
    }

    return {
      updateOne: {
        filter: { _id: streak._id },
        update: { $set: updateSet },
      },
    };
  });

  if (updates.length) {
    await mongo.collection('streaks').bulkWrite(updates);
  }

  const upUids = new Set(
    streaks.map((s) => s.users.find((u) => u.uid !== user.uid)?.uid)
  );

  const newUids = fUids.filter((uid) => !upUids.has(uid));

  const newStreaks = newUids.map((uid) => ({
    users: [
      { uid: user.uid, updatedAt: now },
      { uid, updatedAt: null },
    ],
    startedAt: null,
    deleteAt: new Date(now.getTime() + aDay),
  }));

  if (newStreaks.length) {
    await mongo
      .collection('streaks')
      .insertMany(newStreaks, { ordered: false });
  }

  const notifications = users
    .filter((u) => !!u.fcmToken) // skip these
    .map((u) => {
      const message = {
        token: u.fcmToken,
        notification: {
          title: `${user.nick}`,
          body: `${allowSave ? 'poked' : 'ghosted'} you-`,
          image: `https://apunwzrlgvqzzhzenzqa.supabase.co/storage/v1/object/public/users/${user.uid}.gif`,
        },
        data: {
          // just need some data or won't fire onMessage
          refresh: 'true',
        },
      };
      return messaging.send(message);
    });

  await Promise.allSettled(notifications);
  return NextResponse.json({ error: null });
}
