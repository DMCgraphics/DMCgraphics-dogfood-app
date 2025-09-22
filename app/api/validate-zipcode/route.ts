import { NextResponse } from "next/server";
import { isAllowedZip, normalizeZip } from "@/lib/allowed-zips";

export async function POST(req: Request) {
  try {
    const { zipcode } = await req.json();
    
    if (!zipcode) {
      return NextResponse.json(
        { error: "Zipcode is required" }, 
        { status: 400 }
      );
    }
    
    const normalized = normalizeZip(zipcode);
    const isValid = isAllowedZip(normalized);
    
    return NextResponse.json({
      valid: isValid,
      zipcode: normalized,
      message: isValid 
        ? "Delivery available to this area" 
        : "We currently deliver only to Westchester County, NY and Fairfield County, CT."
    });
  } catch (error) {
    console.error("[validate-zipcode] Error:", error);
    return NextResponse.json(
      { error: "Invalid request" }, 
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const zipcode = url.searchParams.get('zipcode');
    
    if (!zipcode) {
      return NextResponse.json(
        { error: "Zipcode parameter is required" }, 
        { status: 400 }
      );
    }
    
    const normalized = normalizeZip(zipcode);
    const isValid = isAllowedZip(normalized);
    
    return NextResponse.json({
      valid: isValid,
      zipcode: normalized,
      message: isValid 
        ? "Delivery available to this area" 
        : "We currently deliver only to Westchester County, NY and Fairfield County, CT."
    });
  } catch (error) {
    console.error("[validate-zipcode] Error:", error);
    return NextResponse.json(
      { error: "Invalid request" }, 
      { status: 400 }
    );
  }
}
