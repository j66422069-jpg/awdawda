import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  const { httpMethod, headers, body, queryStringParameters } = event;

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
    if (httpMethod === 'GET') {
      const { key } = queryStringParameters || {};
      if (key) {
        const { data, error } = await supabase
          .from('site_content')
          .select('value')
          .eq('key', key)
          .single();
        if (error) {
          if (error.code === 'PGRST116') return { statusCode: 200, body: JSON.stringify(null) };
          throw error;
        }
        return { statusCode: 200, body: JSON.stringify(data.value) };
      } else {
        const { data, error } = await supabase.from('site_content').select('*');
        if (error) throw error;
        const result = data.reduce((acc, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});
        return { statusCode: 200, body: JSON.stringify(result) };
      }
    }

    if (!isValidAdmin) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (httpMethod === 'POST') {
      const bodyData = JSON.parse(body || '{}');
      
      // Handle both single {key, value} and multiple {key: value} pairs
      let pairs = [];
      if (bodyData.key && bodyData.value !== undefined) {
        pairs.push({ key: bodyData.key, value: bodyData.value });
      } else {
        pairs = Object.entries(bodyData).map(([key, value]) => ({ key, value }));
      }

      if (pairs.length === 0) throw new Error('No data provided');

      const { error } = await supabase
        .from('site_content')
        .upsert(pairs, { onConflict: 'key' });
      
      if (error) throw error;

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error('Content function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
