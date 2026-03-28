import { defineConfig } from "vitepress";
import { existsSync, readdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getApiSidebar() {
  const apiDir = resolve(__dirname, "../api");
  console.log("apiDir:", apiDir);
  console.log("exists:", existsSync(apiDir));
  console.log("contents:", existsSync(apiDir) ? readdirSync(apiDir) : "N/A");
  if (!existsSync(apiDir)) return [];

  const folders = [
    "classes",
    "interfaces",
    "type-aliases",
    "functions",
    "enumerations",
  ];
  const items = [];

  for (const folder of folders) {
    const folderPath = resolve(apiDir, folder);
    if (!existsSync(folderPath)) continue;

    const files = readdirSync(folderPath)
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({
        text: f.replace(".md", ""),
        link: `/api/${folder}/${f.replace(".md", "")}`,
      }));

    if (files.length === 0) continue;

    items.push({
      text: folder.charAt(0).toUpperCase() +
        folder.slice(1).replace("-", " "),
      collapsed: false,
      items: files,
    });
  }
  console.log("sidebar items:", JSON.stringify(items, null, 2));
  return items;
}

export default defineConfig({
  title: "Tilted",
  description: "Documentation",
  base: "/",

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/introduction" },
      { text: "API", link: "/api/" },
      { text: "JSR", link: "https://jsr.io/@8h9x/tilted" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "General",
          items: [
            { text: "Introduction", link: "/guide/introduction" },
            { text: "Auth", link: "/guide/auth" },
            { text: "Changelog", link: "/guide/changelog" },
          ],
        },
        {
          text: "Examples",
          items: [
            {
              text: "Simple Client",
              link: "/guide/examples/simple",
            },
            {
              text: "Device Auth Client",
              link: "/guide/examples/deviceauth",
            },
            {
              text: "Refresh Token Client",
              link: "/guide/examples/refreshtoken",
            },
          ],
        },
      ],
      "/api/": getApiSidebar(),
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/8h9x/tilted" },
    ],

    search: {
      provider: "local",
    },

    editLink: {
      pattern: "https://github.com/8h9x/tilted/edit/main/website/docs/:path",
      text: "Suggest edits on GitHub",
    },

    outline: {
      level: [2, 3],
    },
  },

  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
  },
});
