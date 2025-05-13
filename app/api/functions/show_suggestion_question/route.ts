export async function GET() {
  // Always return 200 with a success message
  return new Response(JSON.stringify({ message: "Operation successful" }), { status: 200 });
}
