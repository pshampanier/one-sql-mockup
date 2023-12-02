import { useUserStore } from "../../../stores/UserStore";
import { useWorkspaceStore } from "../../../stores/WorkspaceStore";
import { Workspace } from "../../../resources/workspace/workspace";
import { User, UserCollectionItem } from "../../../resources/user/user";

import SidebarItem from "../SidebarItem";

import FolderIcon from "../../../assets/folder.svg?react";
import WorkspaceIcon from "../../../assets/workspace.svg?react";

type SidebarUserFolderProps = {
  item: UserCollectionItem;
};

export default function SidebarUserCollectionItem({ item }: SidebarUserFolderProps) {
  const props = {
    id: item.id,
    label: item.name,
  };

  const { setUserCollectionItems, setActiveSpace } = useUserStore();
  const reset = useWorkspaceStore().reset;

  function loadCollectionItem(): Promise<void> {
    const user = User.current;
    switch (item.type) {
      case "workspace": {
        return user.loadCollectionItem<Workspace>(item.id).then((workspace) => {
          console.log("Workspace loaded: ", workspace);
          reset();
          setActiveSpace("workspace");
        });
      }
      case "folder": {
        return user.loadCollectionItem(item.id).then(() => {
          setUserCollectionItems(user.collections);
        });
      }
    }
  }

  switch (item.type) {
    case "workspace":
      return <SidebarItem {...props} loaderfn={loadCollectionItem} icon={WorkspaceIcon} />;
    case "folder": {
      return (
        <SidebarItem {...props} loaderfn={loadCollectionItem} icon={FolderIcon} collapsible>
          {item.children?.map((child: UserCollectionItem) => {
            return <SidebarUserCollectionItem key={child.id} item={child} />;
          })}
        </SidebarItem>
      );
    }
  }
}
