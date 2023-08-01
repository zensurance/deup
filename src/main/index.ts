import { OptionValues } from "commander"
import chalk from "chalk"
import ora from "ora"

import { getLatestVersion } from "./npm-utils.js"
import { findDupes, getPackagePaths } from "./find-dupes.js"
import { addToRootAndInstall, removeDupes } from "./dedupe.js"
import { FoundVersion } from "./types.js"

const report = (foundVersions: FoundVersion[], packageName: string, spinner) => {
    const numberOfVersions = foundVersions.length
    const numberOfPackageFiles = foundVersions.reduce((acc, curr) => acc + curr.packages.length, 0)

    spinner.info("")
    spinner.warn(`Found ${chalk.red(numberOfVersions + " versions")} of ${chalk.blue(packageName)} in ${chalk.red(numberOfPackageFiles + " package.json")} files:`)
    spinner.info("")

    foundVersions.forEach(({ packages, version }) => {
        spinner.info(`${chalk.yellow(version)} in:`)
        packages.forEach(({ path, dependencyAttribute }) => {
            spinner.info(`  - ${path} (${chalk.blue(dependencyAttribute)})`)
        })
    })
}

const getUpgradeToVersion = async (foundVersions: FoundVersion[], packageName: string, options: OptionValues, spinner) => {
    const maxVersion = foundVersions[foundVersions.length - 1]?.version

    const latestVersion = await getLatestVersion(packageName)
    spinner.info("")
    spinner.info(`Latest version in NPM is: ${chalk.green(latestVersion)}${!options.latest ? ` (use ${chalk.gray("--latest")} to update to this version)` : ""}`)
    spinner.info("")

    return options.latest ? latestVersion : maxVersion
}

const main = async (packageName: string, options: OptionValues): Promise<void> => {
    try {
        const spinner = ora("Searching package.json files...").start()

        const packagePaths = getPackagePaths()
        spinner.info(`${packagePaths.length} package.json files found`)

        spinner.text = `Searching for ${packageName}...`
        const foundVersions = await findDupes(packagePaths, packageName)

        if (!foundVersions.length) {
            spinner.fail(`No dependency "${packageName}" found.`)
        } else {

            report(foundVersions, packageName, spinner)

            const upgradeToVersion = await getUpgradeToVersion(foundVersions, packageName, options, spinner)

            let successMessage = `Dependency ${chalk.blue(packageName)}`
            if (options.dryRun) {
                successMessage += " would be"
            } else {

                spinner.text = `Removing dupes...`
                removeDupes(foundVersions, packageName)

                spinner.text = `Adding ${packageName}@${upgradeToVersion} to package.json and running npm install...`
                await addToRootAndInstall(packageName, upgradeToVersion)
                successMessage += " was"
            }
            spinner.succeed(`${successMessage} updated to version ${chalk.green(upgradeToVersion)}.`)
        }
    } catch (error) {
        console.error(error)
    }
}

export { main }
