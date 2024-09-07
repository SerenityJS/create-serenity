export function validateProjectName(input: string): string | boolean {
	const lowerCaseWithDashes = /^[\da-z-]+$/;

	if (!lowerCaseWithDashes.test(input)) {
		return "Project name must be lowercase and contain only letters, numbers, and dashes";
	}

	return true;
}
