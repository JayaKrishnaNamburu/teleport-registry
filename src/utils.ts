import * as Babel from "@babel/core";
import { rollup } from "rollup";
import virtual from "@rollup/plugin-virtual";
import sourceMaps from "rollup-plugin-sourcemaps";
import commonJS from "rollup-plugin-commonjs";
import { uglify } from "rollup-plugin-uglify";

import babelPresetENV from "@babel/preset-env";
import babelPresetReact from "@babel/preset-react";

import { createComponentGenerator } from "@teleporthq/teleport-component-generator";
import reactComponent from "@teleporthq/teleport-plugin-react-base-component";
import inlineStylesPlugin from "@teleporthq/teleport-plugin-jsx-inline-styles";
import importStatemenetsPlugin from "@teleporthq/teleport-plugin-import-statements";

export const minify = async (esmComponent, packageName) => {
  const { transformSync } = Babel;
  // Step for transpiling react components
  const minifiedCode = transformSync(esmComponent, {
    presets: [[babelPresetENV, { modules: false }], babelPresetReact]
  });
  const bundledPackage = bundler(minifiedCode, packageName);
  return bundledPackage;
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
        commonJS({
          ignoreGlobal: true
        }),
        uglify(),
        sourceMaps()
      ]
    });

    const bundle = await compiler.generate({
      format: "iife",
      globals: { react: "React" },
      name: packageName,
      extend: true,
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

export const lowerDashCase = str =>
  (str = str.replace(/\s+/g, "-").toLowerCase());
