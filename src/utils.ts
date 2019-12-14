import * as Babel from "@babel/core";
import { rollup } from "rollup";
import virtual from "@rollup/plugin-virtual";
import sourcemaps from "rollup-plugin-sourcemaps";
import { uglify } from "rollup-plugin-uglify";

import babelPresetENV from "@babel/preset-env";
import babelPresetReact from "@babel/preset-react";

import { createComponentGenerator } from "@teleporthq/teleport-component-generator";
import reactComponent from "@teleporthq/teleport-plugin-react-base-component";
import inlineStylesPlugin from "@teleporthq/teleport-plugin-jsx-inline-styles";
import importStatemenetsPlugin from "@teleporthq/teleport-plugin-import-statements";

export const compile = async (esmComponent, packageName) => {
  const { transformSync } = Babel;
  // Step for transpiling react components
  const cjsBundle = transformSync(esmComponent, {
    presets: [[babelPresetENV, { modules: false }], babelPresetReact]
  });

  const iifeBundle = await bundler(cjsBundle.code, packageName);
  return [iifeBundle, cjsBundle.code];
};

export const bundler = async (code, packageName) => {
  try {
    const compiler = await rollup({
      input: "__entry__.js",
      external: ["react"],
      plugins: [
        virtual({
          "__entry__.js": code
        }),
        uglify(),
        sourcemaps()
      ]
    });

    const bundle = await compiler.generate({
      format: "iife",
      globals: { react: "React" },
      name: packageName,
      sourcemap: true
    });

    const bundledCode = bundle.output[0].code;
    return bundledCode;
  } catch (e) {
    console.log(e);
  }
};

export const customGenerator = async uidl => {
  const generator = createComponentGenerator();
  generator.addPlugin(reactComponent);
  generator.addPlugin(inlineStylesPlugin);
  generator.addPlugin(importStatemenetsPlugin);

  const { files } = await generator.generateComponent(uidl);
  return files[0].content;
};

export const lowerDashCase = str => {
  const name = str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "");
  return name[0].toUpperCase() + name.slice(1);
};
