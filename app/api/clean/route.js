import { NextResponse } from 'next/server';
import mongo from '../../../back/mongo.js';
import supabase from '../../../back/supabase.js';

export async function GET() {
  const now = new Date();
  const ex = new Date(now.getTime() - 86400000); // 24 hrs <=

  const pokes = await mongo.collection('pokes').find({ createdAt: { $lt: ex } }).toArray();

  const files = pokes.map(
    (pke) => `pokes/${pke.id}.${pke.is == 'img' ? 'jpg' : 'mp4'}`
  );
  const { error } = await supabase.storage.from('poke').remove(files);

  if (error) {
    return NextResponse.json({ note: 'try again' }, { status: 500 });
  }

  await mongo.collection('pokes').deleteMany(query);

  return NextResponse.json({ note: 'clean completed', cleanedAt: Date.now() });
}
