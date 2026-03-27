<div align="center">
  <br />
  <p>
    <a href="https://fnbr.js.org/"><img src="https://fnbr.js.org/static/logo.png" width="546" alt="fnbr.js" id="fnbrjs-logo" style="filter: drop-shadow(0 3px 4px #333);" /></a>
  </p>
  <p>
    <a href="https://jsr.io/@8h9x/tilted"><img src="https://jsr.io/badges/@8h9x/tilted" alt="JSR Badge" /></a>
  </p>
</div>

# Tilted

A library to interact with Fortnite's HTTP and XMPP services. Forked from
fnbr.js

## Installation

::: code-group

```sh [deno]
deno add jsr:@8h9x/tilted
```

```sh [npm]
npx jsr add @8h9x/tilted
```

```sh [bun]
bunx jsr add @8h9x/tilted
```

:::

## Example

Example:

```javascript
import { Client } from "@8h9x/tilted";

const client = new Client();

client.addEventListener("ready", () => {
  console.log(`Logged in as ${client.user.self.displayName}`);
});

client.addEventListener("friend:message", ({ detail }) => {
  console.log(`Message from ${detail.author.displayName}: ${detail.content}`);
  if (detail.content.toLowerCase().startsWith("ping")) {
    detail.reply("Pong!");
  }
});

client.login();
```

## Help

Feel free to join [this Discord server](https://discord.gg/j5xZ54RJvR)

## License

MIT License

Copyright (c) 2020-2026 Nils S. Copyright (c) 2026 Nicholas Allen Phillips

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
