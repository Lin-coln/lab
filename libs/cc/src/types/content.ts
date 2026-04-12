export interface Content {
  text: Content.Text;
}

export namespace Content {
  export type Text = { type: "text"; text: string };
}
