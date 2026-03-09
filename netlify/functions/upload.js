import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  const { httpMethod, headers, body } = event;

  try {
    // 1. Check environment variables
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_TOKEN } = process.env;
    if (!SUPABASE_URL) {
      console.error('Missing SUPABASE_URL');
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing SUPABASE_URL' }) };
    }
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }) };
    }
    if (!ADMIN_TOKEN) {
      console.error('Missing ADMIN_TOKEN');
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing ADMIN_TOKEN' }) };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const adminToken = headers['x-admin-token'];
    const isValidAdmin = adminToken === ADMIN_TOKEN;
    if (httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!isValidAdmin) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { image } = JSON.parse(body || '{}');
    if (!image) throw new Error('Image data is required');

    // Handle base64: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid image format');

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${Date.now()}.${contentType.split('/')[1]}`;

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: publicUrl }),
    };
  } catch (error) {
    console.error('Upload function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
