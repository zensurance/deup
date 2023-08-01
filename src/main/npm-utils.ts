import axios, { AxiosResponse } from "axios"

const getNpmPackageInfo = async (packageName: string): Promise<AxiosResponse> => {
    try {
        const response = await axios.get(`https://registry.npmjs.org/${packageName}`)
        return response
    } catch (error) {
        console.error(`Error fetching latest version for ${packageName}: ${error.message}`)
        return null
    }
}

const getLatestVersion = async (packageName: string): Promise<string | null> => {
    const response = await getNpmPackageInfo(packageName)
    return response?.data?.["dist-tags"]?.latest || null
}

export { getLatestVersion }
