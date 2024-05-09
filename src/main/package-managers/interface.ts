interface PackageManagerHelperInterface {
    addDependencies(isDevDependency: boolean, dependenciesToInstall: string, verbose: boolean): any
}

export { PackageManagerHelperInterface }