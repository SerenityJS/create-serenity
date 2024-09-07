// These are dependencies we install based on the version of SerenityJS the user wants to use.
export const VersionDependentDependencies = [
	"@serenityjs/block",
	"@serenityjs/command",
	"@serenityjs/data",
	"@serenityjs/emitter",
	"@serenityjs/entity",
	"@serenityjs/item",
	"@serenityjs/logger",
	"@serenityjs/nbt",
	"@serenityjs/network",
	"@serenityjs/plugins",
	"@serenityjs/protocol",
	"@serenityjs/raknet",
	"@serenityjs/serenity",
	"@serenityjs/server-ui",
	"@serenityjs/world"
];

// These are deps we install latest of always.
export const NonVersionDependentDependencies = ["@serenityjs/binarystream"];
