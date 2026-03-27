# Device Auth Client

::: code-group

```typescript [deno]
import { type AuthOptions, Client } from "@8h9x/tilted";

const auth: AuthOptions = {};

try {
  const contents = await Deno.readTextFile("./device_auth.json");
  auth.deviceAuth = JSON.parse(contents);
} catch (e) {
  auth.authorizationCode = async () =>
    Client.consoleQuestion("Please enter an authorization code: ");
}

const client = new Client({ auth });

client.addEventListener("deviceauth:created", async (event) => {
  await Deno.writeTextFile(
    "./device_auth.json",
    JSON.stringify(event.detail, null, 2),
  );
});

await client.login();
console.log(`Logged in as ${client.user.self.displayName}`);
```

```javascript [node]
import { readFile, writeFile } from "node:fs/promises";
import { Client } from "@8h9x/tilted";

const auth = {};

try {
  const contents = await readFile("./device_auth.json", "utf8");
  auth.deviceAuth = JSON.parse(contents);
} catch (e) {
  auth.authorizationCode = async () =>
    Client.consoleQuestion("Please enter an authorization code: ");
}

const client = new Client({ auth });

client.addEventListener("deviceauth:created", async (event) => {
  await writeFile("./device_auth.json", JSON.stringify(event.detail, null, 2));
});

await client.login();
console.log(`Logged in as ${client.user.self.displayName}`);
```

```typescript [bun]
import { type AuthOptions, Client } from "@8h9x/tilted";

const auth: AuthOptions = {};

try {
  const file = Bun.file("./device_auth.json");
  auth.deviceAuth = await file.json();
} catch (e) {
  auth.authorizationCode = async () =>
    Client.consoleQuestion("Please enter an authorization code: ");
}

const client = new Client({ auth });

client.addEventListener("deviceauth:created", async (event) => {
  await Bun.write("./device_auth.json", JSON.stringify(event.detail, null, 2));
});

await client.login();
console.log(`Logged in as ${client.user.self.displayName}`);
```

:::
