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

function transformPropValue(propName, propValue, type) {
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
  } else if (propName === "fontFamily") {
    return "";
  } else if (propName === "type") {
    return "";
  } else {
    if (type === "text" && propName === "width") {
      return "";
    }
    const isPX = shouldTranformPX(propName, propValue);
    return `${propName}: ${
      isPX ? transformPX(getPX(propValue)) : propValueJS
    },`;
  }
}

const shouldIgnoreOnReactNativeProp = [
  "boxSizing",
  "whiteSpace",
  "textOverflow",
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
  "marginBottom",
  "fontSize",
];

/**
 *
 * @param {React.CSSProperties} CSSProperties
 */
function transformCSSProperties(CSSProperties, type) {
  let str = "{";
  for (let key in CSSProperties) {
    str += transformPropValue(key, CSSProperties[key], type);
  }

  str += "}";

  return str;
}

function transformStyle(styles) {
  let str = "";

  for (let k in styles) {
    if (styles.hasOwnProperty(k)) {
      str =
        str +
        "export const " +
        k +
        ": React.CSSProperties = " +
        transformCSSProperties(styles[k], styles[k].type) +
        ";";
    }
  }

  return str;
}

module.exports = function(schema, option) {
  const { _ } = option;
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
    var comProps = {};

    if (Array.isArray(json)) {
      json.forEach(function(node) {
        const res = transform(node);
        result += res.result;
        Object.assign(comProps, res.props);
      });
    } else if (typeof json == "object") {
      var type = json.componentName && json.componentName.toLowerCase();
      var className = json.props && json.props.className;
      var classString = className ? ` style={styles.${className}}` : "";
      switch (type) {
        case "text":
          var innerText = parseProps(json.props.text);
          comProps[className] = innerText;
          result += `<Text${classString}>{props.${className}}</Text>`;
          break;

        case "image":
          var source = parseProps(json.props.src, true);
          comProps[`${className}Img`] = source;
          result += `<Image${classString} src={props.${className}Img}  />`;
          break;
        case "div":
        case "page":
        default:
          if (json.children && json.children.length > 0) {
            const res1 = transform(json.children);
            Object.assign(comProps, res1.props);
            result += `<View${classString}>${res1.result}</View>`;
          } else {
            result += `<View${classString} />`;
          }
          break;
      }

      if (className) {
        style[className] = {
          ...json.props.style,
          type,
        };
      }
    }

    return { result, props: comProps };
  }

  const { result, props } = transform(schema);
  // transform json
  var jsx = `${result}`;

  renderData.modClass = `
    const mockProps = ${JSON.stringify(props)}

    const Mod = (props = mockProps) => {
      return (
        ${jsx}
      );
    }
  `;

  renderData.style = `${transformStyle(style)};`;
  renderData.exports = `export default Mod;`;

  const tsx = `
  import Taro from '@tarojs/taro';
  import { View, Image, Text } from '@tarojs/components';
  import * as styles from './index.module.scss';

  ${renderData.modClass}

  export default Mod;
`;

  const generateLess = (schema) => {
    let strLess = "";

    function walk(json) {
      if (json.props.className) {
        let className = json.props.className;

        strLess += `.${className} {`;

        for (let key in style[className]) {
          // console.log(style[className])
          strLess += `${_.kebabCase(key)}: ${style[className][key]};\n`;
        }
      }

      if (json.children && json.children.length > 0) {
        json.children.forEach((child) => walk(child));
      }

      if (json.props.className) {
        strLess += "}";
      }
    }

    walk(schema);

    return strLess;
  };

  const prettierOpt = {
    parser: "babel",
    printWidth: 80,
    singleQuote: true,
  };

  return {
    panelDisplay: [
      {
        panelName: "index.tsx",
        panelValue: option.prettier.format(tsx, prettierOpt),
        panelType: "tsx",
      },
      {
        panelName: `index.module.scss`,
        panelValue: option.prettier.format(generateLess(schema), {
          parser: "scss",
        }),
        panelType: "scss",
      },
      {
        panelName: `index.config.ts`,
        panelValue: option.prettier.format(
          `export default {
          navigationBarTitleText: '',
        }`,
          prettierOpt
        ),
        panelType: "ts",
      },
    ],
    noTemplate: true,
    prettierOpt: prettierOpt,
  };
};
