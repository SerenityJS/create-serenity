// I like the name plop. But this isn't using plop because use case slightly differs.
import path from "path";
import { fileURLToPath } from "url";

import { input, select, confirm } from "@inquirer/prompts";
import { spawn } from "cross-spawn";
import Handlebars from "handlebars";
import chalk from "chalk";
import fs from "fs-extra";

import { createConsoleOperation } from "./console-operation";

export type Answers = Record<string, unknown>;
export type ConditionalRun = (answers: Answers) => boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractConfig<T extends (...args: any) => any> = Omit<
	Parameters<T>[0],
	"message"
> & { message?: string; name: string; when?: ConditionalRun };

export interface PlopInput extends ExtractConfig<typeof input> {
	type: "input";
}

export interface PlopSelect extends ExtractConfig<typeof select> {
	type: "select";
}

export interface PlopConfirm extends ExtractConfig<typeof confirm> {
	type: "confirm";
}

const Prompts = {
	confirm,
	input,
	select
} as const;

export type PlopQuestion = PlopInput | PlopSelect | PlopConfirm;

export interface PlopActionAPI {
	config: PlopConfig;
	answers: Answers;
	renderString: (template: string, answers?: Answers) => string;
}

export interface PlopCopyAction {
	type: "copy";
	name?: string;
	sourceCwd?: string;
	source: string;
	destinationCwd?: string;
	destination: string;
	when?: ConditionalRun;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CurrentLocation = path.join(__dirname, "..");
export async function copy(config: PlopCopyAction, api: PlopActionAPI) {
	const sourceCwd = config.sourceCwd
		? path.resolve(config.sourceCwd)
		: CurrentLocation;
	const destinationCwd = config.destinationCwd
		? path.resolve(config.destinationCwd)
		: process.cwd();

	const sourceDir = path.resolve(sourceCwd, api.renderString(config.source));
	const destinationDir = path.resolve(
		destinationCwd,
		api.renderString(config.destination)
	);
	const operation = createConsoleOperation({
		message: `Copying files to ${path.relative(destinationCwd, destinationDir)}`
	});

	if (!(await fs.exists(sourceDir))) {
		const error = new Error(`Source directory does not exist: ${sourceDir}`);
		operation.error(error);
		throw error;
	}

	if (await fs.exists(destinationDir)) {
		if (api.answers.overwrite) {
			operation.write(
				`📂 deleting '${path.relative(destinationCwd, destinationDir)}'`
			);
			await fs.remove(destinationDir);
		} else {
			const error = new Error(
				`Destination directory already exists: ${destinationDir}`
			);
			operation.error(error);
			throw error;
		}
	}

	operation.write(`📂 creating '${path.dirname(destinationDir)}'`);
	await fs.ensureDir(destinationDir);

	const processDirectory = async (source: string, destination: string) => {
		const items = await fs.readdir(source, { withFileTypes: true });
		const promises = items.map(async (item) => {
			const sourcePath = path.join(source, item.name);
			const destPath = path.join(
				destination,
				item.isDirectory() ? item.name : item.name.replace(/\.hbs$/, "")
			);

			if (item.isDirectory()) {
				operation.write(
					`📂 creating '${path.relative(destinationCwd, destPath)}'`
				);
				await fs.ensureDir(destPath);
				await processDirectory(sourcePath, destPath);
			} else {
				if (item.name.endsWith(".hbs")) {
					const template = await fs.readFile(sourcePath, "utf8");
					const rendered = api.renderString(template);
					operation.write(
						`📄 creating '${path.relative(destinationCwd, destPath)}'`
					);
					await fs.writeFile(destPath, rendered);
				} else {
					operation.write(
						`📄 copying '${path.relative(destinationCwd, destPath)}'`
					);
					await fs.copy(sourcePath, destPath);
				}
			}
		});

		try {
			await Promise.all(promises);
			operation.success("Files copied successfully!");
		} catch (reason) {
			operation.error(reason);
			throw reason;
		}
	};

	return processDirectory(sourceDir, destinationDir);
}

export interface PlopRunAction {
	type: "run";
	name?: string;
	command: string;
	cwd?: string;
	when?: ConditionalRun;
	try?: boolean;
}

export async function run(
	config: PlopRunAction,
	api: PlopActionAPI
): Promise<number> {
	return new Promise((resolve, reject) => {
		const command = api.renderString(config.command);
		const cwd = path.resolve(
			config.cwd ? api.renderString(config.cwd) : process.cwd()
		);
		const operation = createConsoleOperation({ message: command, window: 10 });

		const [cmd, ...args] = command.split(" ");
		const child = spawn(cmd, args, { cwd, shell: true });

		child.stdout.on("data", (data) => {
			operation.write(String(data));
		});

		child.stderr.on("data", (data) => {
			const isWarning = /\b(warn|warning)\b[:]?/i.test(data);
			operation.write(String(chalk[isWarning ? "yellow" : "red"](data)));
		});

		child.on("close", (code) => {
			if (code === 0) {
				operation.success();
				resolve(0);
			} else {
				const error = new Error(`Command exited with code ${code}`);
				operation.error(error);
				if (config.try) {
					resolve(code || 1);
				} else {
					reject(error);
				}
			}
		});

		child.on("error", (err) => {
			operation.error(err);
			if (config.try) {
				resolve(1);
			} else {
				reject(err);
			}
		});
	});
}

const Actions = {
	copy,
	run
} as const;

export type PlopAction = PlopCopyAction | PlopRunAction;

export interface PlopConfig {
	answers?: Answers;
	questions?: Array<PlopQuestion>;
	actions?: Array<PlopAction>;
	throwOnQuestionError?: boolean;
	throwOnError?: boolean;
	endOnError?: boolean;
}

function defaultMessage(type: Pick<PlopQuestion, "type">["type"]) {
	switch (type) {
		case "input":
			return "Please enter a value";
		case "select":
			return "Please select a value";
		case "confirm":
			return "Please confirm";
	}
}

export class AnswerError extends Error {
	public override readonly name = "AnswerError";

