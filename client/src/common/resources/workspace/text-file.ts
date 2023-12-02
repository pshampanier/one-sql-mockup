import { ResourceRef } from "../resource-ref";

export class TextFile {
  content: string;
  ref?: ResourceRef;

  constructor(content: string, ref: ResourceRef) {
    this.content = content;
    this.ref = ref;
  }
}
