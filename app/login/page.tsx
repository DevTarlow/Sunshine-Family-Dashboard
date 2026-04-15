import { getMembers } from "@/app/actions";
import LoginPage from "./LoginPage";

export default async function Page() {
  const members = await getMembers();
  return <LoginPage members={members} />;
}
