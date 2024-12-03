export async function GET() {
  return Response.json({
    message: "Hello from the scrape API!",
    success: true,
    status: 200,
  });
}
