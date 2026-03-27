# Simple Client

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

client.addEventListener("party:member:message", ({ detail }) => {
  console.log(
    `Party Message from ${detail.author.displayName}: ${detail.content}`,
  );
});

client.login();
```
