import { OptionValues } from "commander"
import chalk from "chalk"

import { isVersionValid, getLatestVersion } from "./npm-utils.js"
import { findDupes, getPackagePaths } from "./find-dupes.js"
import { addToRootAndInstall, removeDupes } from "./dedupe.js"
import { FoundVersion } from "./types.js"
import { logger } from "./logger.js"
import { resolve } from "path"

const report = (foundVersions: FoundVersion[], packageName: string) => {
    const numberOfVersions = foundVersions.length
    const numberOfPackageFiles = foundVersions.reduce((acc, curr) => acc + curr.packages.length, 0)

    logger.info("")
    logger.warn(`Found ${chalk.red(numberOfVersions + " versions")} of ${chalk.blue(packageName)} in ${chalk.red(numberOfPackageFiles + " package.json")} files:`)
    logger.info("")

    foundVersions.forEach(({ packages, version }) => {
        logger.info(`${chalk.yellow(version)} in:`)
        packages.forEach(({ name, path, dependencyAttribute }) => {
            logger.info(`  - ${chalk.gray(name)} / ${chalk.blue(dependencyAttribute)}`)
            logger.info(`    ${path}`)
        })
    })
}

const getUpgradeToVersion = async (foundVersions: FoundVersion[], dependency, options: OptionValues) => {
    const maxVersion = foundVersions[foundVersions.length - 1]?.version

    const latestVersion = await getLatestVersion(dependency.name)
    logger.info("")
    logger.info(`Latest version in NPM is: ${chalk.green(latestVersion)}${!options.latest ? ` (use ${chalk.gray("--latest")} to update to this version)` : ""}`)
    logger.info("")

    return dependency.version ? dependency.version : options.latest ? latestVersion : maxVersion
}

const resolveDependencyParam = (dependencyParam: string) => {
    if (dependencyParam.charAt(0) === "@") {
        const [_, name, version] = dependencyParam.split("@")
        return { name: "@" + name, version }
    } else {
        const [name, version] = dependencyParam.split("@")
        return { name, version }
    }
}

const main = async (dependencyParam: string, options: OptionValues): Promise<void> => {
    logger.log("Checking parameters...")
    try {
        const dependency = resolveDependencyParam(dependencyParam)

        if (dependency.version) {
            if (options.latest) {
                throw new Error("You can't use both --latest and a specific version at the same time.")
            }

            logger.log(`Checking if version ${chalk.yellow(dependency.version)} exists in NPM registry...`)
            const isValid = await isVersionValid(dependency.name, dependency.version)
            if (!isValid) {
                throw new Error(`Version ${dependency.version} not found for ${dependency.name} in NPM registry.`)
            } else {
                logger.info(`Version ${chalk.yellow(dependency.version)} found for ${chalk.blue(dependency.name)} in NPM registry.`)
            }
        }

        logger.log("Searching package.json files...")
        const packagePaths = getPackagePaths()
        logger.info("")
        logger.info(`${packagePaths.length} package.json files found in the project.`)

        logger.log(`Searching for ${dependency.name}...`)
        const foundVersions = await findDupes(packagePaths, dependency.name)

        if (!foundVersions.length) {
            throw new Error(`No dependency "${dependency.name}" found in child packages.`)
        } else {
            report(foundVersions, dependency.name)

            const upgradeToVersion = await getUpgradeToVersion(foundVersions, dependency, options)

            let successMessage = `Dependency ${chalk.blue(dependency.name)}`
            if (options.dryRun) {
                successMessage += " would be"
            } else {

                logger.log(`Removing dupes...`)
                removeDupes(foundVersions, dependency.name)

                logger.log(`Adding ${dependency.name}@${upgradeToVersion} to package.json and running npm install...`)
                await addToRootAndInstall(dependency.name, upgradeToVersion)
                successMessage += " was"
            }
            logger.succeed(`${successMessage} updated to version ${chalk.green(upgradeToVersion)}.`)
        }
    } catch (error) {
        logger.fail(error.message)
    }
}

export { main }
