import { NextResponse } from "next/server";
import { authorizedField, ApiError, failure } from "@/lib/server/http";
import { irrigationContext } from "@/lib/server/irrigation-context";
export const maxDuration = 30;
export async function GET(req: Request) {
  try {
    const { client, field } = await authorizedField(
      req,
      new URL(req.url).searchParams.get("fieldId"),
      "monitoring",
    );
    let context;
    try {
      context = await irrigationContext(client, field);
    } catch {
      throw new ApiError(503, "database_error");
    }
    return NextResponse.json(context, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
