import { getDB, saveDB } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, guardianName, guardianEmail } = req.body;
    if (!code || !guardianName) {
      return res.status(400).json({ error: 'Guardian code and guardian name are required.' });
    }

    // Clean the code: strip STDX- prefix, dashes, uppercase
    const cleanCode = code.toString().trim().toUpperCase().replace(/^STDX-/, '').replace(/-/g, '');
    const fullCode = `STDX-${cleanCode.substring(0, 6)}-${cleanCode.substring(6)}`;
    const db = getDB();

    // Look up in guardianCodes map
    let targetEmail = db.guardianCodes[cleanCode] || db.guardianCodes[fullCode];
    if (!targetEmail) {
      // Fallback: scan profiles for matching guardian code or passcode
      for (const em of Object.keys(db.profiles)) {
        const p = db.profiles[em]?.profile;
        const pcode = p?.guardian?.passcode;
        const gcode = p?.guardian?.guardianCode;
        if (pcode === cleanCode || gcode === fullCode || gcode === cleanCode) {
          targetEmail = em;
          break;
        }
      }
    }

    if (!targetEmail || !db.profiles[targetEmail]) {
      return res.status(404).json({ error: 'Invalid Guardian Code. No student found.' });
    }

    const profile = db.profiles[targetEmail];
    const existingGuardian = profile.profile.guardian || {};

    // Update guardian link
    profile.profile.guardian = {
      ...existingGuardian,
      connectedGuardianName: guardianName,
      guardianEmail: guardianEmail || existingGuardian.guardianEmail || null,
      linkedAt: new Date().toISOString(),
    };

    // Store reverse mapping in guardianLinks
    if (!db.guardianLinks) db.guardianLinks = {};
    db.guardianLinks[cleanCode] = {
      studentEmail: targetEmail,
      guardianName,
      guardianEmail: guardianEmail || null,
      linkedAt: new Date().toISOString(),
    };

    saveDB(db);

    return res.json({
      success: true,
      message: 'Successfully connected to student!',
      studentName: profile.profile.name,
    });
  } catch (err) {
    console.error('Guardian connect API error:', err);
    return res.status(500).json({ error: 'Server error during guardian connection.' });
  }
}
