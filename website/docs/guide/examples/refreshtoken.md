# Refresh Token Client

::: code-group

```typescript [deno]
import { type AuthOptions, Client } from "@8h9x/tilted";

const auth: AuthOptions = {};

try {
  auth.launcherRefreshToken = await Deno.readTextFile("./refresh_token.txt");
} catch (e) {
  auth.authorizationCode = async () =>
    Client.consoleQuestion("Please enter an authorization code: ");
}

const client = new Client({ auth });

client.on("refreshtoken:created", async ({ token }) => {
  await Deno.writeTextFile("./refresh_token.txt", token);
});

await client.login();
console.log(`Logged in as ${client.user.self.displayName}`);
```

```javascript [node]
import { readFile, writeFile } from "node:fs/promises";
import { Client } from "@8h9x/tilted";

const auth = {};

try {
  auth.launcherRefreshToken = await readFile("./refresh_token.txt", "utf8");
} catch (e) {
  auth.authorizationCode = async () =>
    Client.consoleQuestion("Please enter an authorization code: ");
}

const client = new Client({ auth });

client.on("refreshtoken:created", async ({ token }) => {
  await writeFile("./refresh_token.txt", token);
});

await client.login();
console.log(`Logged in as ${client.user.self.displayName}`);
```

```typescript [bun]
import { type AuthOptions, Client } from "@8h9x/tilted";

const auth: AuthOptions = {};

try {
  const file = Bun.file("./refresh_token.txt");
  auth.launcherRefreshToken = await file.text();
} catch (e) {
  auth.authorizationCode = async () =>
    Client.consoleQuestion("Please enter an authorization code: ");
}

const client = new Client({ auth });

client.on("refreshtoken:created", async ({ token }) => {
  await Bun.write("./refresh_token.txt", token);
});

await client.login();
console.log(`Logged in as ${client.user.self.displayName}`);
```

:::
