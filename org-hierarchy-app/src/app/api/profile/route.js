import crypto from 'crypto';

export async function GET(request) {
  try {
    // Get email from query param (e.g., /api/profile?email=user@example.com)
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email query param required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Normalize and hash email using SHA256
    const normalizedEmail = email.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');

    // Build Gravatar API URL
    const url = `https://api.gravatar.com/v3/profiles/${hash}`;
    console.log(`Fetching Gravatar ${url}`);
    // Fetch from Gravatar API with your API key from env
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.GRAVATAR_API_KEY}`,
      },
    });

    if (res.status === 404) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(
        JSON.stringify({ error: `Gravatar API error: ${res.status}`, details: errorText }),
        {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const profileData = await res.json();

    return new Response(JSON.stringify(profileData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
