export function injectDefaultStyles() {
  const identifier = "electron-default-styles";

  let css = document.head.querySelector(`style[${identifier}]`);
  if (!css) {
    css = document.createElement("style");
    css.setAttribute("type", "text/css");
    css.setAttribute(identifier, "");
    document.head.append(css);
  }

  Array.from(css.childNodes).forEach((child) => css.removeChild(child));
  css.appendChild(
    document.createTextNode(
      genCssContent()
        .split("\n")
        .map((x) => x.slice(Math.min(x.length, 4)))
        .join("\n"),
    ),
  );

  function genCssContent() {
    return `
    /* electron */
    *:where(body) {
      -webkit-app-region: drag;
    }
    *:where(body > *) {
      -webkit-app-region: no-drag;
    }
    * {
      user-select: none;
    }
    `;
  }
}
