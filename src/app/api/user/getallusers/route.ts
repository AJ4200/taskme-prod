import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET() {
  try {
    const allUsers = await db.user.findMany();
    return NextResponse.json(allUsers, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
