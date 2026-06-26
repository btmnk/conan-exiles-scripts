import { defineConfig } from "@bunli/core";

export default defineConfig({
  name: "conan",
  version: "1.0.0",
  description: "Conan Exiles dedicated server management CLI",
  build: {
    targets: ["linux-x64"],
  },
});
