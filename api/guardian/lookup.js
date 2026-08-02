import { getDB } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Guardian code required.' });

    const cleanCode = code.toString().trim().toUpperCase().replace(/^STDX-/, '').replace(/-/g, '');
    const db = getDB();

    let targetEmail = db.guardianCodes[cleanCode];
    if (!targetEmail) {
      const withDashes = code.toString().trim().toUpperCase();
      targetEmail = db.guardianCodes[withDashes];
    }
    if (!targetEmail) {
      for (const em of Object.keys(db.profiles)) {
        const p = db.profiles[em]?.profile;
        if (p?.guardian?.passcode === cleanCode) {
          targetEmail = em;
          break;
        }
        if (p?.guardian?.guardianCode === code.toString().trim().toUpperCase()) {
          targetEmail = em;
          break;
        }
      }
    }

    if (!targetEmail || !db.profiles[targetEmail]) {
      return res.status(404).json({ error: 'No student account found for this Guardian Code.' });
    }

    return res.json({
      student: db.users[targetEmail],
      profile: db.profiles[targetEmail].profile,
    });
  } catch (err) {
    console.error('Guardian lookup API error:', err);
    return res.status(500).json({ error: 'Error processing Guardian lookup.' });
  }
}