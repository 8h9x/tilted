# Authentication

Tilted does not support email & password as an authentication method as you get
a captcha in 9 out of 10 cases.

## So whats the preferred way of authenticating?

You should use an authorization code for the first time you login and generate a
device auth.

**Example:** How does that look like code wise?

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

## How do I obtain an authorization code?

You can use
[this link](https://www.fortnite.com/id/login?redirectUrl=https%3A%2F%2Fwww.epicgames.com%2Fid%2Fapi%2Fredirect%3FclientId%3D3446cd72694c4a4485d81b77adbb2141%26responseType%3Dcode)
and copy the 32 character code! An authorization code can only be used once and
expires after 300 seconds. Thats why you should generate a device auth with it.

## How does a device auth work?

A device auth doesn't expire and it consists of a accountId, deviceId and
secret. You can create as many device auths for an account as you want.
