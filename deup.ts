#!/usr/bin/env node

import { program } from "commander";
import fs from "fs-extra";
import { sync } from "glob";
import ora from "ora";
import shell from "shelljs";

import packageJSON from "./package.json" assert { type: "json" };

const getPackageFiles = (): string[] => sync("**/package.json", {
    ignore: ["**/node_modules/**/package.json", "package.json"],
});

const removeDupes = async (packageFiles: string[], packageName: string): Promise<string> => {
    let maxVersion = "";
    for (const packageFile of packageFiles) {
        const packageJson = await fs.readJson(packageFile);
        if (packageJson?.dependencies?.[packageName]) {
            const currVersion = packageJson.dependencies[packageName].replace(/^\^|~/, "");
            maxVersion = currVersion > maxVersion ? currVersion : maxVersion;
            delete packageJson.dependencies[packageName];
            await fs.writeJson(packageFile, packageJson, { spaces: 2 });
        }
    }
    return maxVersion;
};

const addToRootAndInstall = async (packageName: string, maxVersion: string): Promise<void> => {
    const rootPackageJson = await fs.readJson("package.json");
    rootPackageJson.dependencies[packageName] = maxVersion;
    rootPackageJson.scripts["bootstrap"] = rootPackageJson.scripts["bootstrap"].replace("--ci", "--no-ci");
    await fs.writeJson("package.json", rootPackageJson, { spaces: 2 });

    shell.exec("npm install");

    rootPackageJson.scripts["bootstrap"] = rootPackageJson.scripts["bootstrap"].replace("--no-ci", "--ci");
    await fs.writeJson("package.json", rootPackageJson, { spaces: 2 });
};

const dedupe = async (packageName: string): Promise<void> => {
    try {
        const spinner = ora("Searching package.json files...").start();

        const packageFiles = getPackageFiles();
        spinner.text = `${packageFiles.length} package.json files found`;

        const maxVersion = await removeDupes(packageFiles, packageName);

        spinner.text = `Adding ${packageName}@${maxVersion} to package.json and running npm install...`;
        await addToRootAndInstall(packageName, maxVersion);

        spinner.succeed(`Dependency "${packageName}" updated and installed.`);
    } catch (error) {
        console.error(error);
    }
};

const main = async (): Promise<void> => {
    program
        .version(packageJSON.version)
        .arguments("<packageName>")
        .action(dedupe);
    program.parse(process.argv);
};
void main();
