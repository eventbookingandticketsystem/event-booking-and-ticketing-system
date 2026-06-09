export default function ValidationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-brand-navy">
      {children}
    </div>
  );
}
