#!/usr/bin/env node --no-warnings

import { program } from "commander"

import packageJSON from "../package.json" assert { type: "json" }
import { dedupe } from "./dedupe.js"

const main = async (): Promise<void> => {
    program
        .version(packageJSON.version)
        .arguments("<packageName>")
        .option("-d, --dry-run", "Dry run")
        .option("-l, --latest", "Update to the latest version")
        .action(dedupe)
    program.parse(process.argv)
}
void main()
