#!/usr/bin/env node
/* eslint-disable sort-keys/sort-keys-fix */

import { Command } from "commander";
import { sync } from "cross-spawn";
import color from "chalk";
import nodePlop from "node-plop";
import boxen from "boxen";

import { validateProjectName } from "./utils";

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
			if (
				!config?.data ||
				!("command" in config.data) ||
				typeof config.data.command !== "string"
			) {
				throw new Error("No command provided");
			}
			const command = plop.renderString(config.data.command, answers);
			const result = sync(command, { stdio: "inherit" });

			if (result.error) {
				throw result.error;
			}

			return command;
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
					type: "addMany",
					destination: "./{{ dashCase name }}",
					base: "./templates-{{ type }}",
					templateFiles: "./templates-{{ type }}/**/*",
					globOptions: {
						dot: true
					},
					skipIfExists: true
				}
			]
		});
		const answers = await generator.runPrompts();
		await generator.runActions(answers);
	});

program.parse(process.argv);
