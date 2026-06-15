import { Card, CardContent } from "@/components/ui/card";

/**
 * Temporary placeholder for features not yet built in the feature-by-feature
 * sequence. Each placeholder names the PRD section it implements so the build
 * order stays legible. Replaced wholesale when its feature turn arrives.
 */
export function FeaturePlaceholder({
  title,
  prdSection,
  summary,
  order,
}: {
  title: string;
  prdSection: string;
  summary: string;
  order: number;
}) {
  return (
    <div className="mx-auto max-w-2xl pt-8">
      <Card>
        <CardContent className="space-y-3 p-8">
          <span className="inline-flex items-center rounded-sm bg-accent-light px-2.5 py-0.5 text-[12px] font-medium text-accent">
            Build step {order} · PRD {prdSection}
          </span>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{summary}</p>
          <p className="text-sm text-muted-foreground">
            Scaffolded. This screen is built out when we reach it in the
            feature-by-feature sequence — with a review checkpoint before and
            after.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
