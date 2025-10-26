const express = require('express');

function createUploadMiddleware({ fieldName, limits = {}, fileFilter } = {}) {
  if (!fieldName) {
    throw new Error('fieldName is required to create an upload middleware.');
  }

  let multer;
  try {
    // Prefer the real multer dependency when it is available. This keeps
    // compatibility with environments where multipart/form-data parsing is
    // required.
    // eslint-disable-next-line global-require
    multer = require('multer');
  } catch (error) {
    multer = null;
  }

  if (multer) {
    const storage = multer.memoryStorage();
    return multer({ storage, limits, fileFilter }).single(fieldName);
  }

  const fileSizeLimit = typeof limits.fileSize === 'number' ? limits.fileSize : undefined;
  const rawParser = express.raw({
    type: () => true,
    limit: fileSizeLimit || 10 * 1024 * 1024,
  });

  return function uploadFallback(req, res, next) {
    rawParser(req, res, (rawErr) => {
      if (rawErr) {
        return next(rawErr);
      }

      if (!Buffer.isBuffer(req.body)) {
        req.file = undefined;
        return next();
      }

      const contentType = req.headers['content-type'] || '';
      if (!contentType.startsWith('multipart/form-data')) {
        req.file = undefined;
        return next();
      }

      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      if (!boundaryMatch) {
        req.file = undefined;
        return next();
      }

      const boundary = boundaryMatch[1] || boundaryMatch[2];

      let file;
      try {
        file = extractFileFromMultipart(req.body, boundary, fieldName);
      } catch (parseErr) {
        return next(parseErr);
      }

      if (!file) {
        req.file = undefined;
        return next();
      }

      if (fileSizeLimit && file.size > fileSizeLimit) {
        const limitError = new Error(`File exceeds size limit of ${fileSizeLimit} bytes.`);
        limitError.code = 'LIMIT_FILE_SIZE';
        return next(limitError);
      }

      const finalize = () => {
        req.file = file;
        req.body = {};
        return next();
      };

      if (typeof fileFilter === 'function') {
        fileFilter(req, file, (filterErr, accept) => {
          if (filterErr) {
            return next(filterErr);
          }
          if (accept === false) {
            req.file = undefined;
            req.body = {};
            return next();
          }
          return finalize();
        });
      } else {
        finalize();
      }
    });
  };
}

function extractFileFromMultipart(buffer, boundary, targetField) {
  const boundaryText = `--${boundary}`;
  const bodyText = buffer.toString('binary');
  const parts = bodyText.split(boundaryText);

  for (const rawPart of parts) {
    if (!rawPart || rawPart === '--' || rawPart === '--\r\n') {
      continue;
    }

    const part = rawPart.trim();
    if (!part) {
      continue;
    }

    const separatorIndex = part.indexOf('\r\n\r\n');
    if (separatorIndex === -1) {
      continue;
    }

    const headerSection = part.slice(0, separatorIndex);
    let contentSection = part.slice(separatorIndex + 4);

    const headers = headerSection
      .split('\r\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const dispositionHeader = headers.find((line) => line.toLowerCase().startsWith('content-disposition'));
    if (!dispositionHeader) {
      continue;
    }

    const nameMatch = dispositionHeader.match(/name="([^"]+)"/i);
    if (!nameMatch || nameMatch[1] !== targetField) {
      continue;
    }

    const filenameMatch = dispositionHeader.match(/filename="([^"]*)"/i);
    const originalname = filenameMatch && filenameMatch[1] ? filenameMatch[1] : 'upload';

    const typeHeader = headers.find((line) => line.toLowerCase().startsWith('content-type'));
    const mimetype = typeHeader ? typeHeader.split(':').slice(1).join(':').trim() : 'application/octet-stream';

    if (contentSection.endsWith('--')) {
      contentSection = contentSection.slice(0, -2);
    }
    if (contentSection.endsWith('\r\n')) {
      contentSection = contentSection.slice(0, -2);
    }

    const bufferContent = Buffer.from(contentSection, 'binary');

    return {
      fieldname: targetField,
      originalname,
      encoding: '7bit',
      mimetype,
      size: bufferContent.length,
      buffer: bufferContent,
    };
  }

  return null;
}

module.exports = createUploadMiddleware;
