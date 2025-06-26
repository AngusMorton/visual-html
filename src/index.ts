import { VisualData, Options, SelectorWithStyles, GlobalStyles } from "./types";
import { stringifyVisualData } from "./stringify";
import { getVisualAttributes } from "./attributes";
import {
  getDocumentStyleRules,
  getElementStyles,
  getPseudoElementStyles,
  extractGlobalStyles,
} from "./stylesheets";

export { VisualData, Options };

const ELEMENT_TYPE = 1;
const TEXT_TYPE = 3;

/**
 * Given an element, returns a string of HTML text containing only
 * attributes and styles that convey visual information.
 */
export default function visualHTML(el: Element, options: Options = {}) {
  const styleRules = getDocumentStyleRules(el.ownerDocument!);
  const globalStyles = extractGlobalStyles(styleRules);

  return stringifyVisualData(
    getVisualData(el, {
      ...options,
      styleRules,
      globalStyles,
    })
  );
}

/**
 * Given an element, returns an object with information about the visual aspects
 * including styles, psuedo elements, and text content of the element.
 */
function getVisualData<T extends Element>(
  el: T,
  options: Options & {
    styleRules: SelectorWithStyles[];
    globalStyles?: GlobalStyles | null;
  },
  isRoot: boolean = true
) {
  const window = el.ownerDocument!.defaultView!;
  let childrenVisualData: Array<VisualData | string> | null = null;

  if (window.getComputedStyle(el).display === "none") {
    return null;
  }

  if (!options.shallow && el.firstChild) {
    let curNode: ChildNode | null = el.firstChild;
    childrenVisualData = [];

    do {
      switch (curNode.nodeType) {
        case ELEMENT_TYPE:
          const childDisplayData = getVisualData(
            curNode as Element,
            options,
            false
          );
          if (childDisplayData) {
            childrenVisualData.push(childDisplayData);
          }
          break;
        case TEXT_TYPE:
          childrenVisualData.push(curNode!.nodeValue as string);
          break;
      }

      curNode = curNode.nextSibling;
    } while (curNode);
  }

  const elementStyles = getElementStyles(el, options.styleRules);
  const pseudoElementStyles = getPseudoElementStyles(el, options.styleRules);

  let filteredStyles = elementStyles;
  let filteredPseudoStyles = pseudoElementStyles;
  let globalStyles: { [property: string]: string } | null = null;
  let globalPseudoStyles: {
    [pseudo: string]: { [property: string]: string };
  } | null = null;
  let globalRootStyles: { [property: string]: string } | null = null;

  // Only include global styles at the root element, but filter them from all elements
  if (options.globalStyles) {
    if (isRoot) {
      globalStyles = options.globalStyles.elementStyles;
      globalPseudoStyles = options.globalStyles.pseudoStyles;
      globalRootStyles = options.globalStyles.rootStyles;
    }

    // Filter out global styles from element styles for all elements
    if (filteredStyles && options.globalStyles.elementStyles) {
      filteredStyles = { ...filteredStyles };
      for (const prop in options.globalStyles.elementStyles) {
        if (filteredStyles[prop] === options.globalStyles.elementStyles[prop]) {
          delete filteredStyles[prop];
        }
      }
      if (Object.keys(filteredStyles).length === 0) {
        filteredStyles = null;
      }
    }

    // Filter out global pseudo styles from all elements
    if (filteredPseudoStyles && options.globalStyles.pseudoStyles) {
      filteredPseudoStyles = { ...filteredPseudoStyles };
      for (const pseudo in options.globalStyles.pseudoStyles) {
        if (filteredPseudoStyles[pseudo]) {
          const filtered = { ...filteredPseudoStyles[pseudo] };
          for (const prop in options.globalStyles.pseudoStyles[pseudo]) {
            if (
              filtered[prop] === options.globalStyles.pseudoStyles[pseudo][prop]
            ) {
              delete filtered[prop];
            }
          }
          if (Object.keys(filtered).length === 0) {
            delete filteredPseudoStyles[pseudo];
          } else {
            filteredPseudoStyles[pseudo] = filtered;
          }
        }
      }
      if (Object.keys(filteredPseudoStyles).length === 0) {
        filteredPseudoStyles = null;
      }
    }
  }

  return {
    tagName: el.tagName,
    styles: filteredStyles,
    pseudoStyles: filteredPseudoStyles,
    attributes: getVisualAttributes(el),
    children: childrenVisualData,
    globalStyles,
    globalPseudoStyles,
    globalRootStyles,
  } as VisualData;
}
