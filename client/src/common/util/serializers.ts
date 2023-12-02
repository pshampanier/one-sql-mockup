export class SerialisationError extends Error {
  original: unknown;
  context?: string;

  constructor(message: string | Error | unknown) {
    super(undefined);
    this.original = message;
  }

  get message(): string {
    let message: string;
    if (this.original instanceof Error) {
      message = this.original?.message;
    } else {
      message = (this.original as unknown)?.toString() ?? "";
    }
    if (this.context) {
      if (/[[.]/.test(this.context)) {
        // The context is a path such as a.b[0]
        message += ` at '${this.context}'`;
      } else {
        // The context is a property
        message += ` for the property '${this.context}'`;
      }
    }
    return message;
  }

  addContext(context?: string | number): SerialisationError {
    if (typeof context === "number") {
      this.context = "[" + context + "]" + (this.context ? "." + this.context : "");
    } else if (typeof context === "string" && context.length > 0) {
      this.context = (this.context && !this.context?.startsWith("[") ? context + "." : context) + (this.context ?? "");
    }
    return this;
  }

  static make(error: unknown): SerialisationError {
    if (error instanceof SerialisationError) {
      return error;
    } else {
      return new SerialisationError(error);
    }
  }
}

export function safeDeserialization<T>(
  callbackfn: (...args: any[]) => NonNullable<T>,
  key?: string | number,
  ...args: unknown[]
) {
  try {
    return callbackfn(...args, key);
  } catch (e) {
    throw SerialisationError.make(e).addContext(key);
  }
}

type DeserializeNumberOptions<T> = {
  readonly name?: string;
  readonly min?: T;
  readonly max?: T;
};

/**
 *
 * @param value the value to be validated.
 * @param options
 * @throws {@link SerialisationError} if the value does not meet the options.
 */
function validateNumber<T>(value: T, options: DeserializeNumberOptions<T>): void {
  if (options.min !== undefined && options.min !== null && value < options.min) {
    throw new SerialisationError(`${value} is invalid, should be at least ${options.min}`);
  } else if (options.max !== undefined && options.max !== null && value > options.max) {
    throw new SerialisationError(`${value} is invalid, should be at most ${options.max}`);
  }
}

/**
 * Deserialize a value as an integer
 * @param value
 * @param options
 * @returns
 */
export function deserializeInteger(value: unknown, options?: DeserializeNumberOptions<number>): number {
  return safeDeserialization<number>(() => {
    let i: number | undefined;
    if (typeof value === "number") {
      i = value as number;
    } else if (typeof value === "string" && /^[\s]*[+-]?[\s,0-9]+\s*$/.test(value)) {
      i = parseInt(value?.replace(/[\s,]/g, ""));
    }
    if (i === undefined || isNaN(i)) {
      throw new SerialisationError(`'${value || ""}' is not a valid integer`);
    } else if (options) {
      validateNumber(i, options);
    }
    return i;
  }, options?.name);
}

export type DeserializeBooleanOptions = {
  readonly name?: string;
};

export function deserializeBoolean(value: unknown, options?: DeserializeBooleanOptions): boolean {
  return safeDeserialization<boolean>(() => {
    if (typeof value === "boolean") {
      return value as boolean;
    } else if (typeof value === "string") {
      const s = value as string;
      if (s === "true") {
        return true;
      } else if (s === "false") {
        return false;
      }
    }
    throw new SerialisationError(`'${value || ""}' is not a valid boolean`);
  }, options?.name);
}

export type DeserializeStringFormatFunction = (value: string) => string;

export type DeserializeStringFormatOption = RegExp | "identifier" | "uuid" | DeserializeStringFormatFunction;

type DeserializeStringOptions = {
  readonly name?: string;
  readonly format?: DeserializeStringFormatOption;
  readonly trim?: boolean;
};

export function deserializeString(value: unknown, options?: DeserializeStringOptions): string {
  return safeDeserialization<string>(() => {
    let s: string | undefined;
    if (typeof value === "string") {
      s = value as string;
      options?.trim && (s = s.trim());
      if (typeof options?.format === "function") {
        s = options.format(s);
      } else if (options?.format != undefined) {
        let regExp: RegExp;
        switch (options.format) {
          case "identifier": {
            !options.trim && (s = s.trim());
            regExp = /^[_a-zA-Z]+[_a-zA-Z0-9]*$/;
            break;
          }
          case "uuid": {
            !options.trim && (s = s.trim());
            s = s.trim();
            regExp = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
            break;
          }
          default: {
            regExp = options.format;
            break;
          }
        }
        !regExp.test(s) && (s = undefined);
      }
      if (s !== undefined && s !== null) {
        return s;
      }
    }
    const expectedFormat = typeof options?.format === "string" ? ` (expected format: '${options.format}')` : "";
    throw new SerialisationError(`'${value || ""}' is not valid${expectedFormat}`);
  }, options?.name);
}

/**
 * Options of the {@link deserializeObject} function.
 *
 * @param name - The name of the object used for additionnal information if an error is thrown.
 * @param required - An array of required properties in the object.
 * @param thisArg - A value to use as this when executing `callbackfn`.
 */
export type DeserializeObjectOptions = {
  readonly name?: string;
  readonly required?: string[];
  readonly thisArg?: unknown;
  readonly dependencies?: { [key: string]: string[] };
};

/**
 * @callback deserializeObject~callbackfn
 *
 * @param property - String-keyed property key-value pairs. Each key-value pair is an array with two elements: the first
 *                   element is the property key, and the second element is the property value.
 * @param index - The index of the property in `array`.
 * @param array - The array of all properties.
 * @return The deserialized value. If called with an unexpected key, the callback can return the `null` value to
 *         {@link deserializeObject} which will throw an explicit `SerialisationError`.
 */
type deserializeObjectCallbackfn = (
  property: [key: string, value: unknown],
  index: number,
  array: [key: string, value: unknown][]
) => unknown;

/**
 * Deserialize an object.
 *
 * Takes a {@link value} expected to be an object and execute a callback for each of its properties. The callback is
 * responsible to transform & assign the property.
 *
 * @param value - The object to be deserialized.
 * @param callbackfn - A function to execute for each property of the given object. Its return value is the deserialized
 *                     value for the property it has been called for, and is used to check for unexpected and required
 *                     properties.
 * @param options - Options.
 * @throws A {@link SerialisationError} if:
 * - The given `value` is not an object.
 * - An unexpected key is found.
 * - A required property is missing.
 */
export function deserializeObject(
  value: unknown,
  callbackfn: deserializeObjectCallbackfn,
  options?: DeserializeObjectOptions
): void {
  safeDeserialization<object>(() => {
    let o: object | undefined;
    if (typeof value === "object") {
      o = value as object;
    }
    if (o === undefined) {
      throw new SerialisationError(`'${value || ""}' is not valid, object expected`);
    }

    // We need to make a copy of required properties array because we are going to alter it.
    const required: string[] = [...(options?.required ?? [])];

    // Get all key-value properties of the object to be deserialized. If there are some dependencies, we need to make
    // sure those key-value properties will be deserialized in the right order to satisfy the dependencies.
    const entries = Object.entries(o);
    const dependencies = options?.dependencies ?? [];

    Object.entries(dependencies).forEach(([property, dependsOn]) => {
      let propertyIndex = entries.findIndex(([k]) => {
        return k === property;
      });
      if (propertyIndex === -1) {
        // The property 'property' as dependencies but since that property is not available in the object about to be
        // deserialized, we don't have to worry about it dependencies.
        return;
      }
      dependsOn.forEach((dependancy: string) => {
        const dependancyIndex = entries.findIndex(([k]) => {
          return k === dependancy;
        });
        if (dependancyIndex === -1) {
          throw `The property '${property}' depends on '${dependancy}' which is not available`;
        } else if (dependancyIndex > propertyIndex) {
          // Push the dependancy right in front of the dependant property.
          entries.splice(propertyIndex, 0, entries.splice(dependancyIndex, 1)[0]);
          propertyIndex++;
        }
      });
    });

    entries.forEach(([k, v], index, array) => {
      const r = callbackfn.call(options?.thisArg, [k, v], index, array);
      const i = required.indexOf(k);
      if (r === null) {
        // The callback has returned a null value indicating that property was not expected.
        throw new SerialisationError(`Unexpected property '${k}'`);
      } else if (i != -1 && r !== undefined && !(typeof r === "string" && r.length === 0)) {
        // This is a required property and it has a value so we can remove it from the required list.
        required.splice(i, 1);
      }
    });

    // Checking if we have required properties that have been not found in the value to be deserialized.
    if (required.length > 0) {
      throw new SerialisationError(`'${required.join("', '")}' of the required properties missing`);
    }

    return options?.thisArg as object;
  }, options?.name);
}

type DeserializeArrayOptions = {
  readonly name?: string;
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly thisArg?: unknown;
};

export function deserializeArray<T>(
  value: unknown,
  callbackfn: (item: unknown, index: number, array: unknown) => T,
  options?: DeserializeArrayOptions
): T[] {
  return safeDeserialization<Array<T>>(() => {
    if (!Array.isArray(value)) {
      throw new SerialisationError(`'${value || ""}' is not an array`);
    }
    const a = value as Array<unknown>;
    if (options?.minSize != undefined && options?.minSize != null && a.length < options.minSize) {
      throw new SerialisationError(`Expecting at least ${options.minSize} item(s)`);
    }
    if (options?.maxSize != undefined && options?.maxSize != null && a.length > options.maxSize) {
      throw new SerialisationError(`Expecting at most ${options.maxSize} item(s)`);
    }
    const r = new Array<T>();
    a.forEach((item: unknown, index: number, array: unknown) => {
      try {
        r.push(callbackfn(item, index, array));
      } catch (e) {
        throw SerialisationError.make(e).addContext(index);
      }
    }, options?.thisArg);
    return r;
  }, options?.name);
}
