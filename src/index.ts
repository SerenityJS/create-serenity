#!/usr/bin/env node
/* eslint-disable sort-keys/sort-keys-fix */

import fs from "fs";
import path from "path";

import { Command } from "commander";
import color from "chalk";
import boxen from "boxen";

import { plop } from "./plop";
import { isShellPlatform, validateProjectName } from "./utils";
import {
	NonVersionDependentDependencies,
	VersionDependentDependencies
} from "./deps";

const program = new Command();

program
	.name("create-serenity")
	.description("Create a new SerenityJS Minecraft Bedrock server.")
	.version("1.0.0")
	.action(async () => {
		console.log(
			boxen(
				`Build your perfect Minecraft Bedrock server with ${color.hex("#9469ff")("SerenityJS!")}`,
				{
					borderColor: "gray",
					borderStyle: "round",
					padding: 1
				}
			)
		);

		const result = await plop({
			questions: [
				{
					type: "input",
					name: "name",
					message: "What would you like to name your project?",
					validate: validateProjectName
				},
				{
					type: "select",
					name: "version",
					message: "What branch of SerenityJS would you like to use?",
					choices: [
						{ name: color.hex("#a24de8")("Latest"), value: "latest" },
						{ name: color.hex("#e8954d")("Beta 🚧"), value: "beta" }
					]
				},
				{
					type: "select",
					name: "type",
					message: "What project format would you like to scaffold?",
					choices: [
						{ name: color.hex("#e8d44d")("JavaScript"), value: "javascript" },
						{ name: color.hex("#2f74c0")("TypeScript"), value: "typescript" },
						{
							name: `${color.hex("#2f74c0")("TypeScript")} ${color.gray("+")} ${color.hex("#7c7cea")("ESLint")}`,
							value: "typescript-eslint"
						}
					]
				},
				{
					type: "select",
					name: "packageManager",
					message: "Which package manager would you like to use?",
					choices: [
						{ name: color.hex("#dc2d35")("npm"), value: "npm" },
						{ name: color.hex("#2b8ab5")("yarn"), value: "yarn" },
						{ name: color.hex("#f2a701")("pnpm"), value: "pnpm" }
					]
				},
				{
					type: "confirm",
					name: "overwrite",
					message:
						"A directory named '{{name}}' already exists! Would you like to overwrite?",
					default: false,
					when: (answers) => {
						const destinationDir = path.resolve(
							process.cwd(),
							String(answers.name)
						);
						return fs.existsSync(destinationDir);
					}
				}
			],
			actions: [
				{
					type: "copy",
					source: "template-{{type}}",
					destination: "{{name}}"
				},
				{
					type: "run",
					name: "Installing Dependencies",
					command: `{{packageManager}} add ${VersionDependentDependencies.map((pkg) => `${pkg}@{{version}}`).join(" ")} ${NonVersionDependentDependencies.map((pkg) => `${pkg}@latest`).join(" ")}`,
					cwd: "{{name}}"
				},
				{
					type: "run",
					command: "chmod +x ./start.sh",
					cwd: "{{name}}",
					when: () => isShellPlatform(),
					try: true
				},
				{
					type: "run",
					command: "git init .",
					cwd: "{{name}}",
					try: true
				},
				{
					type: "run",
					command: "git add .",
					cwd: "{{name}}",
					try: true
				},
				{
					type: "run",
					command: 'git commit -m "Initial commit 💜"',
					cwd: "{{name}}",
					try: true
				}
			]
		});

		if (result.failedQuestions.length > 0 || result.failedActions.length > 0) {
			console.log("");
			console.log(
				color.red.bold("🚨 Failed to create project. See error above!")
			);
			console.log("");
			return;
		}

		console.log("");
		console.log(
			boxen(
				`🎉 Successfully created ${color.hex("#9469ff")(result.answers.name)}! Happy coding 💜`,
				{
					padding: 1,
					borderColor: "gray",
					borderStyle: "round"
				}
			)
		);
		console.log("");
		console.log(color.hex("#9469ff")("🚀 Quick Start"));
		console.log("");
		console.log(color.grey(`cd ${result.answers.name}`));
		console.log(color.grey(`${result.answers.packageManager} dev`));
		console.log("");
		console.log(color.hex("#9469ff")("📚 Learn More"));
		console.log("");
		console.log(color.grey("Check out the SerenityJS documentation at:"));
		console.log(color.grey("https://www.serenityjs.net/"));
		console.log("");
		console.log(color.grey("Join the SerenityJS Discord server at:"));
		console.log(color.grey("https://discord.gg/jUcC3q59zg"));
		console.log("");
	});

program.parse(process.argv);
