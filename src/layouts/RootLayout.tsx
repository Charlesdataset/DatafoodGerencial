import { Outlet } from "react-router-dom";
import { Header } from "../components/Header/Header";
import styles from "./RootLayout.module.scss";

export function RootLayout() {
  return (
    <div className={styles.root}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
