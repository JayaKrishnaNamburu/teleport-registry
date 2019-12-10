import express from "express";
import bodyParser from "body-parser";
import GoogleCloud from "./cloud";
import { transpilerCode, customGenerator, minify } from "./utils";

const port = process.env.PORT || 8080;
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "2mb" }));

const cloud = new GoogleCloud();

app.get("/", (req, res) => res.send("REGISTRY API server"));

app.post("/publish", async (req, res) => {
  const { uidl } = req.body;
  try {
    const packageName = uidl.name;
    const component = await customGenerator(uidl);
    const transpiledCJS = transpilerCode(component);
    const minifiedESM = minify(component);

    await cloud.pushToRegistry(minifiedESM, transpiledCJS, packageName);
    res.status(200).json({ message: "Component saved to registry" });
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Failed in generating component" });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server running on ${port}`);
  });
}

export { app };
