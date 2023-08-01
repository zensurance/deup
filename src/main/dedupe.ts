import fs from "fs-extra"
import shell from "shelljs"

import { FoundVersion, PackageInfo } from "./types"

const adjustLernaBootstrap = async (currentValue: string, newValue: string) => {
    const rootPackageJson = await fs.readJson("package.json")
    const scriptName = "bootstrap"
    if (rootPackageJson.scripts?.[scriptName]) {
        rootPackageJson.scripts[scriptName] = rootPackageJson.scripts[scriptName].replace(currentValue, newValue)
        await fs.writeJson("package.json", rootPackageJson, { spaces: 2 })
    }
}

const addToRootAndInstall = async (packageName: string, maxVersion: string): Promise<void> => {
    await adjustLernaBootstrap("--ci", "--no-ci")
    shell.exec(`npm install ${packageName}@${maxVersion} --save-exact`)
    shell.exec(`npm install`)
    await adjustLernaBootstrap("--no-ci", "--ci")
}

const removeDupes = async (foundVersions: FoundVersion[], packageName) => {
    // Remove all dupes
    foundVersions.forEach(({ packages }) => {
        packages.forEach((packageInfo) => {
            removeDupe(packageInfo, packageName)
        })
    })
}

const removeDupe = async (packageInfo: PackageInfo, packageName: string) => {
    const packageJson = await fs.readJson(packageInfo.path)
    if (packageJson?.[packageInfo.dependencyAttribute]?.[packageName]) {
        // Remove the dependency
        delete packageJson[packageInfo.dependencyAttribute][packageName]

        // Remove the dependency attribute if it"s empty
        if (!Object.values(packageJson[packageInfo.dependencyAttribute]).length) {
            delete packageJson[packageInfo.dependencyAttribute]
        }

        await fs.writeJson(packageInfo.path, packageJson, { spaces: 2 })

        // Remove package-lock.json
        const packageLockPath = packageInfo.path.replace("package.json", "package-lock.json")
        try {
            fs.unlink(packageLockPath)
        } catch (err) {
            // nothing to do here
        }

        // Remove node_modules folders
        const nodeModulesPath = packageInfo.path.replace("package.json", "node_modules")
        fs.rmSync(nodeModulesPath, { recursive: true, force: true })
    }
}

export { removeDupes, addToRootAndInstall }