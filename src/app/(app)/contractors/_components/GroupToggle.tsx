"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type Props = {
  value: "trade" | "project";
};

/**
 * Tabs that swap between trade-grouping and project-grouping by writing the
 * `?group=` search param. Server component handles the actual buckets.
 */
export function GroupToggle({ value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setGroup(next: string) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    if (next === "trade") params.delete("group");
    else params.set("group", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Tabs value={value} onValueChange={setGroup}>
      <TabsList>
        <TabsTrigger value="trade">By trade</TabsTrigger>
        <TabsTrigger value="project">By project</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