	public constructor(
		public readonly question: PlopQuestion,
		error: unknown
	) {
		super(error instanceof Error ? error.message : String(error));
		if (error instanceof Error && error.stack) {
			this.stack = `${this.stack ?? ""}\nCaused by:\n${error.stack}`;
		}
	}

	public override toString(): string {
		return `Failed to answer question '${this.question.name}': ${this.message}${
			this.stack ? `\n${this.stack}` : ""
		}`;
	}
}

export class ActionError extends Error {
	public override readonly name = "ActionError";

	public constructor(
		public readonly action: PlopAction,
		error: unknown
	) {
		super(error instanceof Error ? error.message : String(error));
		if (error instanceof Error && error.stack) {
			this.stack = `${this.stack ?? ""}\nCaused by:\n${error.stack}`;
		}
	}

	public override toString(): string {
		return `Failed to run action '${this.action.name || this.action.type}': ${this.message}${
			this.stack ? `\n${this.stack}` : ""
		}`;
	}
}

export async function plop(config: PlopConfig) {
	if (config.endOnError === undefined) {
		config.endOnError = true;
	}

	const _answers: Answers = config.answers ?? {};
	const renderString = (template: string, answers: Answers = _answers) =>
		Handlebars.compile(template)(answers);

	const failedQuestions = [];
	for await (const question of config.questions ?? []) {
		if (_answers[question.name] !== undefined) {
			continue;
		}

		if (config.endOnError && failedQuestions.length > 0) {
			break;
		}

		try {
			const { message, name, type, when, ...rest } = question;

			if (when && !when(_answers)) {
				continue;
			}

			const answer = await Prompts[type]({
				message: message ? renderString(message) : defaultMessage(type),
				...rest
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any);

			// eslint-disable-next-line require-atomic-updates
			_answers[name] = answer;
		} catch (reason) {
			const error = new AnswerError(question, reason);
			failedQuestions.push(error);
			if (config.throwOnError) {
				throw error;
			}

			if (config.endOnError) {
				break;
			}
		}
	}

	const api: PlopActionAPI = {
		answers: _answers,
		config,
		renderString
	};
	const failedActions = [];
	for await (const action of config.actions ?? []) {
		if (
			config.endOnError &&
			(failedActions.length > 0 || failedQuestions.length > 0)
		) {
			break;
		}

		try {
			if (action.when && !action.when(_answers)) {
				continue;
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await Actions[action.type](action as any, api);
		} catch (reason) {
			const error = new ActionError(action, reason);
			failedActions.push(error);
			if (config.throwOnError) {
				throw error;
			}
		}
	}

	return {
		...api,
		failedActions,
		failedQuestions
	};
}
