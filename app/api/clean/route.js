import { NextResponse } from 'next/server';
import mongo from '../../../back/mongo.js';
import supabase from '../../../back/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET() {

  const now = new Date();
  const ex = new Date(now.getTime() - 86400000);

  const query = { createdAt: { $lt: ex } };

  const pokes = await mongo.collection('pokes').find(query).toArray();

  const files = pokes.map(
    (pke) => `pokes/${pke.id}.${pke.is === 'img' ? 'jpg' : 'mp4'}`
  );

  const { error } = await supabase.storage.from('poke').remove(files);

  if (error) {
    return NextResponse.json(
      { note: 'try again' },
      { status: 500 }
    );
  }

  await mongo.collection('pokes').deleteMany(query);

  return NextResponse.json({
    note: 'clean completed',
    cleanedAt: Date.now()
  });
}
