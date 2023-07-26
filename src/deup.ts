#!/usr/bin/env node

import { program } from "commander"

import packageJSON from "../package.json" assert { type: "json" }
import { dedupe } from "./commands/dedupe.js"

const main = async (): Promise<void> => {
    program
        .version(packageJSON.version)
        .arguments("<packageName>")
        .option("-d, --dry-run", "Dry run")
        .action(dedupe)
    program.parse(process.argv)
}
void main()
