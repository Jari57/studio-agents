const extensions = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/flac': 'flac', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' };

export function exportExtension(blob, url) {
  const mime = String(blob.type || '').split(';')[0].toLowerCase();
  if (extensions[mime]) return extensions[mime];
  const suffix = String(url || '').split(/[?#]/)[0].match(/\.(mp3|wav|flac|ogg|m4a|png|jpg|jpeg|webp|mp4|webm)$/i)?.[1];
  return suffix?.toLowerCase() || 'bin';
}

export async function readExportMedia(url, fetcher = fetch) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  if (!blob.size) throw new Error('Empty file');
  if (/^(text\/|application\/json)/i.test(blob.type)) throw new Error('The URL did not return media');
  return blob;
}

export async function downloadVerifiedMedia(url, baseName) {
  const blob = await readExportMedia(url);
  const name = `${String(baseName).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 140)}.${exportExtension(blob, url)}`;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = objectUrl; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return name;
}

export async function collectProjectExport(media, baseName, fetcher = fetch) {
  const requested = Object.entries(media).filter(([, url]) => Boolean(url));
  const results = await Promise.all(requested.map(async ([role, url]) => {
    try {
      const blob = await readExportMedia(url, fetcher);
      return { role, sourceUrl: url, name: `${baseName} - ${role}.${exportExtension(blob, url)}`, blob, status: 'exported' };
    } catch (error) {
      return { role, status: 'failed', error: error.message };
    }
  }));
  const failed = results.filter(item => item.status === 'failed');
  if (failed.length) {
    const error = new Error(`Export stopped: ${failed.map(item => item.role).join(', ')} could not be retrieved. No partial ZIP was downloaded.`);
    error.failedFiles = failed;
    throw error;
  }
  return {
    assets: results,
    manifest: { version: 1, exportedAt: new Date().toISOString(), status: 'complete',
      files: results.map(({ blob, ...item }) => ({ ...item, mimeType: blob.type || 'unknown', bytes: blob.size })),
      fidelity: 'Original downloaded formats retained. Compressed sources are not lossless originals.',
      timing: 'Source timing retained; alignment must be auditioned.' },
  };
}
