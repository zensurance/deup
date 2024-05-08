import fs from "fs-extra"

import { FoundVersion, PackageInfo } from "./types"

const removeDupes = async (foundVersions: FoundVersion[], packageName) => {
    // Remove all dupes
    for (const foundVersion of foundVersions) {
        for (const packageInfo of foundVersion.packages) {
            await removeDupe(packageInfo, packageName)
        }
    }
}

const removeLockFile = (packagePath, lockFileName) => {
    const packageLockPath = packagePath.replace("package.json", lockFileName)
    fs.unlink(packageLockPath, (err) => {})
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

        // Remove lock files 
        const lockFiles = ["package-lock.json", "pnpm-lock.yaml"]
        lockFiles.map((lockFileName) => removeLockFile(packageInfo.path, lockFileName))

        // Remove node_modules folders
        const nodeModulesPath = packageInfo.path.replace("package.json", "node_modules")
        fs.rmSync(nodeModulesPath, { recursive: true, force: true })
    }
}

export { removeDupes }
