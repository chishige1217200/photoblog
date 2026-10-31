import { Button, HStack } from "@chakra-ui/react";
import Link from "next/link";

type Props = {
  href: string;
  label: string;
};

export default function BackLink({ href, label }: Props) {
  return (
    <HStack justify="center" px="4" py="4">
      <Button asChild size="sm" variant="outline" colorPalette="gray" borderRadius="full">
        <Link href={href}>&larr; {label}</Link>
      </Button>
    </HStack>
  );
}
