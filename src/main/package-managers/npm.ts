import shell from "shelljs"

import { PackageManagerHelperInterface } from "./interface"

class NpmHelper implements PackageManagerHelperInterface {
    addDependency(isDevDependency: boolean, packageName: string, maxVersion: string) {
        const saveDev: string = isDevDependency ? `--save-dev` : ""
        shell.exec(`npm install ${packageName}@${maxVersion} --save-exact ${saveDev} > /dev/null 2>&1`)
    }

    install() {
        shell.exec("npm install")
    }
}

export default new NpmHelper()
