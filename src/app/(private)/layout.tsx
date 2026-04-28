import { LayoutWrapper } from '@/components/LayoutWrapper';

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
