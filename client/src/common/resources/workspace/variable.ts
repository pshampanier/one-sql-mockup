import { UnionValues } from "@/utils/types";
import { serializable } from "@/utils/serializable";
import { deserializeString, deserializeInteger } from "@/utils/serializers";

type VariableType = "text" | "boolean" | "date" | "timestamp" | "float" | "integer" | "secret";
const VARIABLE_TYPES: UnionValues<VariableType>[] = [
  "text",
  "boolean",
  "date",
  "timestamp",
  "float",
  "integer",
  "secret",
];

type VariableValueType = boolean | bigint | number | string | Date | undefined;

type VariableProps = {
  value?: VariableValueType;
};

export class Variable {
  @serializable("string", { format: "identifier", required: true })
  readonly name!: string;

  @serializable("string", { format: new RegExp(`^${VARIABLE_TYPES.join("|")}$`), required: true })
  readonly type!: VariableType;

  @serializable("any", { name: "value", dependencies: "type" })
  private _value?: VariableValueType;

  constructor();
  constructor(name: string, type: VariableType, props?: VariableProps);
  constructor(...args: unknown[]) {
    if (args.length > 1) {
      const [name, type, props] = args as [string, VariableType, VariableProps];
      this.name = name;
      this.type = type;
      this._value = props?.value;
    }
  }

  clone(): Readonly<Variable> {
    return Object.freeze(new Variable(this.name, this.type, { value: this.value }));
  }

  set value(value: unknown) {
    if (value === undefined) {
      this._value = undefined;
    } else {
      switch (this.type) {
        case "text":
        case "secret":
          this._value = deserializeString(value, { name: "value" });
          break;
        case "integer":
          this._value = deserializeInteger(value, { name: "value" });
          break;
        case "boolean":
        case "date":
        case "timestamp":
        case "float":
          // TODO
          throw "NOT YET IMPLEMENTED";
      }
    }
  }

  get value(): VariableValueType {
    return this._value;
  }
}
