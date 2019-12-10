import * as babel from "@babel/core";
import babelPresetReact from "@babel/preset-react";
import babelMinify from "babel-preset-minify";

import { createComponentGenerator } from "@teleporthq/teleport-component-generator";
import reactComponent from "@teleporthq/teleport-plugin-react-base-component";
import inlineStylesPlugin from "@teleporthq/teleport-plugin-jsx-inline-styles";
import importStatemenetsPlugin from "@teleporthq/teleport-plugin-import-statements";

export const transpilerCode = esmComponent => {
  const { transformSync } = babel;
  const cjsComponent = transformSync(esmComponent, {
    presets: [babelPresetReact, babelMinify]
  });
  return cjsComponent.code;
};

export const minify = esmComponent => {
  const { transformSync } = babel;
  const minifiedCode = transformSync(esmComponent, {
    presets: [babelPresetReact]
  });
  return minifiedCode.code;
};

export const customGenerator = async uidl => {
  const generator = createComponentGenerator();
  generator.addPlugin(reactComponent);
  generator.addPlugin(inlineStylesPlugin);
  generator.addPlugin(importStatemenetsPlugin);

  const { files } = await generator.generateComponent(uidl);
  return files[0].content;
};
