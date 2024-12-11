<br/>
<p align="center">
  <a href="https://github.com/SerenityJS/serenity">
    <img src="https://raw.githubusercontent.com/SerenityJS/serenity/develop/public/serenityjs-banner.png" alt="Logo">
  </a>
  <p align="center">
    <strong><font size = "5.5">Minecraft Bedrock Edition Server Software</font></strong>
    <br/>
    <br/>
    <a href="https://serenityjs.net"><strong>Explore Documentation »</strong></a>
    <br/>
    <br/>
    <a href="https://github.com/SerenityJS/serenity/issues">Report Bug</a>
    <br/>
    <br/>
    <a href="https://discord.gg/jUcC3q59zg">
      <img alt="discord" src="https://img.shields.io/discord/854092607239356457?style=for-the-badge&color=%237289DA&label=Discord&logo=discord&logoColor=white" />
    </a>
    <a href="https://github.com/SerenityJS/serenity/blob/develop/LICENSE">
      <img alt="License" src="https://img.shields.io/github/license/SerenityJS/serenity?style=for-the-badge&label=Liscense&color=hotpink" />
    </a>
    <a href="https://www.npmjs.com/package/@serenityjs/core">
      <img alt="License" src="https://img.shields.io/npm/v/@serenityjs/core?style=for-the-badge&label=NPM&logo=npm&logoColor=white" />
    </a>
  </p>
</p>

## About The Project

Serenity is a robust and flexible Minecraft Bedrock Edition Server Software that was built from the ground up using [Rust](https://www.rust-lang.org/) and [TypeScript](https://www.typescriptlang.org/). Serenity provides a well written set of apis and tools for building Minecraft Bedrock servers, allowing developers to focus on creating unique game-play experiences, without worrying about the underlying network and protocol details. Serenity is in a active state of development, though is now approaching its first stable release. As some vanilla features are missing, we are working as hard as possible to implement these important features.


## Getting Started

### Prerequisites

Before installing Serenity you first need to make sure you have the latest recommended version of [Node.js](https://nodejs.org/en/) installed on your machine. Once installed, it is recommended to fully restart your machine to allow for the full Node.js experience to be enabled. You will also need to use an integrated development environment of personal choice. [Visual Studio Code](https://code.visualstudio.com/) is the recommended environment for Serenity development.

Serenity is built off of the foundation of [Yarn Workspaces](https://yarnpkg.com/features/workspaces) for quick and easy development. Before installing Serenity, you will first need to install [Yarn](https://yarnpkg.com/). To do this, please read through the [Installation Guide](https://yarnpkg.com/getting-started/install) provided by the developers of Yarn.

Serenity has started development on a plugin system. This system allows modification to the Serenity software while providing a full api to completely interact with the server. Check out the [sample-plugin](https://github.com/SerenityJS/sample-plugin) to get started.

### Installing Serenity

We provide an easy to use CLI installer process. Run the following command of your choice, and follow the install prompts.

```bash
#npm
npm create serenity
#yarn
yarn create serenity
#pnpm
pnpm create serenity
```
