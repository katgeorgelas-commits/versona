import { NextResponse } from "next/server";

/**
 * Marks an API endpoint whose contract is scaffolded but whose implementation
 * arrives in its feature turn. Returns 501 with the feature + PRD reference so
 * the API surface is discoverable and self-documenting before it's built.
 */
export function notYetImplemented(feature: string, prdSection: string) {
  return NextResponse.json(
    {
      error: "not_implemented",
      feature,
      prdSection,
      message: `${feature} (PRD ${prdSection}) is scaffolded and built in its feature turn.`,
    },
    { status: 501 },
  );
}
