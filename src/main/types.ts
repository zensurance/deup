type PackageInfo = {
    path: string
    dependencyAttribute: string
}

type FoundVersion = {
    packages: PackageInfo[]
    version: string
}

export type { PackageInfo, FoundVersion }