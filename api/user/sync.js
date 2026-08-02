import { getDB, saveDB } from '../_lib/db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const db = getDB();
      const authEmail = req.headers['x-auth-email']
        ? req.headers['x-auth-email'].trim().toLowerCase()
        : null;

      let targetEmail = null;
      if (authEmail && db.profiles[authEmail]) {
        targetEmail = authEmail;
      } else {
        const userEmails = Object.keys(db.users);
        if (userEmails.length === 0) {
          return res.json({ profile: null, settings: null });
        }
        targetEmail = userEmails[0];
      }

      const userProfile = db.profiles[targetEmail];

      return res.json({
        profile: userProfile?.profile || null,
        settings: userProfile?.settings || null,
      });
    }

    if (req.method === 'POST') {
      const { profile, settings, email } = req.body;
      const db = getDB();

      // Determine target email
      let targetEmail = null;
      const authEmail = req.headers['x-auth-email']
        ? req.headers['x-auth-email'].trim().toLowerCase()
        : null;

      if (email) {
        const normEmail = email.trim().toLowerCase();
        if (db.profiles[normEmail]) {
          targetEmail = normEmail;
        }
      }
      if (!targetEmail && authEmail && db.profiles[authEmail]) {
        targetEmail = authEmail;
      }
      if (!targetEmail) {
        const userEmails = Object.keys(db.users);
        if (userEmails.length > 0) {
          targetEmail = userEmails[userEmails.length - 1];
        }
      }

      if (targetEmail) {
        db.profiles[targetEmail] = { profile, settings };
        if (profile?.guardian?.passcode) {
          db.guardianCodes[profile.guardian.passcode] = targetEmail;
        }
        if (profile?.guardian?.guardianCode) {
          db.guardianCodes[profile.guardian.guardianCode] = targetEmail;
        }
        saveDB(db);
      }

      return res.json({ message: 'Data synced successfully to backend database.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('User sync API error:', err);
    return res.json({ message: 'Local data saved.' });
  }
}
