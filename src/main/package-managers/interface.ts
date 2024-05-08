interface PackageManagerHelperInterface {
    addDependency(isDevDependency: boolean, packageName: string, maxVersion: string): void
    install(): void
}

export { PackageManagerHelperInterface }