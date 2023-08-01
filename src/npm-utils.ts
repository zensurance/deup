import axios, { AxiosResponse } from "axios"

const getPackageInfo = async (packageName: string): Promise<AxiosResponse> => {
    try {
        const response = await axios.get(`https://registry.npmjs.org/${packageName}`)
        return response
    } catch (error) {
        console.error(`Error fetching latest version for ${packageName}: ${error.message}`)
        return null
    }
}

const getLatestVersion = async (packageName: string): Promise<string | null> => {
    const response = await getPackageInfo(packageName)
    return response?.data?.["dist-tags"]?.latest || null
}

export { getLatestVersion }
