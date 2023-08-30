import fs from "fs-extra"
import shell from "shelljs"
import { addToRoot, install, removeDupes } from "./dedupe"

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

describe("addToRoot", () => {
  const packageName = "packageName"
  const maxVersion = "1.0.1"

  test("should not include --save-dev in command when isDevDependency is false", async () => {
    const expected = `npm install ${packageName}@${maxVersion} --save-exact  > /dev/null 2>&1`
    await addToRoot(packageName, maxVersion, false)
    expect(shell.exec).toHaveBeenCalledTimes(1)
    expect(shell.exec).toHaveBeenCalledWith(expected)
  })

  test("should include --save-dev in command when isDevDependency is true", async () => {
    const expected = `npm install ${packageName}@${maxVersion} --save-exact --save-dev > /dev/null 2>&1`
    await addToRoot(packageName, maxVersion, true)
    expect(shell.exec).toHaveBeenCalledTimes(1)
    expect(shell.exec).toHaveBeenCalledWith(expected)
  })
})

describe("install", () => {
  test("should execute writeJson when bootstrap script in package.json", async () => {
    const packageJsonWithBootstrap = {
      scripts: {
        bootstrap: "mock bootstrap"
      }
    }

    fs.readJson.mockResolvedValue(packageJsonWithBootstrap)
    await install()

    expect(fs.readJson).toHaveBeenCalledTimes(2)
    expect(fs.writeJson).toHaveBeenCalledTimes(2)
    expect(shell.exec).toHaveBeenCalledTimes(1)
    expect(shell.exec).toHaveBeenCalledWith("npm install")
  })

  test("should not execute writeJson when bootstrap script not in package.json", async () => {
    const packageJsonWithoutBootstrap = {}

    fs.readJson.mockResolvedValue(packageJsonWithoutBootstrap)
    await install()

    expect(fs.readJson).toHaveBeenCalledTimes(2)
    expect(fs.writeJson).toHaveBeenCalledTimes(0)
    expect(shell.exec).toHaveBeenCalledTimes(1)
    expect(shell.exec).toHaveBeenCalledWith("npm install")
  })
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
