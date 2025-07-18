import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const { firebase } = process.env;
const login = JSON.parse(firebase);

initializeApp({
  credential: cert(login),
});

const messaging = getMessaging();

export { messaging };
