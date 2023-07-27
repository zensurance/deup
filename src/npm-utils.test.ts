import axios from "axios"
import MockAdapter from "axios-mock-adapter"

import { getLatestVersion } from "./npm-utils"

// Create a mock instance of axios
const mockAxios = new MockAdapter(axios)

// Mock the npm registry API response
mockAxios.onGet("https://registry.npmjs.org/package-name").reply(200, {
  "dist-tags": {
    latest: "1.2.3",
  },
})

describe("getLatestVersion", () => {
  afterEach(() => {
    // Reset the axios mock after each test
    mockAxios.reset()
  })

  test("should return the latest version for a given package name", async () => {
    const packageName = "package-name"
    const latestVersion = await getLatestVersion(packageName)
    expect(latestVersion).toBe("1.2.3")
  })

  test("should handle errors and return null if the package name is not found", async () => {
    const packageName = "non-existent-package"
    const latestVersion = await getLatestVersion(packageName)
    expect(latestVersion).toBeNull()
  })
})