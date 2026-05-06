import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";

import MobileHeader from "../../components/MobileHeader/MobileHeader";
import PageSkeleton from "../../components/PageSkeleton/PageSkeleton";
import { useApp } from "../../contexts/AppContext";
import styles from "./AdminLayout.module.scss";
import { BottomActionBar } from "./BottomActionBar";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isCollapsed, setIsCollapsed, isMobile } = useApp();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.adminLayout}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} isCollapsed={isCollapsed} onCollapsedChange={setIsCollapsed} isMobile={isMobile} />
      <div className={`${styles.mainContent} ${isCollapsed && !isMobile ? styles.sidebarCollapsed : ""}`}>
        <Header onMenuClick={toggleSidebar} />
        {isMobile && <MobileHeader />}
        <main className={styles.contentArea}>
          <div className={styles.contentWrapper}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
          <BottomActionBar />
        </main>
      </div>
    </div>
  );
};
