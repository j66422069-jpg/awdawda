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
      const { id } = queryStringParameters || {};
      if (id) {
        const { data: project, error: pError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        if (pError) throw pError;

        const { data: videos, error: vError } = await supabase
          .from('project_videos')
          .select('*')
          .eq('project_id', id)
          .order('sort_order', { ascending: true });
        if (vError) throw vError;

        const mappedProject = {
          ...project,
          thumbnailUrl: project.thumbnail_url,
          category: project.category || "",
          description: project.description || "",
          tech: {
            camera: project.tech_camera,
            lens: project.tech_lens,
            lighting: project.tech_lighting,
            color: project.tech_color
          },
          videos: videos.map(v => ({
            ...v,
            videoUrl: v.video_url,
            youtubeUrl: v.video_url,
            thumbnailUrl: v.thumbnail_url
          }))
        };

        return {
          statusCode: 200,
          body: JSON.stringify(mappedProject),
        };
      } else {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('year', { ascending: false });
        if (error) throw error;

        const mappedData = data.map(p => ({
          ...p,
          thumbnailUrl: p.thumbnail_url,
          category: p.category || "",
          description: p.description || "",
          tech: {
            camera: p.tech_camera,
            lens: p.tech_lens,
            lighting: p.tech_lighting,
            color: p.tech_color
          }
        }));

        return {
          statusCode: 200,
          body: JSON.stringify(mappedData),
        };
      }
    }

    if (!isValidAdmin) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const payload = JSON.parse(body || '{}');

    if (httpMethod === 'POST') {
      const { videos, tech, ...body } = payload;
      const row = {
        title: body.title ?? "",
        description: body.description ?? null,
        category: body.category ?? body.format ?? null,
        year: body.year ?? null,
        featured: body.featured ?? false,
        role: body.role ?? null,
        summary: body.summary ?? null,
        thumbnail_url: body.thumbnailUrl ?? body.thumbnail_url ?? null,
        tech_camera: tech?.camera ?? body.techCamera ?? body.tech_camera ?? null,
        tech_lens: tech?.lens ?? body.techLens ?? body.tech_lens ?? null,
        tech_lighting: tech?.lighting ?? body.techLighting ?? body.tech_lighting ?? null,
        tech_color: tech?.color ?? body.techColor ?? body.tech_color ?? null,
        link: body.link ?? null,
        updated_at: new Date().toISOString()
      };

      const { data: project, error: pError } = await supabase
        .from('projects')
        .insert([row])
        .select()
        .single();

      if (pError) {
        console.error('Insert project error:', pError);
        throw pError;
      }

      if (videos && Array.isArray(videos)) {
        const videoRows = videos.map((v, idx) => ({
          project_id: project.id,
          title: v.title ?? null,
          video_url: v.youtubeUrl ?? v.videoUrl ?? v.video_url ?? null,
          thumbnail_url: v.thumbnailUrl ?? v.thumbnail_url ?? null,
          sort_order: idx
        }));
        const { error: vError } = await supabase.from('project_videos').insert(videoRows);
        if (vError) {
          console.error('Insert project videos error:', vError);
          throw vError;
        }
      }

      return { statusCode: 200, body: JSON.stringify(project) };
    }

    if (httpMethod === 'PUT') {
      const { id } = queryStringParameters || {};
      if (!id) throw new Error('ID is required');

      const { videos, tech, ...body } = payload;
      const row = {
        title: body.title ?? "",
        description: body.description ?? null,
        category: body.category ?? body.format ?? null,
        year: body.year ?? null,
        featured: body.featured ?? false,
        role: body.role ?? null,
        summary: body.summary ?? null,
        thumbnail_url: body.thumbnailUrl ?? body.thumbnail_url ?? null,
        tech_camera: tech?.camera ?? body.techCamera ?? body.tech_camera ?? null,
        tech_lens: tech?.lens ?? body.techLens ?? body.tech_lens ?? null,
        tech_lighting: tech?.lighting ?? body.techLighting ?? body.tech_lighting ?? null,
        tech_color: tech?.color ?? body.techColor ?? body.tech_color ?? null,
        link: body.link ?? null,
        updated_at: new Date().toISOString()
      };

      const { error: pError } = await supabase
        .from('projects')
        .update(row)
        .eq('id', id);

      if (pError) {
        console.error('Update project error:', pError);
        throw pError;
      }

      // Update videos: delete and re-insert
      await supabase.from('project_videos').delete().eq('project_id', id);
      if (videos && Array.isArray(videos)) {
        const videoRows = videos.map((v, idx) => ({
          project_id: id,
          title: v.title ?? null,
          video_url: v.youtubeUrl ?? v.videoUrl ?? v.video_url ?? null,
          thumbnail_url: v.thumbnailUrl ?? v.thumbnail_url ?? null,
          sort_order: idx
        }));
        const { error: vError } = await supabase.from('project_videos').insert(videoRows);
        if (vError) {
          console.error('Update project videos error:', vError);
          throw vError;
        }
      }

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (httpMethod === 'DELETE') {
      const { id } = queryStringParameters || {};
      if (!id) throw new Error('ID is required');
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error('Projects function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
