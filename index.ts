import Cloudflare from 'cloudflare';
import * as fs from "fs";
import * as ts from "typescript";

if (!process.env.cloudflare_id) throw new Error("Cloudflare ID not set");
if (!process.env.cloudflare_key) throw new Error("Cloudflare API key not set");
if (!process.env.cloudflare_email) throw new Error("Cloudflare email not set");

const cloudflare = new Cloudflare({
     apiEmail: process.env['cloudflare_email'],
     apiKey: process.env['cloudflare_key'],
});

// Read the TypeScript file
const path = "./example/script.result.ts";

// Get the source code.
let sourceCode = fs.readFileSync(path, "utf-8");

// Create a TypeScript source file
const sourceFile = ts.createSourceFile(
     path,
     sourceCode,
     ts.ScriptTarget.Latest,
     true
);

// Function to generate JSDoc comments using OpenAI
const comment = async (code: string) => {
     const prompt = `Generate a JSDoc comment for the following TypeScript function:\n\n${code}\n\nJSDoc:`;

     const request = await cloudflare.workers.ai.run("@hf/nousresearch/hermes-2-pro-mistral-7b", {
          prompt,
          max_tokens: 1024,
          account_id: process.env["cloudflare_id"]!,
     });

     const content = "response" in request ? request.response : void 0;

     if (!content) {

          return null;
     }

     // Extract the JSDoc comment from the response
     const match = content.match(/\/\*\*[\s\S]*?\*\//);
     return match ? match[0] : null;
};

const tree = (node: ts.FunctionDeclaration): string => {

     const path: string[] = [];
     let current: ts.NamedDeclaration | undefined = node;

     if (!current.name) return '';

     // Traverse the parent nodes until the root is reached
     while (current && current.name && ts.isIdentifier(current.name)) {
          path.unshift(current.name.text);
          current = current.parent as ts.NamedDeclaration;
     }

     return path.join('.');
};


// Extract all function nodes from the TypeScript file
const functions: Map<string, ts.FunctionDeclaration> = new Map();

const generated: Map<string, string> = new Map();

const visitNode = (node: ts.Node) => {

     if (ts.isFunctionDeclaration(node)) {

          const path = tree(node);

          if (functions.has(path)) return;

          functions.set(path, node);
     }

     ts.forEachChild(node, visitNode);
};

visitNode(sourceFile);

// Process each function and generate JSDoc comments
const processNodes = async () => {

     for (const [path, node] of functions) {

          const functionCode = sourceCode.substring(node.pos, node.end);
          // const documentation = await comment(functionCode);
          const documentation = `
          /**
           * Test comment ${path}
           */
          `

          if (!documentation) {

               console.error("Failed to generate JSDoc comment for function:", node.name?.getText());
               continue;

          }

          generated.set(path, documentation);
     }
};

const write = async () => {

     for (const [nodePath, documentation] of generated.entries()) {

          const functions: Map<string, ts.FunctionDeclaration> = new Map();

          // Create a TypeScript source file
          const sourceFile = ts.createSourceFile(
               nodePath,
               sourceCode,
               ts.ScriptTarget.Latest,
               true
          );

          const process = (node: ts.Node) => {

               if (ts.isFunctionDeclaration(node)) {

                    const path = tree(node);

                    if (functions.has(path)) return;

                    functions.set(path, node);
               }

               ts.forEachChild(node, process);
          };

          process(sourceFile);

          const node = functions.get(nodePath);

          if (!node) {

               console.error("Failed to find function:", nodePath);
               continue;
          }

          sourceCode = sourceCode.substring(0, node.pos) +
               documentation +
               "\n" +
               sourceCode.substring(node.end);

          fs.writeFileSync(path, sourceCode, "utf-8");


     }
};


// Run the script
processNodes().then(() => {
     console.log("JSDoc comments added successfully.");
     write().then(() => {
          console.log("JSDoc comments added successfully.");
     });
});
