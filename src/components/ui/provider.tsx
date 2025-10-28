import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider } from "./color-mode"
import { darkSystem } from "../../theme/dark"

export function Provider(props) {
  return (
    <ChakraProvider value={darkSystem}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}