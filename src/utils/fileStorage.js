const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Converts a Base64 data URL into a stored file in public/uploads/<subfolder>
 * Returns the public URL path `/uploads/<subfolder>/filename.ext`
 */
function saveBase64Image(base64Str, subfolder = 'photos') {
  if (!base64Str || typeof base64Str !== 'string') return base64Str;
  
  // If it's already an HTTP URL or relative /uploads path, preserve as is
  if (base64Str.startsWith('http://') || base64Str.startsWith('https://') || base64Str.startsWith('/uploads/')) {
    return base64Str;
  }

  // Match Base64 image data URI pattern
  const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+\/]+);base64,(.+)$/);
  if (!matches) {
    return base64Str;
  }

  const mimeSub = matches[1].toLowerCase();
  const ext = mimeSub.includes('jpeg') || mimeSub.includes('jpg') ? 'jpg' :
              mimeSub.includes('png') ? 'png' :
              mimeSub.includes('webp') ? 'webp' : 'jpg';

  const buffer = Buffer.from(matches[2], 'base64');
  
  const uploadDir = path.join(__dirname, '../../public/uploads', subfolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${subfolder}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, buffer);
  return `/uploads/${subfolder}/${filename}`;
}

module.exports = { saveBase64Image };
