import shell from "shelljs"

import { PackageManagerHelperInterface } from "./interface"

class YarnHelper implements PackageManagerHelperInterface {
    addDependency(isDevDependency: boolean, packageName: string, maxVersion: string) {
        const saveDev = isDevDependency ? `--dev` : ""
        shell.exec(`yarn add ${packageName}@${maxVersion} --exact ${saveDev} > /dev/null 2>&1`)
    }

    install() {
        shell.exec("yarn")
    }
}

export default new YarnHelper()
