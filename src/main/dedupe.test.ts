import fs from "fs-extra"
import { removeDupes } from "./dedupe"

jest.mock("fs-extra", () => ({
  readJson: jest.fn(),
  writeJson: jest.fn(),
  unlink: jest.fn(),
  rmSync: jest.fn(),
}))
jest.mock("shelljs", () => ({ exec: jest.fn() }))

beforeEach(() => {
  jest.resetAllMocks()
})

describe("removeDupes", () => {
  const foundVersions = [
    {
      packages: [
        {
          name: "packageOne",
          path: "/test/path/one",
          dependencyAttribute: "devDependencies",
        },
      ],
      version: "1.0.0",
    },
  ]

  test("should remove dependencyAttribute because it's empty", async () => {
    const packageJson = {
      devDependencies: {
        packageOne: "1.0.0",
      },
    }

    fs.readJson.mockResolvedValue(packageJson)
    await removeDupes(foundVersions, "packageOne")

    expect(packageJson.devDependencies).toBeUndefined()
  })

  test("should remove dupe", async () => {
    const packageJson = {
      devDependencies: {
        packageOne: "1.0.0",
        packageTwo: "2.0.1"
      },
    }

    fs.readJson.mockResolvedValue(packageJson)
    await removeDupes(foundVersions, "packageOne")

    expect(packageJson).toEqual({devDependencies: { packageTwo: "2.0.1" }})
  })

  test("should not execute removeDupe actions because packageJson is undefined", async () => {
    const packageJson = undefined

    fs.readJson.mockResolvedValue(packageJson)
    await removeDupes(foundVersions, "packageTwo")

    expect(fs.writeJson).toHaveBeenCalledTimes(0)
    expect(fs.unlink).toHaveBeenCalledTimes(0)
    expect(fs.rmSync).toHaveBeenCalledTimes(0)
  })
})
