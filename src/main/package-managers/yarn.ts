import shell from "shelljs"

import { PackageManagerHelperInterface } from "./interface"
import { DeupLogger } from "../logger.js"

class YarnHelper implements PackageManagerHelperInterface {
    addDependencies(isDevDependency: boolean, dependenciesToInstall: string, verbose: boolean) {
        const saveAs = isDevDependency ? `--dev` : ""
        const output = verbose ? "" : "> /dev/null 2>&1"
        const command = `yarn add ${dependenciesToInstall} --ignore-workspace-root-check --exact ${saveAs} ${output}`
        if (verbose) {
            DeupLogger.log(command)
        }
        return shell.exec(command)
    }
}

export default new YarnHelper()
