"use client";

import {
  Box,
  Button,
  HStack,
  Input,
  NativeSelectField,
  NativeSelectRoot,
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
  Text,
  Wrap,
} from "@chakra-ui/react";
import { useState } from "react";

/** 検索件数（1ページあたり）の選択肢 */
export const LIMIT_OPTIONS = [12, 24, 50, 100] as const;

type Props = {
  /** 検索キーワードの確定時に呼ばれる */
  onSearch: (keyword: string) => void;
  /** ページ変更時に呼ばれる（page は 1始まり） */
  onPageChange: (page: number) => void;
  /** 検索件数変更時に呼ばれる */
  onLimitChange: (limit: number) => void;
  /** 検索結果の総件数 */
  totalCount: number;
  /** 現在の検索件数（1ページあたり） */
  limit: number;
  /** 現在のページ（1始まり） */
  page: number;
  /** キーワード入力欄のプレースホルダ */
  placeholder?: string;
};

/**
 * 一覧画面共通の絞り込み検索 + ページ遷移ツールバー
 */
export default function SearchToolbar({
  onSearch,
  onPageChange,
  onLimitChange,
  totalCount,
  limit,
  page,
  placeholder = "キーワードで絞り込み",
}: Props) {
  const [keyword, setKeyword] = useState("");

  // 検索件数変更時は1ページ目に戻る
  const handleLimitChange = (nextLimit: number) => {
    onLimitChange(nextLimit);
    onPageChange(1);
  };

  const pageCount = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <Box
      as="form"
      w="100%"
      px={{ base: 4, md: 8 }}
      py={3}
      bg="rgba(0,0,0,0.25)"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(keyword.trim());
      }}
    >
      <Wrap gap="3" align="center">
        <HStack gap="2" flex="1 1 260px" maxW="420px">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={placeholder}
            size="sm"
            bg="white"
            color="black"
          />
          <Button type="submit" size="sm" colorPalette="orange" flexShrink={0}>
            検索
          </Button>
          <Button
            size="sm"
            variant="outline"
            colorPalette="gray"
            bg="white"
            color="black"
            flexShrink={0}
            onClick={() => {
              setKeyword("");
              onSearch("");
            }}
          >
            クリア
          </Button>
        </HStack>

        <HStack gap="2">
          <Text fontSize="sm" color="white" whiteSpace="nowrap">
            表示件数
          </Text>
          <NativeSelectRoot size="sm" width="auto" minW="90px">
            <NativeSelectField
              value={String(limit)}
              onChange={(e) =>
                handleLimitChange(Number.parseInt(e.target.value, 10))
              }
              bg="white"
              color="black"
              // ネイティブドロップダウン（option一覧）をブラウザのダーク
              // カラースキームに合わせず、常に明るい配色に固定する。
              // Chakra の native-select recipe は option の背景をセマンティック
              // トークン（bg）に設定するため、ダークモードでは黒になり、
              // 文字色（黒）と重なって読めなくなる。
              // css で option の色を明示的に白/黒へ上書きし、
              // color-scheme: light でポップアップ自体もライト描画にする。
              css={{
                colorScheme: "light",
                "& > option, & > optgroup": {
                  bg: "white",
                  color: "black",
                },
              }}
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={String(option)}>
                  {option}件
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        </HStack>

        <Text fontSize="sm" color="white" whiteSpace="nowrap">
          {totalCount}件ヒット
        </Text>
      </Wrap>

      {pageCount > 1 && (
        <PaginationRoot
          count={totalCount}
          pageSize={limit}
          page={page}
          onPageChange={(details) => onPageChange(details.page)}
          translations={{
            rootLabel: "ページ移動",
            prevTriggerLabel: "前へ",
            nextTriggerLabel: "次へ",
            itemLabel: ({ page: itemPage }) => `${itemPage}ページ目`,
          }}
          mt={2}
        >
          <Wrap gap="1" align="center">
            <PaginationPrevTrigger asChild>
              <Button size="xs" variant="outline" colorPalette="gray">
                前へ
              </Button>
            </PaginationPrevTrigger>
            <PaginationItems
              render={(items) => (
                <Button
                  key={items.value}
                  size="xs"
                  variant={items.value === page ? "solid" : "outline"}
                  colorPalette="orange"
                  onClick={() => onPageChange(items.value)}
                >
                  {items.value}
                </Button>
              )}
            />
            <PaginationNextTrigger asChild>
              <Button size="xs" variant="outline" colorPalette="gray">
                次へ
              </Button>
            </PaginationNextTrigger>
            <Text fontSize="sm" color="white" ml="2">
              {page} / {pageCount} ページ
            </Text>
          </Wrap>
        </PaginationRoot>
      )}
    </Box>
  );
}
