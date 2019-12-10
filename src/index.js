function transformPX(num) {
  return `transfromPX(${num})`;
}

function shouldTranformPX(name, value) {
  return (
    shouldTransformPXStyleProp.indexOf(name) > -1 ||
    (value + "").indexOf("px") === value.length - 2
  );
}

function getPX(value) {
  return parseFloat(value);
}

function transformPropValue(propName, propValue) {
  const isNumber = !isNaN(Number(propValue));
  const propValueJS = isNumber ? propValue : `'${propValue}'`;
  if (shouldIgnoreOnReactNativeProp.indexOf(propName) > -1) {
    return `...(process.env.TARO_ENV !== 'rn' ? {${propName}: ${propValueJS}}: null),`;
  } else if (shouldRemoveStyleProp.indexOf(propName) > -1) {
    return "";
  } else if (propName === "fontWeight") {
    const weight = parseFloat(propValue);
    if (isNaN(weight)) {
      return `fontWeight: '${propValue}',`;
    } else if (weight <= 400) {
      return ""; // normal
    } else {
      return `fontWeight: 'bold',`;
    }
  } else {
    const isPX = shouldTranformPX(propName, propValue);
    return `${propName}: ${
      isPX ? transformPX(getPX(propValue)) : propValueJS
    },`;
  }
}

const shouldIgnoreOnReactNativeProp = [
  "boxSizing",
  "whiteSpace",
  "textOverflow"
];

const shouldRemoveStyleProp = ["lines"];

const shouldTransformPXStyleProp = [
  "top",
  "left",
  "bottom",
  "right",
  "width",
  "height",
  "lineHeight",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "paddingBottom",
  "marginLeft",
  "marginRight",
  "marginTop",
  "marginBottom"
];

/**
 *
 * @param {React.CSSProperties} CSSProperties
 */
function transformCSSProperties(CSSProperties) {
  let str = "{";
  for (let key in CSSProperties) {
    str += transformPropValue(key, CSSProperties[key]);
  }

  str += "}";

  return str;
}

function transformStyle(styles) {
  let str = "{";

  for (let k in styles) {
    if (styles.hasOwnProperty(k)) {
      str = str + k + ":" + transformCSSProperties(styles[k]) + ",";
    }
  }

  str += "}";
  return str;
}

module.exports = function(schema, option) {
  const renderData = {};
  const style = {};

  function parseProps(propValue, isXML) {
    if (/^\{\{.*\}\}$/.test(propValue)) {
      if (isXML) {
        return propValue.slice(2, -2);
      } else {
        return propValue.slice(1, -1);
      }
    }

    if (isXML) {
      return `'${propValue}'`;
    } else {
      return propValue;
    }
  }

  function transform(json) {
    var result = "";

    if (Array.isArray(json)) {
      json.forEach(function(node) {
        result += transform(node);
      });
    } else if (typeof json == "object") {
      var type = json.componentName && json.componentName.toLowerCase();
      var className = json.props && json.props.className;
      var classString = className ? ` style={styles.${className}}` : "";
      switch (type) {
        case "text":
          var innerText = parseProps(json.props.text);
          result += `<Text${classString}>${innerText}</Text>`;
          break;

        case "image":
          var source = parseProps(json.props.src, true);
          result += `<Image${classString} src={${source}}  />`;
          break;
        case "div":
        case "page":
        default:
          if (json.children && json.children.length > 0) {
            result += `<View${classString}>${transform(json.children)}</View>`;
          } else {
            result += `<View${classString} />`;
          }
          break;
      }

      if (className) {
        style[className] = json.props.style;
      }
    }

    return result;
  }

  // transform json
  var jsx = `${transform(schema)}`;

  renderData.modClass = `
    const Mod = () => {
      return (
        ${jsx}
      );
    }
  `;

  renderData.style = `var styles = ${transformStyle(style)};`;
  renderData.exports = `export default Mod;`;

  const prettierOpt = {
    parser: "babel",
    printWidth: 80,
    singleQuote: true
  };

  return {
    renderData: renderData,
    prettierOpt: prettierOpt
  };
};
