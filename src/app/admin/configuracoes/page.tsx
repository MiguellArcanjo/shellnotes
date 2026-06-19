import type { Metadata } from 'next';
import AdminSettings from '@/components/admin/AdminSettings';

export const metadata: Metadata = {
  title: 'Configurações — Admin — shellnotes',
  description: 'Configurações globais do shellnotes.',
};

export default function Page() {
  return <AdminSettings />;
}
