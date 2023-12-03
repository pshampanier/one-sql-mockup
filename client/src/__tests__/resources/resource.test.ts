import { Resource } from "@/resources/resource";
import { test, expect } from "vitest";
import { serializable } from "@/utils/serializable";

test("deserialize (valid)", () => {
  class Test {
    @serializable("integer")
    val?: number;
  }

  expect(new Resource<Test>("application/json", JSON.stringify({ val: 42 })).as(Test).val).toBe(42);
  expect(new Resource<Test>("application/json", JSON.stringify({})).as(Test).val).toBeUndefined();
});

test("deserialize (invalid)", () => {
  class Test {
    @serializable("integer")
    val?: number;
  }

  expect(() => new Resource<Test>("application/json", "{").as(Test).val).toThrowError();
  expect(() => new Resource<Test>("text/plain", "").as(Test).val).toThrowError(/No data available/);
  expect(() => new Resource<Test>("text/plain", "{}").as(Test).val).toThrowError(
    /Expecting 'content-type: application\/json'/
  );
});

test("Non serializable object", () => {
  // A class that does not have at least one @serializable property cannot be deserialized
  class NonSerializableClass {
    val?: number;
  }

  expect(
    () =>
      new Resource<NonSerializableClass>("application/json", JSON.stringify({ val: 42 })).as(NonSerializableClass).val
  ).toThrowError(/Unexpected property 'val'/);
});
