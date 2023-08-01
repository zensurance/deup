import { OptionValues } from "commander"
import chalk from "chalk"

import { isVersionValid, getLatestVersion } from "./npm-utils.js"
import { findDupes, getPackagePaths } from "./find-dupes.js"
import { addToRootAndInstall, removeDupes } from "./dedupe.js"
import { FoundVersion } from "./types.js"
import { logger } from "./logger.js"

const report = (foundVersions: FoundVersion[], packageName: string) => {
    const numberOfVersions = foundVersions.length
    const numberOfPackageFiles = foundVersions.reduce((acc, curr) => acc + curr.packages.length, 0)

    logger.info("")
    logger.warn(`Found ${chalk.red(numberOfVersions + " versions")} of ${chalk.blue(packageName)} in ${chalk.red(numberOfPackageFiles + " package.json")} files:`)
    logger.info("")

    foundVersions.forEach(({ packages, version }) => {
        logger.info(`${chalk.yellow(version)} in:`)
        packages.forEach(({ name, path, dependencyAttribute }) => {
            logger.info(`  - ${chalk.gray(name)} ${path} (${chalk.blue(dependencyAttribute)})`)
        })
    })
}

const getUpgradeToVersion = async (foundVersions: FoundVersion[], packageName: string, version: string, options: OptionValues) => {
    const maxVersion = foundVersions[foundVersions.length - 1]?.version

    const latestVersion = await getLatestVersion(packageName)
    logger.info("")
    logger.info(`Latest version in NPM is: ${chalk.green(latestVersion)}${!options.latest ? ` (use ${chalk.gray("--latest")} to update to this version)` : ""}`)
    logger.info("")

    return version ? version : options.latest ? latestVersion : maxVersion
}

const main = async (packageInfo: string, options: OptionValues): Promise<void> => {
    logger.log("Checking parameters...")
    try {
        const [packageName, version] = packageInfo.split("@")

        if (version) {
            if (options.latest) {
                throw new Error("You can't use both --latest and a specific version at the same time.")
            }

            logger.log(`Checking if version ${chalk.yellow(version)} exists in NPM registry...`)
            const isValid = await isVersionValid(packageName, version)
            if (!isValid) {
                throw new Error(`Version ${version} not found for ${packageName} in NPM registry.`)
            } else {
                logger.info(`Version ${chalk.yellow(version)} found for ${chalk.blue(packageName)} in NPM registry.`)
            }
        }

        logger.log("Searching package.json files...")
        const packagePaths = getPackagePaths()
        logger.info("")
        logger.info(`${packagePaths.length} package.json files found in the project.`)

        logger.log(`Searching for ${packageName}...`)
        const foundVersions = await findDupes(packagePaths, packageName)

        if (!foundVersions.length) {
            throw new Error(`No dependency "${packageName}" found in child packages.`)
        } else {
            report(foundVersions, packageName)

            const upgradeToVersion = await getUpgradeToVersion(foundVersions, packageName, version, options)

            let successMessage = `Dependency ${chalk.blue(packageName)}`
            if (options.dryRun) {
                successMessage += " would be"
            } else {

                logger.log(`Removing dupes...`)
                removeDupes(foundVersions, packageName)

                logger.log(`Adding ${packageName}@${upgradeToVersion} to package.json and running npm install...`)
                await addToRootAndInstall(packageName, upgradeToVersion)
                successMessage += " was"
            }
            logger.succeed(`${successMessage} updated to version ${chalk.green(upgradeToVersion)}.`)
        }
    } catch (error) {
        logger.fail(error.message)
    }
}

export { main }
