import ClientPage from "./client-page";

export default function Home() {
  return (
    <div className="grid items-center justify-items-center min-h-screen min-w-full lg:min-w-xl font-[family-name:var(--font-geist-sans)]">
      <main className="min-h-screen min-w-full flex flex-col items-center justify-center bg-gray-50">
        <ClientPage />
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        dsouzaalfred
      </footer>
    </div>
  );
}
