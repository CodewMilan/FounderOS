import "@testing-library/jest-dom"

// jsdom does not implement matchMedia; provide a minimal stub so components
// that call window.matchMedia (e.g. the shadcn useIsMobile hook) don't throw.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
