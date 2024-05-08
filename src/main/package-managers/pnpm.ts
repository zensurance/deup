import shell from "shelljs"

import { PackageManagerHelperInterface } from "./interface"

class PnpmHelper implements PackageManagerHelperInterface {
    addDependency(isDevDependency: boolean, packageName: string, maxVersion: string) {
        const saveDev = isDevDependency ? `--save-dev` : ""
        shell.exec(`pnpm add ${packageName}@${maxVersion} --workspace-root --save-exact ${saveDev} > /dev/null 2>&1`)
    }

    install() {
        shell.exec("pnpm install")
    }
}

export default new PnpmHelper()
