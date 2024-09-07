import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import { sync } from "cross-spawn";
import fse from "fs-extra";
import color from "chalk";

import type { ActionType, NodePlopAPI } from "node-plop";

export function validateProjectName(input: string): string | boolean {
	const lowerCaseWithDashes = /^[\da-z-]+$/;

	if (!lowerCaseWithDashes.test(input)) {
		return "Project name must be lowercase and contain only letters, numbers, and dashes";
	}

	return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runCommand(plop: NodePlopAPI, answers: any, config: any) {
	if (
		!config?.data ||
		!("command" in config.data) ||
		(typeof config.data.command !== "string" &&
			typeof config.data.command !== "function")
	) {
		throw new Error("No command provided");
	}
	let executableCommand: string | null;
	if (typeof config.data.command === "function") {
		executableCommand = config.data.command(answers);
	} else {
		executableCommand = config.data.command;
	}

	if (!executableCommand) {
		throw new Error("No command provided");
	}

	const command = plop.renderString(executableCommand, answers);
	const cwd = answers.name
		? path.resolve(
				process.cwd(),
				plop.renderString("{{ dashCase name }}", answers)
			)
		: process.cwd();
	const result = sync(command, { cwd, stdio: "inherit" });

	if (result.error) {
		throw result.error;
	}

	return command;
}

// Some tomfoolery to get the template location
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TemplateLocation = path.join(__dirname, "..");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function copyTemplate(plop: NodePlopAPI, answers: any, config: any) {
	if (
		!config?.data ||
		!("template" in config.data) ||
		!("destination" in config.data) ||
		typeof config.data.template !== "string" ||
		typeof config.data.destination !== "string"
	) {
		throw new Error("No template or destination provided!");
	}

	const templateDir = path.join(
		TemplateLocation,
		plop.renderString(`template-${config.data.template}`, answers)
	);

	if (!fs.existsSync(templateDir)) {
		throw new Error(`Template '${templateDir}' does not exist!`);
	}

	const destinationDir = path.resolve(
		process.cwd(),
		plop.renderString(config.data.destination, answers)
	);

	if (fs.existsSync(destinationDir)) {
		throw new Error(`Destination '${destinationDir}' already exists!`);
	}

	fse.ensureDirSync(destinationDir);

	// Process each file/directory recursively
	const processDirectory = (source: string, destination: string) => {
		const items = fs.readdirSync(source, { withFileTypes: true });
		items.forEach((item) => {
			const sourcePath = path.join(source, item.name);
			const destPath = path.join(
				destination,
				item.isDirectory() ? item.name : item.name.replace(/\.hbs$/, "")
			);

			if (item.isDirectory()) {
				fse.ensureDirSync(destPath);
				processDirectory(sourcePath, destPath);
			} else {
				if (item.name.endsWith(".hbs")) {
					const templateContent = fs.readFileSync(sourcePath, "utf-8");
					const renderedContent = plop.renderString(templateContent, answers);
					fs.writeFileSync(destPath, renderedContent);
					console.log(
						color.grey(`📄 rendered and copied ${item.name} to ${destPath}`)
					);
				} else {
					fse.copySync(sourcePath, destPath);
					console.log(color.grey(`📄 copied ${item.name} to ${destPath}`));
				}
			}
		});
	};

	processDirectory(templateDir, destinationDir);

	return `Template '${config.data.template}' copied to '${destinationDir}'!`;
}

export function isShellPlatform(): boolean {
	const platform = process.platform;
	// `darwin` is the platform identifier for macOS, `linux` for Linux
	return platform === "linux" || platform === "darwin";
}

export function conditionalCommand(
	condition: boolean,
	command: string,
	alternate: string
): ActionType {
	return {
		data: {
			command: condition ? command : alternate
		},
		type: "run"
	};
}

export function conditionalTryCommand(
	condition: boolean,
	command: string,
	error?: string
): Array<ActionType> {
	if (!condition) return [];

	return [
		{
			data: {
				command,
				error
			},
			type: "tryRun"
		}
	];
}

export function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
