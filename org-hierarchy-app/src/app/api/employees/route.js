export async function GET(request) {
  return new Response(JSON.stringify({ message: 'Hello World' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request) {
  // handle POST here if you want
  return new Response(JSON.stringify({ message: 'POST not implemented' }), {
    status: 405,
  });
}
