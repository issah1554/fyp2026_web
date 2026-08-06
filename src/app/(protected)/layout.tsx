import { AppLayout } from "./_components/layout/AppLayout";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AppLayout>{children}</AppLayout>;
}
