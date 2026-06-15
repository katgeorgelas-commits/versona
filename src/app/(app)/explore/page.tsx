import { redirect } from "next/navigation";

/** Explore merged into Discover (people + spaces + trending in one surface). */
export default function ExplorePage() {
  redirect("/discover");
}
