import { OptionValues } from "commander"
import chalk from "chalk"

import { isVersionValid, getLatestVersion } from "./npm-utils.js"
import { findDupes, getPackagePaths } from "./find-dupes.js"
import { removeDupes } from "./dedupe.js"
import { FoundVersion } from "./types.js"
import { DeupLogger } from "./logger.js"
import { getPackageManagerHelper } from "./package-managers/index.js"

const report = (foundVersions: FoundVersion[], packageName: string) => {
    const numberOfVersions = foundVersions.length
    const numberOfPackageFiles = foundVersions.reduce((acc, curr) => acc + curr.packages.length, 0)

    DeupLogger.info("")
    DeupLogger.warn(`Found ${chalk.red(numberOfVersions + " versions")} of ${chalk.blue(packageName)} in ${chalk.red(numberOfPackageFiles + " package.json")} files:`)
    DeupLogger.info("")

    foundVersions.forEach(({ packages, version }) => {
        DeupLogger.info(`${chalk.yellow(version)} in:`)
        packages.forEach(({ name, path, dependencyAttribute }) => {
            DeupLogger.info(`  - ${chalk.gray(name)} / ${chalk.blue(dependencyAttribute)}`)
            DeupLogger.info(`    ${path}`)
        })
    })
}

const getUpgradeToVersion = async (foundVersions: FoundVersion[], dependency, options: OptionValues) => {
    const maxVersion = foundVersions[foundVersions.length - 1]?.version

    const latestVersion = await getLatestVersion(dependency.name)
    DeupLogger.info("")
    DeupLogger.info(`Latest version in NPM is: ${chalk.green(latestVersion)}${!options.latest ? ` (use ${chalk.gray("--latest")} to update to this version)` : ""}`)
    DeupLogger.info("")

    return dependency.version ? dependency.version : options.latest ? latestVersion : maxVersion
}

const resolveDependencyParam = (dependencyParam: string) => {
    if (dependencyParam.startsWith("@")) {
        const [_, name, version] = dependencyParam.split("@")
        return { name: "@" + name, version, isDevDependency: false }
    } else {
        const [name, version] = dependencyParam.split("@")
        return { name, version, foundVersions: [], upgradeToVersion: "", isDevDependency: false }
    }
}

/**
 * Returns "true" if all dependency attributes in all found versions are of "devDependencies" type.
 * If any are of "dependencies" type, add as "dependencies".
 * @param foundVersions Array of objects - All versions in all packages found for "dependency"
 * @returns Boolean
 */
const isDevDependency = (foundVersions: FoundVersion[]): boolean => {
    return foundVersions.every(({ packages }) => packages.every(({ dependencyAttribute }) => dependencyAttribute === "devDependencies"))
}

const main = async (dependencyParams: string[], options: OptionValues, ...others): Promise<void> => {
    DeupLogger.log("Checking parameters...")
    try {
        const dependencies = dependencyParams.map(resolveDependencyParam)

        DeupLogger.log("Searching package.json files...")
        const packagePaths = getPackagePaths()
        DeupLogger.info("")
        DeupLogger.info(`${packagePaths.length} package.json files found in the project.`)

        // Check if all dependencies having a specific version are valid
        for (const dependency of dependencies) {

            DeupLogger.info("")
            DeupLogger.info(`Deduping ${chalk.blue(dependency.name)}`)
            DeupLogger.indent()

            if (dependency.version) {
                if (options.latest) {
                    throw new Error("You can't use both --latest and a specific version at the same time.")
                }

                DeupLogger.log(`Checking if version ${chalk.yellow(dependency.version)} exists in NPM registry...`)
                const isValid = await isVersionValid(dependency.name, dependency.version)
                if (!isValid) {
                    throw new Error(`Version ${dependency.version} not found for  in NPM registry.`)
                } else {
                    DeupLogger.info(`Version ${chalk.yellow(dependency.version)} found for ${chalk.blue(dependency.name)} in NPM registry.`)
                }
            }

            DeupLogger.log(`Searching for ${dependency.name}...`)
            dependency.foundVersions = await findDupes(packagePaths, dependency.name)

            if (!dependency.foundVersions.length) {
                DeupLogger.fail(`No dependency "${dependency.name}" found in child packages.`)
                dependencies.splice(dependencies.indexOf(dependency), 1)
            } else {
                report(dependency.foundVersions, dependency.name)

                dependency.upgradeToVersion = await getUpgradeToVersion(dependency.foundVersions, dependency, options)

                dependency.isDevDependency = isDevDependency(dependency.foundVersions)
            }
            DeupLogger.unindent()
        }

        const packageManagerHelper = await getPackageManagerHelper()

        // Remove dupes and add to root package.json
        DeupLogger.log(`Removing dupes...`)
        for (const dependency of dependencies) {
            let successMessage = `Dependency ${chalk.blue(dependency.name)}`
            if (options.dryRun) {
                successMessage += " would be"
            } else {

                await removeDupes(dependency.foundVersions, dependency.name)
                successMessage += " will be"
            }
            DeupLogger.succeed(`${successMessage} deduped to version ${chalk.green(dependency.upgradeToVersion)}.`)
        }

        if (!options.dryRun) {
            DeupLogger.log(`Applying changes...`)
            const isDevDependency = dependencies.every((dependency) => dependency.isDevDependency)
            const dependenciesToInstall = dependencies.reduce((acc, curr) => `${acc} ${curr.name}@${curr.upgradeToVersion}`, "")
            const result = packageManagerHelper.addDependencies(isDevDependency, dependenciesToInstall, options.verbose)
            if (result.code !== 0) {
                throw new Error(`Failed to install dependencies: ${result.stderr}`)
            }
            DeupLogger.succeed("All changes applied.")
        }
    } catch (error) {
        DeupLogger.fail(error.message)
    }
}

export { main }
