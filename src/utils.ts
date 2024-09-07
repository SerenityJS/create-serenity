import path from "path";

import { sync } from "cross-spawn";

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
