# DEUP

Deup is an utility package to support deduplicating dependencies in a monorepo.

## Installation

```
npm i -g deup
```

## Usage

```
deup [options] <packageName>[@<version>]
```

## Develop 

The DEUP project uses pnpm as it's own package manager and volta as the version manager. 

Volta will always install and use the same versions of NodeJS and PNPM that this project is compatible with. To install Volta please follow the steps in [this page](https://docs.volta.sh/guide/getting-started).

To develop the project locally you need to install dependencies running: `pnpm install --frozen-lockfile`

You can test the project running: `pnpm test`

## Options

| Option | Description |
| --- | --- |
| `-d, --dry-run` | Dry run |
| `-l, --latest` | Update to the latest version |
| `-h, --help` | display help for command |
| `-V, --version` | output the version number |

## Example output

![](./docs/dry-run-screenshot.png)
