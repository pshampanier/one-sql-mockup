export type ObjectFactoryFunction<T extends object> = (...args: unknown[]) => T;
export type ObjectFactoryConstructor<T extends object> = new (...args: unknown[]) => T;
export type ObjectFactory<T extends object> = ObjectFactoryConstructor<T> | ObjectFactoryFunction<T>;

// An utility type to get all possible values of an union type
export type UnionValues<T> = T extends T ? T : never;
