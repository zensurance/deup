import shell from "shelljs"

import { PackageManagerHelperInterface } from "./interface"
import { DeupLogger } from "../logger.js"

class PnpmHelper implements PackageManagerHelperInterface {
    addDependencies(isDevDependency: boolean, dependenciesToInstall: string, verbose: boolean) {
        const saveAs = isDevDependency ? `--save-dev` : "--save-prod"
        const output = verbose ? "" : "> /dev/null 2>&1"
        const command = `pnpm add ${dependenciesToInstall} --ignore-workspace-root-check --save-exact ${saveAs} ${output}`
        if (verbose) {
            DeupLogger.log(command)
        }
        return shell.exec(command)
    }
}

export default new PnpmHelper()
