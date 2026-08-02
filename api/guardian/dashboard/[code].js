import { getDB } from '../../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawCode = req.query.code;
    if (!rawCode) {
      return res.status(400).json({ error: 'Guardian code is required.' });
    }

    const cleanCode = rawCode.toString().trim().toUpperCase().replace(/^STDX-/, '').replace(/-/g, '');
    const fullCode = `STDX-${cleanCode.substring(0, 6)}-${cleanCode.substring(6)}`;
    const db = getDB();

    let targetEmail = null;

    // First check guardianLinks for an active connection
    const link = db.guardianLinks[cleanCode];
    if (link && link.studentEmail) {
      targetEmail = link.studentEmail;
    } else {
      // Fallback to guardianCodes
      targetEmail = db.guardianCodes[cleanCode] || db.guardianCodes[fullCode];
    }

    if (!targetEmail || !db.profiles[targetEmail]) {
      return res.status(404).json({ error: 'Not connected. Please enter Guardian Code first.' });
    }

    const userProfile = db.profiles[targetEmail];

    return res.json({
      student: {
        name: userProfile.profile.name,
        avatar: userProfile.profile.avatar,
        selectedClass: userProfile.profile.selectedClass,
        email: targetEmail,
      },
      profile: userProfile.profile,
      settings: userProfile.settings,
      guardianLink: db.guardianLinks[cleanCode] || null,
    });
  } catch (err) {
    console.error('Guardian dashboard API error:', err);
    return res.status(500).json({ error: 'Error loading guardian dashboard.' });
  }
}