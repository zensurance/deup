import { existsSync } from "node:fs"
import { PackageManagerHelperInterface } from "./interface"

enum PackageManager {
    NPM = "npm",
    PNPM = "pnpm",
    YARN = "yarn"
}

const identifyPackageManager = (): PackageManager => {
    // It will use NPM unless it find the lock file for PNPM or YARN
    let packageManager = PackageManager.NPM
    if (existsSync("pnpm-lock.yaml")) {
        packageManager = PackageManager.PNPM
    } else if (existsSync("yarn.lock")) {
        packageManager = PackageManager.YARN
    }
    return packageManager
}

const loadPackageManagerHelper = (packageManager: PackageManager): Promise<PackageManagerHelperInterface> =>
    import(`./${packageManager}.js`).then((module) => module.default)


const getPackageManagerHelper = async () => await loadPackageManagerHelper(identifyPackageManager())

export { getPackageManagerHelper }
