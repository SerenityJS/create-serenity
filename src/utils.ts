export function validateProjectName(input: string): string | boolean {
	const lowerCaseWithDashes = /^[\da-z-]+$/;

	if (!lowerCaseWithDashes.test(input)) {
		return "Project name must be lowercase and contain only letters, numbers, and dashes";
	}

	return true;
}

export function isShellPlatform(): boolean {
	const platform = process.platform;
	// `darwin` is the platform identifier for macOS, `linux` for Linux
	return platform === "linux" || platform === "darwin";
}
