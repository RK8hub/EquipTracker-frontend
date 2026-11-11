import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button, Popup, Sidebar, type SidebarItem } from "./eq-ui";
import { api, configureApi } from "./api/client";
import { errorMessage } from "./hooks";
import { contrastColor } from "./lib/format";
import { getStored, removeStored, setStored } from "./lib/storage";
import { equiptrackerNavigation } from "./eq-ui/domain/navigation";
import { ConnectScreen } from "./screens/Connect";
import { DashboardScreen } from "./screens/Dashboard";
import { EquipmentScreen } from "./screens/Equipment";
import { IncidentsScreen } from "./screens/Incidents";
import { AssignmentsScreen } from "./screens/Assignments";
import { LoginScreen } from "./screens/Login";
import { OperatorsScreen } from "./screens/Operators";
import { SettingsScreen } from "./screens/Settings";
import { Loading } from "./components/Feedback";
import { Overlay } from "./components/Overlay";

type PageId =
  | "dashboard"
  | "operadores"
  | "equipos"
  | "asignaciones"
  | "incidencias"
  | "ajustes";

export function App() {
  const [booting, setBooting] = useState(true);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [accent, setAccent] = useState("#0588f0");
  const [page, setPage] = useState<PageId>("dashboard");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) return;
    void setStored("page", page);
  }, [page]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [storedUrl, storedToken, storedEmail, storedPage, storedCompany] = await Promise.all([
        getStored<string>("baseUrl"),
        getStored<string>("token"),
        getStored<string>("email"),
        getStored<string>("page"),
        getStored<string>("company"),
      ]);
      if (!active) return;
      configureApi({ baseUrl: storedUrl ?? "", token: storedToken });
      setBaseUrl(storedUrl);
      setToken(storedToken);
      setEmail(storedEmail ?? "");
      if (storedPage) setPage(storedPage as PageId);
      setCompanyName(storedCompany ?? "");
      const storedTheme = await getStored<"dark" | "light">("theme");
      document.documentElement.classList.toggle("dark", (storedTheme ?? "dark") === "dark");
      const storedAccent = await getStored<string>("accent");
      if (storedAccent) {
        setAccent(storedAccent);
        document.documentElement.style.setProperty("--eq-brand", storedAccent);
        document.documentElement.style.setProperty("--eq-accent", storedAccent);
        document.documentElement.style.setProperty("--eq-brand-foreground", contrastColor(storedAccent));
      }
      hydrated.current = true;
      setBooting(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      if (!token) return;
      void removeStored("token");
      void removeStored("page");
      configureApi({ token: null });
      setToken(null);
      setPage("dashboard");
      toast.error("Sesión expirada. Inicia sesión de nuevo.");
    };
    window.addEventListener("eq:unauthorized", handler);
    return () => window.removeEventListener("eq:unauthorized", handler);
  }, [token]);

  async function handleConnected(url: string) {
    await setStored("baseUrl", url);
    await removeStored("token");
    await removeStored("email");
    configureApi({ baseUrl: url, token: null });
    setBaseUrl(url);
    setToken(null);
    setEmail("");
  }

  async function handleLoggedIn(nextToken: string, nextEmail: string) {
    await setStored("token", nextToken);
    await setStored("email", nextEmail);
    configureApi({ token: nextToken });
    setToken(nextToken);
    setEmail(nextEmail);
  }

  async function handleLogout() {
    await removeStored("token");
    await removeStored("email");
    await removeStored("page");
    configureApi({ token: null });
    setToken(null);
    setEmail("");
    setPage("dashboard");
  }

  async function handleChangeServer() {
    await removeStored("baseUrl");
    await removeStored("token");
    await removeStored("email");
    await removeStored("page");
    configureApi({ baseUrl: "", token: null });
    setBaseUrl(null);
    setToken(null);
    setEmail("");
    setPage("dashboard");
  }

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loading />
      </div>
    );
  }

  if (!baseUrl) {
    return <ConnectScreen onConnected={handleConnected} />;
  }

  if (!token) {
    return (
      <LoginScreen
        baseUrl={baseUrl}
        onLoggedIn={handleLoggedIn}
        onChangeServer={handleChangeServer}
      />
    );
  }

  const items: SidebarItem[] = equiptrackerNavigation.map((item) => ({
    ...item,
    active: item.id === page,
  }));

  let screen = <DashboardScreen />;
  if (page === "operadores") screen = <OperatorsScreen />;
  else if (page === "equipos") screen = <EquipmentScreen />;
  else if (page === "asignaciones") screen = <AssignmentsScreen />;
  else if (page === "incidencias") screen = <IncidentsScreen />;
  else if (page === "ajustes")
    screen = (
      <SettingsScreen
        baseUrl={baseUrl!}
        companyName={companyName}
        accent={accent}
        onCompanyChange={async (value) => {
          await setStored("company", value);
          setCompanyName(value);
        }}
        onAccentChange={async (value) => {
          await setStored("accent", value);
          document.documentElement.style.setProperty("--eq-brand", value);
          document.documentElement.style.setProperty("--eq-accent", value);
          document.documentElement.style.setProperty("--eq-brand-foreground", contrastColor(value));
        }}
        onLogout={handleLogout}
      />
    );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        className="h-full shrink-0"
        workspace={{
          name: "EquipTracker",
          company: companyName || email.split("@")[1] || baseUrl || "",
        }}
        user={{ name: email.split("@")[0] || "Usuario", email }}
        items={items}
        onNavigate={(id) => setPage(id as PageId)}
        onUserClick={() => setPage("ajustes")}
      />
      <main className="flex-1 overflow-y-auto p-8">{screen}</main>
    </div>
  );
}
