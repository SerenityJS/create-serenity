// These are dependencies we install based on the version of SerenityJS the user wants to use.
export const VersionDependentDependencies = [
  "@serenityjs/core",
  "@serenityjs/logger",
  "@serenityjs/nbt",
  "@serenityjs/plugins",
  "@serenityjs/raknet",
  "@serenityjs/protocol",
  "@serenityjs/binarystream"
];

// These are deps we install latest of always.
export const NonVersionDependentDependencies = ["@serenityjs/binarystream"];
