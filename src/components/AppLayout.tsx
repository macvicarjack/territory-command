import TopNav from "./TopNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <TopNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
