import SchoolLoadingScreen from "../../components/SchoolLoadingScreen";

export default function LoadingScreen({ title, subtitle, schoolKey }: { title: string; subtitle?: string; schoolKey?: string | null }) {
  return <SchoolLoadingScreen title={title} subtitle={subtitle} schoolKey={schoolKey} />;
}
