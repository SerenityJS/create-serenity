// Cobbled together, I hate console related stuff.

import * as readline from "readline";

import chalk from "chalk";
import stripAnsi from "strip-ansi";

export interface ConsoleOperationOptions {
	window?: number;
	message?: string;
	loadingStates?: Array<string>;
	successState?: string;
	errorState?: string;
}

const DefaultConsoleOperationOptions: Required<ConsoleOperationOptions> = {
	errorState: "✗",
	loadingStates: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
	message: "doing things...",
	successState: "✔",
	window: 20
};

export interface ConsoleOperation {
	write(data: string): void;
	error(data?: unknown): void;
	success(data?: string): void;
	setMessage(message: string): void;
}

function wrapLineWithANSI(line: string, maxWidth: number): Array<string> {
	if (maxWidth <= 0) return [line];
	const segments: Array<string> = [];
	let visibleCount = 0;
	let segmentStart = 0;

	for (let i = 0; i < line.length; i++) {
		if (line[i] === "\x1b") {
			// eslint-disable-next-line no-control-regex
			const ansiMatch = line.slice(i).match(/^\x1b\[[0-9;]*m/);
			if (ansiMatch) {
				i += ansiMatch[0].length - 1;
				continue;
			}
		} else {
			visibleCount++;
			if (visibleCount > maxWidth) {
				const segment = line.slice(segmentStart, i);
				if (stripAnsi(segment).trim().length > 0) {
					segments.push(segment);
				}
				segmentStart = i;
				visibleCount = 1;
			}
		}
	}

	segments.push(line.slice(segmentStart));

	return segments;
}

export function createConsoleOperation(
	_options: ConsoleOperationOptions = {}
): ConsoleOperation {
	const options = { ...DefaultConsoleOperationOptions, ..._options };
	const outputLines: Array<string> = [];
	let currentLoaderFrame = 0;
	let linesPrinted = 0;
	let status: "success" | "error" | undefined;
	let closed = false;
	const indent = "  ";

	function singleLineMessage(): string {
		return options.message.replace(/\r?\n/g, " ");
	}

	function terminalWidth(): number {
		return Math.max(process.stdout.columns || 80, 20);
	}

	function hasColors(line: string): boolean {
		return stripAnsi(line) !== line;
	}

	function printWrappedLine(line: string, applyIndent = true): number {
		const width = terminalWidth();
		const availableWidth = width - indent.length;
		const segments = wrapLineWithANSI(line, availableWidth);
		for (const seg of segments) {
			process.stdout.write((applyIndent ? indent : "") + seg + "\n");
		}
		return segments.length;
	}

	function render(rotate = true) {
		if (closed) return;

		if (linesPrinted > 0) {
			readline.moveCursor(process.stdout, 0, -linesPrinted);
		}

		readline.clearScreenDown(process.stdout);

		const loaderChar = status
			? status === "success"
				? options.successState
				: options.errorState
			: options.loadingStates[currentLoaderFrame];

		const loaderLine = status
			? status === "success"
				? chalk.green(`${loaderChar} ${singleLineMessage()}`)
				: chalk.red(`${loaderChar} ${singleLineMessage()}`)
			: `${chalk.magenta(loaderChar)} ${singleLineMessage()}`;

		const lines =
			outputLines.length > options.window
				? [
						`... ${outputLines.length - options.window} lines hidden`,
						...outputLines.slice(-options.window)
					]
				: [...outputLines.slice(-options.window)];

		let count = 0;
		count += printWrappedLine(loaderLine, false);
		for (const line of lines) {
			const content = hasColors(line) ? line : chalk.gray(line);
			count += printWrappedLine(content, true);
		}

		linesPrinted = count;

		if (!status && rotate) {
			currentLoaderFrame =
				(currentLoaderFrame + 1) % options.loadingStates.length;
		}
	}

	const loaderInterval = setInterval(() => render(), 100);

	process.stdout.on("resize", () => {
		render(false);
	});

	return {
		error(data: unknown = "") {
			if (closed) return;
			status = "error";
			clearInterval(loaderInterval);
			render();
			process.stdout.write("\n");
			if (data) console.error(chalk.red(data));
			closed = true;
		},
		setMessage(message: string) {
			options.message = message;
			render(false);
		},
		success(data: string = "") {
			if (closed) return;
			status = "success";
			clearInterval(loaderInterval);
			render();
			process.stdout.write("\n");
			if (data) console.log(chalk.green(data));
			closed = true;
		},
		write(data: string) {
			if (closed) return;
			const lines = data.split(/\r?\n/g);

			const processed: Array<string> = [];
			let emptyCount = 0;

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const noAnsiLine = stripAnsi(line).trim();

				if (noAnsiLine.length === 0) {
					emptyCount++;
				} else {
					if (emptyCount > 1) {
						for (let j = 0; j < emptyCount; j++) {
							processed.push("");
						}
					}
					emptyCount = 0;
					processed.push(line);
				}
			}

			if (emptyCount > 1) {
				for (let j = 0; j < emptyCount; j++) {
					processed.push("");
				}
			}

			outputLines.push(...processed);
			render(false);
		}
	};
}
