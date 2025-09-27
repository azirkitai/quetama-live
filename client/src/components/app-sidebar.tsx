import {
  LayoutDashboard,
  Settings,
  UserPlus,
  Users,
  ClipboardList,
  UserCog,
  Shield,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "wouter";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Management",
    url: "/management",
    icon: Settings,
  },
  {
    title: "Register",
    url: "/register",
    icon: UserPlus,
  },
  {
    title: "Queue",
    url: "/queue",
    icon: ClipboardList,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: UserCog,
  },
  {
    title: "Account",
    url: "/account",
    icon: Users,
  },
  {
    title: "Administration",
    url: "/administration",
    icon: Shield,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  const handleLogout = () => {
    console.log("Logout triggered");
    // TODO: Remove mock functionality - implement real logout
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Sistem Panggilan Klinik</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              data-testid="button-logout"
              className="text-destructive hover:text-destructive"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}