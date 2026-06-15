"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { toggleFollow } from "@/features/profile/actions";
import type { PersonCard } from "@/types/views";

export function PersonRow({
  person,
  following = false,
  showFollow = true,
}: {
  person: PersonCard;
  following?: boolean;
  showFollow?: boolean;
}) {
  const [isFollowing, setFollowing] = useState(following);
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <Link href={`/${person.username}`}>
        <Avatar name={person.displayName} src={person.avatarUrl} size={44} online={person.online} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/${person.username}`} className="font-semibold hover:underline">
          {person.displayName}
        </Link>
        <span className="ml-1 text-sm text-muted-foreground">@{person.username}</span>
        {person.headline && (
          <p className="line-clamp-1 text-sm text-muted-foreground">{person.headline}</p>
        )}
        {person.values.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {person.values.slice(0, 3).map((v) => (
              <Tag key={v} variant="value">{v}</Tag>
            ))}
          </div>
        )}
      </div>
      {showFollow && (
        <Button
          size="sm"
          variant={isFollowing ? "subtle" : "outline"}
          onClick={() => {
            setFollowing((f) => !f);
            startTransition(() => {
              void toggleFollow(person.id);
            });
          }}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
