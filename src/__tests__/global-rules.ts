import visualHTML from "..";

const { matchMedia: _matchMedia } = window;
const { supports: _supports } =
  window.CSS ||
  (window.CSS = {
    supports() {
      return false;
    },
  } as any);

afterEach(() => {
  window.matchMedia = _matchMedia;
  CSS.supports = _supports;
});

test("applies universal selector", () => {
  const html = `
    <div class="test">
      <span>Content</span>
    </div>
  `;

  const styles = `
    * {
      margin: 0;
      padding: 0;
    }
  `;

  expect(testHTML(html, styles)).toMatchInlineSnapshot(`
    "<style>
      * {
        margin: 0;
        padding: 0
      }
    </style>
    <div>
      <span>
        Content
      </span>
    </div>"
  `);
});

test("handles mixed global and specific styles correctly", () => {
  const html = `
    <div class="container">
      <span class="highlight">Content</span>
      <p>Paragraph</p>
    </div>
  `;

  const styles = `
    * {
      margin: 0;
      padding: 0;
    }
    
    .container {
      background: blue;
      margin: 10px;
    }
    
    .highlight {
      color: red;
      padding: 5px;
    }

    p {
      font-size: 16px;
    }
  `;

  expect(testHTML(html, styles)).toMatchInlineSnapshot(`
    "<style>
      * {
        margin: 0;
        padding: 0
      }
    </style>
    <div style=\\"
      background: blue;
      margin: 10px
    \\">
      <span style=\\"
        color: red;
        padding: 5px
      \\">
        Content
      </span>
      <p style=\\"font-size: 16px\\">
        Paragraph
      </p>
    </div>"
  `);
});

test("consolidates :root CSS custom properties", () => {
  const html = `
    <div class="container">
      <span class="highlight">Content</span>
    </div>
  `;

  const styles = `
    :root {
      --primary-color: #007bff;
      --secondary-color: #6c757d;
      --font-size: 16px;
    }
    
    .container {
      background: var(--primary-color);
      font-size: var(--font-size);
    }
    
    .highlight {
      color: var(--secondary-color);
    }
  `;

  expect(testHTML(html, styles)).toMatchInlineSnapshot(`
    "<style>
      :root {
        --font-size: 16px;
        --primary-color: #007bff;
        --secondary-color: #6c757d
      }
    </style>
    <div style=\\"
      background: var(--primary-color);
      font-size: var(--font-size)
    \\">
      <span style=\\"color: var(--secondary-color)\\">
        Content
      </span>
    </div>"
  `);
});

test("handles :root and universal selectors in the same rule", () => {
  const html = `
    <div class="container">
      <span>Content</span>
    </div>
  `;

  const styles = `
    *, :root {
      box-sizing: border-box;
    }
    
    :root {
      --primary-color: blue;
    }
    
    * {
      margin: 0;
    }
    
    .container {
      background: var(--primary-color);
    }
  `;

  expect(testHTML(html, styles)).toMatchInlineSnapshot(`
    "<style>
      * {
        box-sizing: border-box;
        margin: 0
      }
      :root {
        --primary-color: blue;
        box-sizing: border-box
      }
    </style>
    <div style=\\"background: var(--primary-color)\\">
      <span>
        Content
      </span>
    </div>"
  `);
});

test("does not hoist contextual global rules", () => {
  const html = `
    <div class="container">
      <span>Content</span>
    </div>
  `;

  const styles = `
    * > * {
      margin: 24px;
    }
  `;

  expect(testHTML(html, styles)).toMatchInlineSnapshot(`
    "<div style=\\"margin: 24px\\">
      <span style=\\"margin: 24px\\">
        Content
      </span>
    </div>"
  `);
});

function testHTML(html: string, styles: string = "") {
  const div = document.createElement("div");
  const style = document.createElement("style");
  style.innerHTML = styles;
  div.innerHTML = html;
  document.head.appendChild(style);
  document.body.appendChild(div);
  const result = Array.from(div.children)
    .map((el) => visualHTML(el))
    .join("\n");
  document.body.removeChild(div);
  document.head.removeChild(style);
  return result;
}
