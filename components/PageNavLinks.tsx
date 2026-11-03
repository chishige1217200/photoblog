"use client";

import { Button, HStack } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/home", label: "ホーム" },
  { href: "/photo", label: "フォト一覧" },
  { href: "/book", label: "ブック一覧" },
];

export default function PageNavLinks() {
  const pathname = usePathname();

  return (
    <HStack as="nav" gap="3" wrap="wrap" justify="center">
      {navLinks.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Button
            key={link.href}
            asChild
            size="sm"
            variant={active ? "solid" : "outline"}
            colorPalette="gray"
            minW="7rem"
            borderRadius="full"
            whiteSpace="nowrap"
            aria-current={active ? "page" : undefined}
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        );
      })}
    </HStack>
  );
}
