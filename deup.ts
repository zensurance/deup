#!/usr/bin/env node

import { program } from "commander"
import fs from "fs-extra"
import { sync } from "glob"
import ora from "ora"
import shell from "shelljs"

import packageJSON from "./package.json" assert { type: "json" }

const getPackageFiles = (): string[] => sync("**/package.json", {
    ignore: ["**/node_modules/**/package.json", "package.json"],
})

const sortObjectAttributes = (originalObj: Record<string, string>): Record<string, string> => {
    return Object
        .keys(originalObj)
        .sort()
        .reduce(
            (obj, key) => {
                obj[key] = originalObj[key]
                return obj
            },
            {}
        )
}

const removeDupes = async (packageFiles: string[], packageName: string): Promise<string> => {
    let maxVersion = ""
    const dependencyAttributes = ["dependencies", "devDependencies"]
    for (const packageFile of packageFiles) {
        const packageJson = await fs.readJson(packageFile)
        for (const dependencyAttribute of dependencyAttributes) {
            if (packageJson?.[dependencyAttribute]?.[packageName]) {
                const currVersion = packageJson[dependencyAttribute][packageName].replace(/^\^|~/, "")
                maxVersion = currVersion > maxVersion ? currVersion : maxVersion

                // Remove the dependency
                delete packageJson[dependencyAttribute][packageName]

                // Remove the dependency attribute if it's empty
                if (!Object.values(packageJson[dependencyAttribute]).length) {
                    delete packageJson[dependencyAttribute]
                }

                await fs.writeJson(packageFile, packageJson, { spaces: 2 })

                // Remove package-lock.json
                const packageLockPath = packageFile.replace("package.json", "package-lock.json")
                fs.unlink(packageLockPath)

                // Remove node_modules folders
                const nodeModulesPath = packageFile.replace("package.json", "node_modules")
                fs.rmSync(nodeModulesPath, { recursive: true, force: true });
            }
        }
    }
    return maxVersion
}

const addToRootAndInstall = async (packageName: string, maxVersion: string): Promise<void> => {
    const rootPackageJson = await fs.readJson("package.json")
    rootPackageJson.dependencies[packageName] = maxVersion
    rootPackageJson.dependencies = sortObjectAttributes(rootPackageJson.dependencies)

    rootPackageJson.scripts["bootstrap"] = rootPackageJson.scripts["bootstrap"].replace("--ci", "--no-ci")
    await fs.writeJson("package.json", rootPackageJson, { spaces: 2 })

    shell.exec("npm install")

    rootPackageJson.scripts["bootstrap"] = rootPackageJson.scripts["bootstrap"].replace("--no-ci", "--ci")
    await fs.writeJson("package.json", rootPackageJson, { spaces: 2 })
}

const dedupe = async (packageName: string): Promise<void> => {
    try {
        const spinner = ora("Searching package.json files...").start()

        const packageFiles = getPackageFiles()
        spinner.text = `${packageFiles.length} package.json files found`

        const maxVersion = await removeDupes(packageFiles, packageName)

        spinner.text = `Adding ${packageName}@${maxVersion} to package.json and running npm install...`
        await addToRootAndInstall(packageName, maxVersion)

        spinner.succeed(`Dependency "${packageName}" updated and installed.`)
    } catch (error) {
        console.error(error)
    }
}

const main = async (): Promise<void> => {
    program
        .version(packageJSON.version)
        .arguments("<packageName>")
        .action(dedupe)
    program.parse(process.argv)
}
void main()
