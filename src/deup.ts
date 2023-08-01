#!/usr/bin/env node --no-warnings

import { program } from "commander"

import packageJSON from "../package.json" assert { type: "json" }
import { main } from "./main/index.js"

const deup = async (): Promise<void> => {
    program
        .version(packageJSON.version)
        .arguments("<packageName>")
        .option("-d, --dry-run", "Dry run")
        .option("-l, --latest", "Update to the latest version")
        .action(main)
    program.parse(process.argv)
}
void deup()
