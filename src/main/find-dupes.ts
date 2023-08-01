import { sync } from "glob"
import fs from "fs-extra"
import * as SemverSort from "semver-sort"

import { FoundVersion } from "./types"

const getPackagePaths = (): string[] => sync("**/package.json", {
    ignore: ["**/node_modules/**/package.json", "package.json"],
})

const findDupes = async (packagePaths: string[], packageName: string): Promise<FoundVersion[]> => {
    let foundVersions = (await Promise.all(packagePaths.map(async (packageFile) => {
        const dependencyAttributes = ["dependencies", "devDependencies"]
        const packageJson = await fs.readJson(packageFile)
        for (const dependencyAttribute of dependencyAttributes) {
            if (packageJson?.[dependencyAttribute]?.[packageName]) {
                const version = packageJson[dependencyAttribute][packageName].replace(/^\^|~/, "")
                return { package: { path: packageFile, dependencyAttribute }, version }
            }
        }
    })))
        // Filter out undefined values
        .filter(Boolean)
        .reduce((acc, curr) => {
            const foundVersion = acc.find(({ version }) => version === curr.version)
            if (foundVersion) {
                foundVersion.packages.push(curr.package)
            } else {
                acc.push({
                    version: curr.version,
                    packages: [curr.package]
                })
            }
            return acc
        }, [])

    // sorted versions based on semver definition
    const sortedVersions = SemverSort.asc(foundVersions.map(({ version }) => version))

    // sort foundVersions based on sortedVersions
    foundVersions = foundVersions.sort((a, b) => {
        const aIndex = sortedVersions.indexOf(a.version)
        const bIndex = sortedVersions.indexOf(b.version)
        return aIndex - bIndex
    })

    return foundVersions
}

export { findDupes, getPackagePaths }