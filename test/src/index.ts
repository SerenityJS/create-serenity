import { Serenity } from "@serenityjs/serenity";

// Create a new Serenity instance
const serenity = new Serenity();

// Start the server
serenity.start().catch(console.error);
