import { NavbarProfile } from "./NavbarProfile";
import { NotificationsList } from "./NotificationsList";

export const NavbarActions = () => {
  return (
    <div className="flex items-center space-x-4">
      <NotificationsList />
      <NavbarProfile />
    </div>
  );
};