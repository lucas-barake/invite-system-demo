# Development Guide

## Prerequisites:

Before proceeding with the installation, please make sure you have the following software installed on your machine:

- [Node.js](https://nodejs.org/en).
- [nvm](https://github.com/nvm-sh/nvm)
- ESLint and Prettier extensions in your preferred editor.
- [pnpm](https://pnpm.io/) installed `npm i -g pnpm`

## Installation Steps

1. Set your Node.js version to the project's version

```bash
nvm use
```

Running this command will instruct [nvm](https://github.com/nvm-sh/nvm) to switch to the Node.js version specified in
the [nvmrc](./.nvmrc) file.

2. Install the dependencies:

```bash
pnpm install
```

3. Set up your environment variables

Copy the template found in the `.env.example` file over to a new `.env` file.

```bash
cp .env.example .env
```

Replace the values in the `.env` file with your own configuration.

4. Set up your database and cache instances:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

5. Run the migrations:

```bash
pnpm dlx prisma db push
```

6. Start the server:

```bash
pnpm run dev
```
