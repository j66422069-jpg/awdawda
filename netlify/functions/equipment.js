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
      const { data, error } = await supabase.from('equipment').select('*');
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (!isValidAdmin) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const payload = JSON.parse(body || '{}');

    if (httpMethod === 'POST') {
      const { data, error } = await supabase.from('equipment').insert([payload]).select().single();
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (httpMethod === 'PUT') {
      const { id } = queryStringParameters || {};
      if (!id) throw new Error('ID is required');
      const { error } = await supabase.from('equipment').update(payload).eq('id', id);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (httpMethod === 'DELETE') {
      const { id } = queryStringParameters || {};
      if (!id) throw new Error('ID is required');
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error('Equipment function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
