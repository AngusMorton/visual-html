declare global {
  interface CSSRule {
    selectorText: string;
  }
}

export interface VisualData {
  tagName: string;
  attributes: Array<{ name: string; value: string | boolean | null }> | null;
  styles: { [x: string]: string } | null;
  pseudoStyles: { [x: string]: { [x: string]: string } } | null;
  children: Array<VisualData | string> | null;
  globalStyles?: { [x: string]: string } | null;
  globalPseudoStyles?: { [x: string]: { [x: string]: string } } | null;
  globalRootStyles?: { [x: string]: string } | null;
}
export interface Options {
  shallow?: boolean;
}

export interface SelectorWithStyles {
  selectorText: string;
  style: CSSStyleDeclaration;
}

export interface GlobalStyles {
  elementStyles: { [property: string]: string } | null;
  pseudoStyles: { [pseudo: string]: { [property: string]: string } } | null;
  rootStyles: { [property: string]: string } | null;
}
