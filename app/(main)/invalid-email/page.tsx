import { signOut } from "@/auth";
import { Box, Center, Text, VStack } from "@chakra-ui/react";
import Image from "next/image";
import React from "react";

const ErrorPage401: React.FC = () => {
  const offlineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === "true";
  return (
    <Center minH="100dvh" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
      <Box
        borderWidth="1px"
        borderRadius="md"
        p={{ base: 4, md: 6 }}
        maxH={{ base: "60vh", md: "65vh" }}
        overflowY="auto"
        bg="gray.50"
        fontSize={{ base: "sm", md: "md" }}
      >
        <VStack>
          <Image src="/icon.svg" width={120} height={120} alt="" />
          <Text fontSize="lg" color="blackAlpha.900">
            サービスが「クローズドモード」に設定されています。
          </Text>
          <Text fontSize="lg" color="blackAlpha.900">
            お使いのメールアドレスは許可されていません。
          </Text>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="gsi-material-button" disabled={offlineMode}>
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <span className="gsi-material-button-contents">ログアウト</span>
                <span style={{ display: "none" }}>ログアウト</span>
              </div>
            </button>
          </form>
        </VStack>
      </Box>
    </Center>
  );
};

export default ErrorPage401;
