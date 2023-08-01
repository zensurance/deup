import ora from "ora";

const spinner = ora().start();

const logger = {
    log: (message: string) => {
        spinner.text = message
        spinner.render()
    },
    fail: (message: string) => {
        spinner.fail(message)
    },
    info: (message: string) => {
        spinner.info(message)
    },
    succeed: (message: string) => {
        spinner.succeed(message)
    },
    warn: (message: string) => {
        spinner.warn(message)
    },
}

export { logger }
