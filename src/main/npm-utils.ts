import axios, { AxiosResponse } from "axios"

const getNpmPackageInfo = async (packageName: string, version?: string): Promise<AxiosResponse> => {
    try {
        const url = `https://registry.npmjs.org/${packageName}${version ? `/${version}` : ""}`
        const response = await axios.get(url)
        return response
    } catch (error) {
        return null
    }
}

const getLatestVersion = async (packageName: string): Promise<string | null> => {
    const response = await getNpmPackageInfo(packageName)
    return response?.data?.["dist-tags"]?.latest || null
}

const isVersionValid = async (packageName: string, version: string): Promise<boolean> => {
    const response = await getNpmPackageInfo(packageName, version)
    return !!response
}

export { getLatestVersion, isVersionValid }
