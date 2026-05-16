// Cloudflare Pages Function - API代理
// 路径: /api/chat
// 将请求转发到源站FastAPI后端

const ORIGIN_API = 'http://82.156.191.219:8080/api/chat';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    
    const resp = await fetch(ORIGIN_API, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Pages-Function/1.0',
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    try {
      const data = JSON.parse(text);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: 'Origin returned non-JSON', detail: text.substring(0, 200) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const message = url.searchParams.get('message') || '';
    const session_id = url.searchParams.get('session_id') || '';
    
    const params = new URLSearchParams();
    if (message) params.set('message', message);
    if (session_id) params.set('session_id', session_id);
    
    const resp = await fetch(ORIGIN_API + '?' + params.toString(), {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Pages-Function/1.0',
      },
    });

    const text = await resp.text();
    try {
      const data = JSON.parse(text);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: 'Origin returned non-JSON', detail: text.substring(0, 200) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
