import { User, UserCollectionItem, findUserCollectionItem } from "../../resources/user/user";
import { test, expect } from "vitest";
import { deserialize } from "../../util/serializable";

test("valid user", () => {
  expect(
    deserialize<User>(
      {
        username: "marty",
      },
      User
    )
  ).toEqual({
    username: "marty",
    activeSpace: "user",
    settings: {
      editor: {
        minimap: "auto",
        renderWhitespace: "none",
      },
      showFavorites: true,
      showRecentlyOpened: true,
      telemetry: true,
      theme: "light",
    },
    collections: [],
    favorites: [],
    recentlyOpened: [],
  });
});

test("invalid user", () => {
  expect(() =>
    deserialize<User>(
      {
        username: "ma rty",
      },
      User
    )
  ).toThrowError(/'ma rty' is not valid/);
});

test("constructor", () => {
  expect(new User("marty")).toEqual({
    username: "marty",
    activeSpace: "user",
    settings: {
      editor: {
        minimap: "auto",
        renderWhitespace: "none",
      },
      showFavorites: true,
      showRecentlyOpened: true,
      telemetry: true,
      theme: "light",
    },
    collections: [],
    favorites: [],
    recentlyOpened: [],
  });
});

test("find workspace", () => {
  const userCollections: UserCollectionItem[] = [
    { id: "1", type: "workspace", name: "workspace 1", children: [] },
    {
      id: "2",
      type: "folder",
      name: "folder 2",
      children: [
        { id: "4", type: "workspace", name: "workspace 4", children: [] },
        {
          id: "5",
          type: "folder",
          name: "folder 5",
          children: [
            { id: "6", type: "workspace", name: "workspace 6", children: [] },
            { id: "7", type: "folder", name: "folder 7", children: [] },
          ],
        },
      ],
    },
    { id: "3", type: "workspace", name: "workspace 3", children: [] },
  ];

  const w6 = findUserCollectionItem(userCollections, "6");
  expect(w6?.path).toEqual(["folder 2", "folder 5"]);
  expect(w6?.item.id).toBe("6");

  const w1 = findUserCollectionItem(userCollections, "1");
  expect(w1?.path).toEqual([]);
  expect(w1?.item.id).toBe("1");

  const w5 = findUserCollectionItem(userCollections, "5");
  expect(w5?.path).toEqual(["folder 2"]);
  expect(w5?.item.id).toBe("5");

  const w42 = findUserCollectionItem(userCollections, "42");
  expect(w42).toBeNull();
});
