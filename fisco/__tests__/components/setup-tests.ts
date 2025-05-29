import { vi } from "vitest"

// Only import and setup jsdom-specific things when in jsdom environment
if (typeof window !== "undefined") {
  // Import jest-dom only in jsdom environment
  await import("@testing-library/jest-dom")

  // Mock console.error to avoid noisy console output during tests
  const originalConsoleError = console.error
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render") || args[0].includes("Warning: React.createElement"))
    ) {
      return
    }
    originalConsoleError(...args)
  }

  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock IntersectionObserver
  class IntersectionObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    constructor() {}
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: IntersectionObserver,
  })
}

// Global setup that works in both environments
const originalConsoleError = console.error
console.error = (...args) => {
  // Filter out common test warnings in both environments
  if (typeof args[0] === "string" && (args[0].includes("Warning:") || args[0].includes("deprecated"))) {
    return
  }
  originalConsoleError(...args)
}
