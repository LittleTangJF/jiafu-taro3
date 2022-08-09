const co = require("co");
const xtpl = require("xtpl");
const fs = require("fs");
const thunkify = require("thunkify");
const path = require("path");
const prettier = require("prettier");
const { NodeVM } = require("vm2");
const _ = require("lodash");
const data = require("./imgData");

const vm = new NodeVM({
  console: "inherit",
  sandbox: {},
});

co(function*() {
  const xtplRender = thunkify(xtpl.render);
  const code = fs.readFileSync(
    path.resolve(__dirname, "../src/index.js"),
    "utf8"
  );
  const renderInfo = vm.run(code)(data, {
    prettier: prettier,
    _: _,
  });

  const { noTemplate, panelDisplay } = renderInfo;
  const prettierOpt = renderInfo.prettierOpt || {
    printWidth: 120,
  };

  if (!noTemplate) {
    const renderData = renderInfo.renderData;
    const ret = yield xtplRender(
      path.resolve(__dirname, "../src/template.xtpl"),
      renderData,
      {}
    );

    const prettierRes = prettier.format(ret, prettierOpt);

    fs.writeFileSync(path.join(__dirname, "./result.js"), prettierRes);
  } else {
    panelDisplay.forEach(function({ panelName, panelValue, panelType }) {
      // const prettierRes = prettier.format(panelValue, prettierOpt);
      fs.writeFileSync(
        path.join(__dirname, "../code/" + panelName),
        panelValue
      );
    });
  }
});
