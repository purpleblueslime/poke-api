import { NextResponse } from 'next/server';
import crypto from 'crypto';
import mongo from '../../../back/mongo.js';
import sendEmail from '../../../back/sendEmail.js';

export async function POST(re) {
  const data = await re.json();
  if (!data.email) return NextResponse.json({ error: 500 }, { status: 500 });

  const email = data.email.trim();

  const rx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!rx.test(email))
    return NextResponse.json({ error: 500 }, { status: 500 });

  let user = await mongo.collection('users').findOne({ email: email });
  if (!user) user = { uid: null };

  const cde = await mongo.collection('codes').findOne({ email: email });
  if (cde) return NextResponse.json({ uid: user.uid });

  const code = crypto.randomInt(0, 1e6).toString().padStart(6, '0');
  const sent = await sendEmail(email, code);
  if (!sent) return NextResponse.json({ error: 500 }, { status: 500 });

  await mongo
    .collection('codes')
    .insertOne({ email: email, code: code, time: new Date() });

  return NextResponse.json({ uid: user.uid });
}
