#!/usr/bin/env node
/* eslint-disable sort-keys/sort-keys-fix */

import { Command } from "commander";
import color from "chalk";
import nodePlop from "node-plop";
import boxen from "boxen";

import {
	conditionalTryCommand,
	copyTemplate,
	getErrorMessage,
	isShellPlatform,
	runCommand,
	validateProjectName
} from "./utils";
import {
	NonVersionDependentDependencies,
	VersionDependentDependencies
} from "./deps";

// Initialize the commander program
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
					padding: 1,
					borderColor: "gray",
					borderStyle: "round"
				}
			)
		);

		const plop = await nodePlop();

		// Create an execution plop action.
		plop.setActionType("run", (answers, config) => {
			try {
				return runCommand(plop, answers, config);
			} catch (reason) {
				console.log(color.red(getErrorMessage(reason)));
				throw reason;
			}
		});

		plop.setActionType("tryRun", (answers, config) => {
			try {
				const command = runCommand(plop, answers, config);
				console.log(color.grey(`🚀 ${command}`));
				return command;
			} catch (reason) {
				return color.hex("#fca103")(
					// @ts-expect-error
					`⚠️ ${String(config.data?.error || getErrorMessage(reason))}`
				);
			}
		});

		plop.setActionType("copyTemplate", (answers, config) => {
			try {
				return copyTemplate(plop, answers, config);
			} catch (reason) {
				console.log(color.red(getErrorMessage(reason)));
				throw reason;
			}
		});

		const generator = plop.setGenerator("create-serenity", {
			description: "Create a new SerenityJS Minecraft Bedrock server.",
			prompts: [
				{
					type: "input",
					name: "name",
					message: "What would you like to name your project?",
					validate: validateProjectName
				},
				{
					type: "list",
					name: "version",
					message: "What branch of SerenityJS would you like to use?",
					choices: [
						{ name: color.hex("#a24de8")("Latest"), value: "latest" },
						{ name: color.hex("#e8954d")("Beta 🚧"), value: "beta" }
					]
				},
				{
					type: "list",
					name: "type",
					message: "What project format would you like to scaffold?",
					choices: [
						{ name: color.hex("#e8d44d")("Javascript"), value: "javascript" },
						{ name: color.hex("#2f74c0")("Typescript"), value: "typescript" },
						{
							name: `${color.hex("#2f74c0")("Typescript")} ${color.gray("+")} ${color.hex("#7c7cea")("ESLint")}`,
							value: "typescript-eslint"
						}
					]
				},
				{
					type: "list",
					name: "packageManager",
					message: "Which package manager would you like to use?",
					choices: [
						{ name: color.hex("#dc2d35")("npm"), value: "npm" },
						{ name: color.hex("#2b8ab5")("yarn"), value: "yarn" },
						{ name: color.hex("#f2a701")("pnpm"), value: "pnpm" }
					]
				}
			],
			actions: [
				{
					type: "copyTemplate",
					data: {
						template: "{{ type }}",
						destination: "{{ dashCase name }}"
					}
				},
				{
					type: "run",
					data: {
						command: `{{packageManager}} add ${VersionDependentDependencies.map((pkg) => `${pkg}@{{version}}`).join(" ")} ${NonVersionDependentDependencies.map((pkg) => `${pkg}@latest`).join(" ")}`
					}
				},
				// If its a shell platform we will chmod the start.sh file so it can be executed
				...conditionalTryCommand(
					isShellPlatform(),
					"chmod +x ./start.sh",
					"Failed to chmod start.sh. You will need to run `chmod +x ./start.sh` manually so the file is executable."
				),
				{
					type: "run",
					data: {
						command: "git init ."
					}
				},
				{
					type: "run",
					data: {
						command: "git add ."
					}
				},
				{
					type: "run",
					data: {
						command: 'git commit -m "Initial commit 💜"'
					}
				}
			]
		});
		const answers = await generator.runPrompts();
		const results = await generator.runActions(answers);

		if (results.failures.length > 0) {
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
				`🎉 Successfully created ${color.hex("#9469ff")(answers.name)}! Happy coding 💜`,
				{
					padding: 1,
					borderColor: "gray",
					borderStyle: "round"
				}
			)
		);
		console.log("");
	});

program.parse(process.argv);
