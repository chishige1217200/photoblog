"use client"

import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  mergeConfigs,
} from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

// ボタンの形状をシステム全体でピル型に統一する。
// defaultConfig の button recipe を部分定義でディープマージし、
// borderRadius だけを上書きする（Googleログイン/ログアウトの
// gsi-material-button は Chakra 外のため影響しない）。
const config = mergeConfigs(defaultConfig, {
  theme: {
    recipes: {
      button: {
        base: {
          borderRadius: "full",
        },
      },
    },
  },
})

const system = createSystem(config)

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
