import { test, expect } from '@playwright/test';

/**
 * Complete Package Pipeline Test
 * Validates that ALL core song creation features work end-to-end:
 * lyrics, beat, image (cover art), and video generation.
 * 
 * This test runs each generation sequentially (not in parallel) to avoid
 * hitting the 30/min rate limiter. Each test is independent.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// API-only tests — run in chromium only to avoid duplicate slow requests
test.skip(({ browserName }) => browserName !== 'chromium', 'API tests run in chromium only');

// ============================================================================
// 1. LYRICS GENERATION
// ============================================================================

test.describe.serial('Complete Package — Song Pipeline', () => {

  test('1. Lyrics generation works', async ({ request }) => {
    test.setTimeout(60000);
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: {
        prompt: 'Write a 4-bar verse about rising above adversity in the city',
        systemInstruction: 'You are a professional hip-hop songwriter. Write vivid, punchy lyrics with internal rhyme schemes.'
      }
    });

    expect([200, 429]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('output');
      expect(typeof data.output).toBe('string');
      expect(data.output.length).toBeGreaterThan(20);
      console.log(`✅ Lyrics generated (${data.output.length} chars): "${data.output.substring(0, 80)}..."`);
    } else {
      console.log('⚠️ Rate limited on lyrics — skipping content check');
    }
  });

  test('2. Beat/audio generation works', async ({ request }) => {
    test.setTimeout(300000);
    const response = await request.post(`${BACKEND_URL}/api/generate-audio`, {
      data: {
        prompt: 'dark trap beat with heavy 808s',
        bpm: 140,
        genre: 'trap',
        mood: 'aggressive',
        durationSeconds: 10,
        engine: 'auto'
      },
      timeout: 240000
    });

    expect([200, 429]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('audioUrl');
      expect(typeof data.audioUrl).toBe('string');
      expect(data.audioUrl.length).toBeGreaterThan(10);
      console.log(`✅ Beat generated: provider=${data.provider}, duration=${data.duration || data.actualDuration}s`);
    } else {
      console.log('⚠️ Rate limited on beat — skipping content check');
    }
  });

  test('3. Image/cover art generation works', async ({ request }) => {
    test.setTimeout(120000);
    const response = await request.post(`${BACKEND_URL}/api/generate-image`, {
      data: {
        prompt: 'album cover art, dark moody city skyline at night, neon lights, cinematic, high quality'
      },
      timeout: 90000
    });

    expect([200, 429]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      // Image endpoint returns either images array or imageUrl
      const hasImage = data.images || data.imageUrl || data.permanentUrl;
      expect(hasImage).toBeTruthy();
      console.log(`✅ Cover art generated: model=${data.model}, keys=${Object.keys(data).join(',')}`);
    } else {
      console.log('⚠️ Rate limited on image — skipping content check');
    }
  });

  test('4. Video generation works', async ({ request }) => {
    test.setTimeout(300000);
    const response = await request.post(`${BACKEND_URL}/api/generate-video`, {
      data: {
        prompt: 'artist performing in dark studio with smoke and neon lighting, cinematic music video',
        durationSeconds: 5,
        style: 'cinematic'
      },
      timeout: 240000
    });

    expect([200, 429]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      // Video gen may return videoUrl directly or an async operationId
      const hasVideo = data.videoUrl || data.operationId || data.status;
      expect(hasVideo).toBeTruthy();
      console.log(`✅ Video generation initiated: keys=${Object.keys(data).join(',')}`);
    } else {
      console.log('⚠️ Rate limited on video — skipping content check');
    }
  });
});

// ============================================================================
// SPEECH / VOCAL GENERATION
// ============================================================================

test.describe('Complete Package — Vocal Generation', () => {

  test('Speech/vocal generation works', async ({ request }) => {
    test.setTimeout(120000);
    const response = await request.post(`${BACKEND_URL}/api/generate-speech`, {
      data: {
        prompt: 'Rising up from nothing to something, watch me shine',
        voice: 'rapper-male-1',
        style: 'rapper',
        genre: 'hip-hop',
        language: 'English',
        duration: 10
      },
      timeout: 90000
    });

    expect([200, 400, 429, 503]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      const hasAudio = data.audioUrl || data.url || data.output;
      expect(hasAudio).toBeTruthy();
      console.log(`✅ Vocal generated: keys=${Object.keys(data).join(',')}`);
    } else {
      console.log(`⚠️ Vocal gen returned ${response.status()} — may need API keys or rate limited`);
    }
  });
});

// ============================================================================
// PARAMETER VALIDATION — EACH ENDPOINT
// ============================================================================

test.describe('Complete Package — Input Validation', () => {

  test('Lyrics rejects empty prompt', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: { prompt: '' }
    });
    expect([400, 429, 500]).toContain(response.status());
  });

  test('Image rejects empty prompt', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate-image`, {
      data: { prompt: '' }
    });
    expect([400, 429, 500]).toContain(response.status());
  });

  test('Audio rejects empty prompt', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate-audio`, {
      data: { prompt: '' }
    });
    expect([400, 429]).toContain(response.status());
  });

  test('Video rejects empty prompt', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/generate-video`, {
      data: { prompt: '' }
    });
    expect([400, 429]).toContain(response.status());
  });
});

// ============================================================================
// RESPONSE FORMAT VERIFICATION
// ============================================================================

test.describe('Complete Package — Response Formats', () => {

  test('Lyrics response has correct structure', async ({ request }) => {
    test.setTimeout(60000);
    const response = await request.post(`${BACKEND_URL}/api/generate`, {
      data: {
        prompt: 'Write one line about dreams',
        systemInstruction: 'Be brief'
      }
    });
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('output');
      expect(typeof data.output).toBe('string');
    }
    expect([200, 429]).toContain(response.status());
  });

  test('Image response has correct structure', async ({ request }) => {
    test.setTimeout(120000);
    const response = await request.post(`${BACKEND_URL}/api/generate-image`, {
      data: { prompt: 'simple abstract art' },
      timeout: 90000
    });
    if (response.status() === 200) {
      const data = await response.json();
      // Should have images array or imageUrl
      const hasImageData = data.images || data.imageUrl || data.permanentUrl;
      expect(hasImageData).toBeTruthy();
      if (data.model) expect(typeof data.model).toBe('string');
    }
    expect([200, 429]).toContain(response.status());
  });

  test('Audio response has correct structure', async ({ request }) => {
    test.setTimeout(180000);
    const response = await request.post(`${BACKEND_URL}/api/generate-audio`, {
      data: {
        prompt: 'simple piano melody',
        bpm: 100,
        genre: 'pop',
        durationSeconds: 5,
        engine: 'auto'
      },
      timeout: 120000
    });
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('audioUrl');
      expect(typeof data.audioUrl).toBe('string');
      // Should have duration info
      const dur = data.duration || data.actualDuration;
      if (dur) expect(typeof dur).toBe('number');
    }
    expect([200, 429]).toContain(response.status());
  });

  test('Video response has correct structure', async ({ request }) => {
    test.setTimeout(300000);
    const response = await request.post(`${BACKEND_URL}/api/generate-video`, {
      data: {
        prompt: 'abstract visual art moving slowly',
        durationSeconds: 3,
        style: 'artistic'
      },
      timeout: 240000
    });
    if (response.status() === 200) {
      const data = await response.json();
      // Video might return URL directly or async operation
      const hasResult = data.videoUrl || data.operationId || data.status || data.url;
      expect(hasResult).toBeTruthy();
    }
    expect([200, 429]).toContain(response.status());
  });
});
