// Augment React 19's JSX namespace with @react-three/fiber's ThreeElements.
// R3F v8 augments only the legacy global JSX, which React 19 types no longer
// route to — so we re-publish the same augmentation under react.JSX.
import type { ThreeElements } from "@react-three/fiber";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

export {};
